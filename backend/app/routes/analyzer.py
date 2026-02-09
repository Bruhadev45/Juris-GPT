"""
Contract Analyzer — AI-powered clause-by-clause analysis using GPT-4o.
Extracts text from uploaded documents and performs real legal analysis.
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional
import json
import uuid
from datetime import datetime
from pathlib import Path

from app.services.ai_analyzer import extract_text_from_file, analyze_contract_with_ai

router = APIRouter()

DATA_DIR = Path(__file__).parent.parent.parent.parent / "data"
ANALYZER_FILE = DATA_DIR / "analyzer_results.json"
UPLOAD_DIR = DATA_DIR / "analyzer_uploads"


def _ensure_dirs():
    ANALYZER_FILE.parent.mkdir(parents=True, exist_ok=True)
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    if not ANALYZER_FILE.exists():
        with open(ANALYZER_FILE, "w") as f:
            json.dump([], f)


def _load_results() -> list:
    _ensure_dirs()
    with open(ANALYZER_FILE, "r") as f:
        return json.load(f)


def _save_results(results: list):
    _ensure_dirs()
    with open(ANALYZER_FILE, "w") as f:
        json.dump(results, f, indent=2, default=str)


@router.post("/upload")
async def upload_contract(
    file: UploadFile = File(...),
    description: str = Form(""),
):
    """Upload a contract for AI analysis."""
    _ensure_dirs()

    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    allowed_extensions = [".pdf", ".docx", ".doc", ".txt"]
    ext = Path(file.filename).suffix.lower()
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"File type not supported. Allowed: {', '.join(allowed_extensions)}",
        )

    doc_id = str(uuid.uuid4())
    content = await file.read()
    file_size = len(content)

    # Save file locally for text extraction
    file_path = UPLOAD_DIR / f"{doc_id}{ext}"
    with open(file_path, "wb") as f:
        f.write(content)

    record = {
        "id": doc_id,
        "file_name": file.filename or "unknown",
        "file_size": file_size,
        "file_type": file.content_type or "application/octet-stream",
        "file_path": str(file_path),
        "description": description,
        "uploaded_at": datetime.utcnow().isoformat(),
        "status": "uploaded",
        "analysis": None,
    }

    results = _load_results()
    results.append(record)
    _save_results(results)

    return {"data": record, "message": "Contract uploaded. Use POST /analyze to start AI analysis."}


@router.post("/{doc_id}/analyze")
async def analyze_contract(doc_id: str):
    """Run real AI clause-by-clause analysis on an uploaded contract using GPT-4o."""
    results = _load_results()
    record = next((r for r in results if r["id"] == doc_id), None)
    if not record:
        raise HTTPException(status_code=404, detail="Contract not found. Upload first.")

    # Extract text from the uploaded file
    file_path = record.get("file_path", "")
    document_text = extract_text_from_file(file_path)

    if not document_text or document_text.startswith("[Error") or document_text.startswith("[Unsupported"):
        # Still attempt analysis with filename-based context
        document_text = f"[Document: {record['file_name']}]\n{document_text or 'No text could be extracted.'}"

    # Perform real AI analysis
    analysis = analyze_contract_with_ai(document_text, record["file_name"])

    record["status"] = "analyzed"
    record["analyzed_at"] = datetime.utcnow().isoformat()
    record["analysis"] = analysis

    _save_results(results)

    return {"data": record}


@router.get("/{doc_id}")
async def get_analysis(doc_id: str):
    """Get analysis results for a contract."""
    results = _load_results()
    record = next((r for r in results if r["id"] == doc_id), None)
    if not record:
        raise HTTPException(status_code=404, detail="Contract not found")
    return {"data": record}
