from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Form
from typing import Optional, List
import json
import os
import uuid
import shutil
from datetime import datetime
from pathlib import Path

router = APIRouter()

DATA_DIR = Path(__file__).parent.parent.parent.parent / "data"
VAULT_META_FILE = DATA_DIR / "vault_documents.json"
VAULT_FILES_DIR = DATA_DIR / "vault_files"

CATEGORIES = [
    "Agreements",
    "Contracts",
    "Compliance",
    "Tax",
    "Employment",
    "Corporate",
    "Court Documents",
]


def _ensure_dirs():
    """Ensure storage directories exist."""
    VAULT_FILES_DIR.mkdir(parents=True, exist_ok=True)
    if not VAULT_META_FILE.exists():
        VAULT_META_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(VAULT_META_FILE, "w") as f:
            json.dump([], f)


def _load_documents() -> list:
    _ensure_dirs()
    with open(VAULT_META_FILE, "r") as f:
        return json.load(f)


def _save_documents(docs: list):
    _ensure_dirs()
    with open(VAULT_META_FILE, "w") as f:
        json.dump(docs, f, indent=2, default=str)


@router.get("")
async def list_documents(
    category: Optional[str] = Query(None, description="Filter by category"),
    tag: Optional[str] = Query(None, description="Filter by tag"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """List all documents in the vault with optional category/tag filters."""
    docs = _load_documents()

    if category:
        docs = [d for d in docs if d.get("category", "").lower() == category.lower()]
    if tag:
        docs = [d for d in docs if tag.lower() in [t.lower() for t in d.get("tags", [])]]

    total = len(docs)
    docs = docs[offset : offset + limit]

    return {"data": docs, "total": total}


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    category: str = Form("Agreements"),
    tags: str = Form(""),
    description: str = Form(""),
):
    """Upload a document to the vault."""
    _ensure_dirs()

    if category not in CATEGORIES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid category. Must be one of: {', '.join(CATEGORIES)}",
        )

    doc_id = str(uuid.uuid4())
    file_ext = os.path.splitext(file.filename or "unknown")[1]
    stored_name = f"{doc_id}{file_ext}"
    file_path = VAULT_FILES_DIR / stored_name

    # Save file to disk
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    file_size = len(content)

    tag_list = [t.strip() for t in tags.split(",") if t.strip()] if tags else []

    doc_meta = {
        "id": doc_id,
        "file_name": file.filename or "unknown",
        "stored_name": stored_name,
        "file_size": file_size,
        "file_type": file.content_type or "application/octet-stream",
        "category": category,
        "tags": tag_list,
        "uploaded_at": datetime.utcnow().isoformat(),
        "description": description,
    }

    docs = _load_documents()
    docs.append(doc_meta)
    _save_documents(docs)

    return {"data": doc_meta, "message": "Document uploaded successfully"}


@router.get("/categories")
async def get_categories():
    """Get all available document categories with counts."""
    docs = _load_documents()
    counts = {cat: 0 for cat in CATEGORIES}
    for d in docs:
        cat = d.get("category", "")
        if cat in counts:
            counts[cat] += 1

    return {
        "categories": [{"name": k, "count": v} for k, v in counts.items()],
    }


@router.get("/{doc_id}")
async def get_document(doc_id: str):
    """Get document metadata by ID."""
    docs = _load_documents()
    doc = next((d for d in docs if d["id"] == doc_id), None)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"data": doc}


@router.get("/{doc_id}/download")
async def download_document(doc_id: str):
    """Download a document file."""
    from fastapi.responses import FileResponse

    docs = _load_documents()
    doc = next((d for d in docs if d["id"] == doc_id), None)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    file_path = VAULT_FILES_DIR / doc["stored_name"]
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")

    return FileResponse(
        path=str(file_path),
        filename=doc["file_name"],
        media_type=doc["file_type"],
    )


@router.delete("/{doc_id}")
async def delete_document(doc_id: str):
    """Delete a document from the vault."""
    docs = _load_documents()
    doc = next((d for d in docs if d["id"] == doc_id), None)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Remove file from disk
    file_path = VAULT_FILES_DIR / doc["stored_name"]
    if file_path.exists():
        file_path.unlink()

    docs = [d for d in docs if d["id"] != doc_id]
    _save_documents(docs)

    return {"message": "Document deleted successfully", "id": doc_id}
