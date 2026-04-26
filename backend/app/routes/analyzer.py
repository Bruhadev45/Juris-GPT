"""
Contract Analyzer — AI-powered clause-by-clause analysis using GPT-4o.
Extracts text from uploaded documents and performs real legal analysis.
"""

import json
import re
import uuid
import logging
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from app.routes.auth import require_auth

router = APIRouter()
logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).parent.parent.parent.parent / "data"
ANALYZER_FILE = DATA_DIR / "analyzer_results.json"
UPLOAD_DIR = DATA_DIR / "analyzer_uploads"

MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt"}


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


def _sanitize_filename(filename: str) -> str:
    """Remove unsafe characters from filename, keeping only alphanumeric, dots, hyphens, underscores."""
    name = Path(filename).stem
    ext = Path(filename).suffix.lower()
    safe_name = re.sub(r"[^a-zA-Z0-9._-]", "_", name)
    return f"{safe_name}{ext}"


@router.post("/upload")
async def upload_contract(
    file: UploadFile = File(...),
    description: str = Form(""),
    user: dict = Depends(require_auth),
):
    """Upload a contract for AI analysis."""
    _ensure_dirs()

    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type not supported. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    content = await file.read()
    file_size = len(content)

    # Enforce file size limit
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024 * 1024)} MB.",
        )

    if file_size == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    doc_id = str(uuid.uuid4())
    safe_filename = _sanitize_filename(file.filename)

    # Save file with UUID prefix to prevent collisions
    file_path = UPLOAD_DIR / f"{doc_id}{ext}"
    with open(file_path, "wb") as f:
        f.write(content)

    record = {
        "id": doc_id,
        "file_name": safe_filename,
        "file_size": file_size,
        "file_type": file.content_type or "application/octet-stream",
        "file_path": str(file_path),
        "description": description[:1000],  # Limit description length
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
        "uploaded_by": user.get("id"),
        "status": "uploaded",
        "analysis": None,
    }

    results = _load_results()
    results.append(record)
    _save_results(results)

    return {"data": record, "message": "Contract uploaded. Use POST /analyze to start AI analysis."}


@router.post("/{doc_id}/analyze")
async def analyze_contract(
    doc_id: str,
    user: dict = Depends(require_auth),
):
    """Run real AI clause-by-clause analysis on an uploaded contract using GPT-4o."""
    from app.services.ai_analyzer import extract_text_from_file, analyze_contract_with_ai

    results = _load_results()
    record = next((r for r in results if r["id"] == doc_id), None)
    if not record:
        raise HTTPException(status_code=404, detail="Contract not found. Upload first.")

    # Verify ownership
    if record.get("uploaded_by") != user.get("id") and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    # Extract text from the uploaded file
    file_path = record.get("file_path", "")
    document_text = extract_text_from_file(file_path)

    if not document_text or document_text.startswith("[Error") or document_text.startswith("[Unsupported"):
        document_text = f"[Document: {record['file_name']}]\n{document_text or 'No text could be extracted.'}"

    # Perform real AI analysis
    analysis = analyze_contract_with_ai(document_text, record["file_name"])

    record["status"] = "analyzed"
    record["analyzed_at"] = datetime.now(timezone.utc).isoformat()
    record["analysis"] = analysis

    _save_results(results)

    return {"data": record}


@router.get("/{doc_id}")
async def get_analysis(
    doc_id: str,
    user: dict = Depends(require_auth),
):
    """Get analysis results for a contract."""
    results = _load_results()
    record = next((r for r in results if r["id"] == doc_id), None)
    if not record:
        raise HTTPException(status_code=404, detail="Contract not found")

    # Verify ownership
    if record.get("uploaded_by") != user.get("id") and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    return {"data": record}
