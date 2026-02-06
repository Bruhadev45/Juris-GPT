from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional
import uuid
import json
import os
from datetime import datetime
from pathlib import Path

router = APIRouter()

REVIEWS_FILE = Path(__file__).parent.parent.parent / "data" / "reviews.json"


def load_reviews():
    if not REVIEWS_FILE.exists():
        return []
    with open(REVIEWS_FILE, "r") as f:
        return json.load(f)


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

    # Save file locally for now
    upload_dir = Path(__file__).parent.parent.parent / "data" / "uploads"
    upload_dir.mkdir(parents=True, exist_ok=True)
    file_path = upload_dir / f"{review_id}{ext}"
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
        "created_at": datetime.utcnow().isoformat(),
    }

    reviews = load_reviews()
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
    """Trigger AI analysis on an uploaded document. Placeholder for GPT-4o integration."""
    reviews = load_reviews()
    review = next((r for r in reviews if r["id"] == review_id), None)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    # Placeholder analysis - will be replaced with actual AI analysis
    review["status"] = "completed"
    review["analysis"] = {
        "overall_risk_score": 6.5,
        "summary": "Document reviewed. AI analysis will be available when OpenAI integration is configured.",
        "clauses": [
            {"name": "Indemnity", "status": "present", "risk": "medium"},
            {"name": "Limitation of Liability", "status": "present", "risk": "low"},
            {"name": "Termination", "status": "present", "risk": "low"},
            {"name": "Force Majeure", "status": "missing", "risk": "high"},
            {"name": "Confidentiality", "status": "present", "risk": "low"},
            {"name": "Dispute Resolution", "status": "present", "risk": "medium"},
            {"name": "Governing Law", "status": "present", "risk": "low"},
            {"name": "IP Assignment", "status": "missing", "risk": "high"},
        ],
        "risks": [
            {
                "title": "Missing Force Majeure Clause",
                "severity": "high",
                "description": "No force majeure clause found. Consider adding to protect against unforeseen events.",
            },
            {
                "title": "Missing IP Assignment",
                "severity": "high",
                "description": "No intellectual property assignment clause. Work product ownership may be ambiguous.",
            },
            {
                "title": "Broad Indemnity",
                "severity": "medium",
                "description": "Indemnity clause is broadly worded. Consider adding caps and carve-outs.",
            },
        ],
        "suggestions": [
            "Add a Force Majeure clause covering natural disasters, pandemics, and government actions",
            "Include an IP assignment clause specifying ownership of work product",
            "Add a cap on indemnity liability (e.g., total contract value)",
            "Consider adding a dispute resolution escalation procedure before arbitration",
        ],
    }
    save_reviews(reviews)

    return {"success": True, "review": review}
