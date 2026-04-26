"""
Smart Document Review — AI-powered document review using GPT-4o.
Uploads documents, extracts text, and performs real legal analysis.
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import Optional
import uuid
import json
import os
from datetime import datetime, timezone
from pathlib import Path

from app.services.ai_analyzer import extract_text_from_file, review_document_with_ai

router = APIRouter()

REVIEWS_FILE = Path(__file__).parent.parent.parent / "data" / "reviews.json"
UPLOAD_DIR = Path(__file__).parent.parent.parent / "data" / "uploads"
SAMPLE_REVIEWS_FILE = Path(__file__).parent.parent.parent / "data" / "datasets" / "samples" / "document_reviews.json"


def load_sample_reviews():
    """Load pre-analyzed sample reviews for demonstration."""
    if not SAMPLE_REVIEWS_FILE.exists():
        return []
    try:
        with open(SAMPLE_REVIEWS_FILE, "r") as f:
            data = json.load(f)
            return data.get("reviews", [])
    except (json.JSONDecodeError, IOError):
        return []


def load_reviews(include_samples: bool = True):
    """Load reviews from storage, optionally including sample data for demonstration."""
    real_reviews = []
    if REVIEWS_FILE.exists():
        with open(REVIEWS_FILE, "r") as f:
            real_reviews = json.load(f)

    if include_samples:
        # Combine sample reviews with real reviews
        sample_reviews = load_sample_reviews()
        # Avoid duplicates by ID
        real_ids = {r["id"] for r in real_reviews}
        combined = real_reviews + [s for s in sample_reviews if s["id"] not in real_ids]
        return combined

    return real_reviews


def save_reviews(reviews):
    REVIEWS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(REVIEWS_FILE, "w") as f:
        json.dump(reviews, f, indent=2, default=str)


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload a document for AI review and analysis."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    allowed_types = [".pdf", ".docx", ".doc", ".txt"]
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"File type not supported. Allowed: {', '.join(allowed_types)}",
        )

    review_id = str(uuid.uuid4())
    content = await file.read()

    # Save file locally
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    file_path = UPLOAD_DIR / f"{review_id}{ext}"
    with open(file_path, "wb") as f:
        f.write(content)

    review = {
        "id": review_id,
        "file_name": file.filename,
        "file_path": str(file_path),
        "file_size": len(content),
        "file_type": ext,
        "status": "pending",
        "analysis": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    # Load only real reviews for saving (exclude samples)
    reviews = load_reviews(include_samples=False)
    reviews.append(review)
    save_reviews(reviews)

    return {"success": True, "review": review}


@router.get("")
async def list_reviews():
    """List all document reviews."""
    reviews = load_reviews()
    return {"data": reviews, "total": len(reviews)}


@router.get("/{review_id}")
async def get_review(review_id: str):
    """Get a specific review by ID."""
    reviews = load_reviews()
    review = next((r for r in reviews if r["id"] == review_id), None)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    return review


@router.post("/{review_id}/analyze")
async def analyze_document(review_id: str):
    """Trigger real AI analysis on an uploaded document using GPT-4o."""
    # Check if this is a sample review (read-only)
    sample_reviews = load_sample_reviews()
    if any(r["id"] == review_id for r in sample_reviews):
        # Return existing sample analysis without re-analyzing
        review = next(r for r in sample_reviews if r["id"] == review_id)
        return {"success": True, "review": review}

    # Load only real reviews for modification
    reviews = load_reviews(include_samples=False)
    review = next((r for r in reviews if r["id"] == review_id), None)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    # Update status to analyzing
    review["status"] = "analyzing"
    save_reviews(reviews)

    try:
        # Extract text from the uploaded file
        file_path = review.get("file_path", "")
        document_text = extract_text_from_file(file_path)

        if not document_text or document_text.startswith("[Error") or document_text.startswith("[Unsupported"):
            document_text = f"[Document: {review['file_name']}]\n{document_text or 'No text could be extracted.'}"

        # Perform real AI analysis
        analysis = review_document_with_ai(document_text, review["file_name"])

        review["status"] = "completed"
        review["analysis"] = analysis
        review["analyzed_at"] = datetime.now(timezone.utc).isoformat()

    except Exception as e:
        review["status"] = "failed"
        review["analysis"] = {
            "overall_risk_score": 50,
            "summary": f"Analysis failed: {str(e)}",
            "clauses": [],
            "risks": [
                {
                    "title": "Analysis Error",
                    "severity": "high",
                    "description": str(e),
                }
            ],
            "suggestions": ["Please try again or check API configuration"],
        }

    save_reviews(reviews)

    return {"success": True, "review": review}
