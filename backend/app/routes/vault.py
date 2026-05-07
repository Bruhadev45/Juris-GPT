from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Form, Depends
from pydantic import BaseModel
from typing import Optional
import json
import os
import uuid
import shutil
import re
from datetime import datetime, timezone
from pathlib import Path

from app.routes.auth import require_auth

router = APIRouter(dependencies=[Depends(require_auth)])

DATA_DIR = Path(__file__).parent.parent.parent / "data"
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
    "HR",
]


class VaultMetadataUpdate(BaseModel):
    category: Optional[str] = None
    tags: Optional[list[str]] = None
    description: Optional[str] = None


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


def _normalize_graph_id(value: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return normalized or "unknown"


def _document_title(doc: dict) -> str:
    return doc.get("file_name") or "Untitled document"


def _document_title_key(value: str) -> str:
    target = value.split("|", 1)[0].split("#", 1)[0].strip()
    title = os.path.splitext(target)[0] if os.path.splitext(target)[1] else target
    return title.lower()


def _document_lookup(docs: list) -> dict[str, str]:
    lookup: dict[str, str] = {}
    for doc in docs:
        title = _document_title(doc)
        lookup[_document_title_key(title)] = doc["id"]
        lookup[title.lower()] = doc["id"]
    return lookup


def _extract_wikilinks(description: str) -> list[dict]:
    links = []
    for match in re.findall(r"\[\[([^\]]+)\]\]", description or ""):
        target, _, alias = match.partition("|")
        links.append({
            "raw": match,
            "target": target.strip(),
            "alias": alias.strip() or None,
            "target_key": _document_title_key(target),
        })
    return links


def _doc_summary(doc: dict) -> dict:
    return {
        "id": doc.get("id"),
        "file_name": _document_title(doc),
        "category": doc.get("category", "Uncategorized"),
        "tags": doc.get("tags", []),
        "description": doc.get("description", ""),
        "uploaded_at": doc.get("uploaded_at", ""),
    }


def _build_knowledge_graph(docs: list) -> dict:
    """Build an Obsidian-style knowledge graph from vault metadata."""
    nodes: dict[str, dict] = {}
    edges: dict[tuple[str, str, str], dict] = {}
    tag_to_docs: dict[str, list[str]] = {}
    title_to_doc_id = _document_lookup(docs)

    def add_edge(source: str, target: str, edge_type: str, label: str, strength: int = 1):
        key = (source, target, edge_type)
        if key in edges:
            edges[key]["strength"] += strength
            return
        edges[key] = {
            "source": source,
            "target": target,
            "type": edge_type,
            "label": label,
            "strength": strength,
        }

    for doc in docs:
        doc_id = f"doc:{doc['id']}"
        title = _document_title(doc)
        nodes[doc_id] = {
            "id": doc_id,
            "label": title,
            "type": "document",
            "category": doc.get("category", "Uncategorized"),
            "size": max(10, min(28, int((doc.get("file_size", 0) or 0) / 50000) + 12)),
            "metadata": {
                "document_id": doc.get("id"),
                "file_name": title,
                "file_type": doc.get("file_type", ""),
                "file_size": doc.get("file_size", 0),
                "uploaded_at": doc.get("uploaded_at", ""),
                "description": doc.get("description", ""),
                "tags": doc.get("tags", []),
            },
        }

    for doc in docs:
        doc_id = f"doc:{doc['id']}"
        category = doc.get("category") or "Uncategorized"
        category_id = f"category:{_normalize_graph_id(category)}"
        nodes.setdefault(
            category_id,
            {
                "id": category_id,
                "label": category,
                "type": "category",
                "category": category,
                "size": 16,
                "metadata": {"document_count": 0},
            },
        )
        nodes[category_id]["metadata"]["document_count"] += 1
        add_edge(doc_id, category_id, "category", category)

        for tag in doc.get("tags", []):
            if not tag:
                continue
            tag_id = f"tag:{_normalize_graph_id(tag)}"
            nodes.setdefault(
                tag_id,
                {
                    "id": tag_id,
                    "label": tag,
                    "type": "tag",
                    "category": "Tag",
                    "size": 13,
                    "metadata": {"document_count": 0},
                },
            )
            nodes[tag_id]["metadata"]["document_count"] += 1
            tag_to_docs.setdefault(tag.lower(), []).append(doc_id)
            add_edge(doc_id, tag_id, "tag", tag)

        for wiki_link in _extract_wikilinks(doc.get("description") or ""):
            target_id = title_to_doc_id.get(wiki_link["target_key"])
            target_doc_id = f"doc:{target_id}" if target_id else None
            if target_doc_id and target_doc_id != doc_id:
                add_edge(doc_id, target_doc_id, "reference", wiki_link["raw"], 3)

    for tag, tagged_docs in tag_to_docs.items():
        unique_doc_ids = sorted(set(tagged_docs))
        for index, source_doc_id in enumerate(unique_doc_ids):
            for target_doc_id in unique_doc_ids[index + 1:]:
                add_edge(source_doc_id, target_doc_id, "shared_tag", tag, 2)

    document_nodes = [n for n in nodes.values() if n["type"] == "document"]
    tag_nodes = [n for n in nodes.values() if n["type"] == "tag"]
    category_nodes = [n for n in nodes.values() if n["type"] == "category"]

    return {
        "nodes": list(nodes.values()),
        "edges": list(edges.values()),
        "stats": {
            "documents": len(document_nodes),
            "tags": len(tag_nodes),
            "categories": len(category_nodes),
            "connections": len(edges),
        },
    }


def _build_document_links(doc_id: str, docs: list) -> dict:
    doc = next((d for d in docs if d["id"] == doc_id), None)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    lookup = _document_lookup(docs)
    docs_by_id = {d["id"]: d for d in docs}
    outgoing_links = []
    backlinks = []

    for link in _extract_wikilinks(doc.get("description") or ""):
        target_id = lookup.get(link["target_key"])
        outgoing_links.append({
            "raw": link["raw"],
            "target": link["target"],
            "alias": link["alias"],
            "resolved": bool(target_id),
            "document": _doc_summary(docs_by_id[target_id]) if target_id else None,
        })

    for other_doc in docs:
        if other_doc["id"] == doc_id:
            continue
        for link in _extract_wikilinks(other_doc.get("description") or ""):
            target_id = lookup.get(link["target_key"])
            if target_id == doc_id:
                backlinks.append({
                    "raw": link["raw"],
                    "source": _doc_summary(other_doc),
                })

    doc_tags = {tag.lower() for tag in doc.get("tags", [])}
    related_documents = []
    for other_doc in docs:
        if other_doc["id"] == doc_id:
            continue
        shared_tags = sorted(doc_tags.intersection({tag.lower() for tag in other_doc.get("tags", [])}))
        if shared_tags:
            related_documents.append({
                "document": _doc_summary(other_doc),
                "shared_tags": shared_tags,
            })

    return {
        "document": _doc_summary(doc),
        "outgoing_links": outgoing_links,
        "backlinks": backlinks,
        "related_documents": related_documents,
    }


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


@router.get("/graph")
async def get_knowledge_graph(
    category: Optional[str] = Query(None, description="Filter graph by category"),
    tag: Optional[str] = Query(None, description="Filter graph by tag"),
):
    """Return an Obsidian-style knowledge graph for vault documents."""
    docs = _load_documents()

    if category:
        docs = [d for d in docs if d.get("category", "").lower() == category.lower()]
    if tag:
        docs = [d for d in docs if tag.lower() in [t.lower() for t in d.get("tags", [])]]

    return {"data": _build_knowledge_graph(docs)}


@router.get("/link-suggestions")
async def get_link_suggestions(
    q: str = Query("", description="Search document names for wikilink suggestions"),
    limit: int = Query(10, ge=1, le=25),
):
    """Return document name suggestions for Obsidian-style wikilinks."""
    docs = _load_documents()
    query = q.strip().lower()
    matches = []
    for doc in docs:
        title = _document_title(doc)
        if not query or query in title.lower():
            matches.append({
                "id": doc["id"],
                "title": os.path.splitext(title)[0],
                "file_name": title,
                "category": doc.get("category", "Uncategorized"),
            })
    return {"data": matches[:limit]}


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
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
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


@router.get("/{doc_id}/links")
async def get_document_links(doc_id: str):
    """Get outgoing wikilinks, backlinks, and tag-related documents."""
    docs = _load_documents()
    return {"data": _build_document_links(doc_id, docs)}


@router.patch("/{doc_id}/metadata")
async def update_document_metadata(doc_id: str, payload: VaultMetadataUpdate):
    """Update metadata used by the vault knowledge graph."""
    docs = _load_documents()
    doc = next((d for d in docs if d["id"] == doc_id), None)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if payload.category is not None:
        if payload.category not in CATEGORIES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid category. Must be one of: {', '.join(CATEGORIES)}",
            )
        doc["category"] = payload.category
    if payload.tags is not None:
        doc["tags"] = [tag.strip() for tag in payload.tags if tag.strip()]
    if payload.description is not None:
        doc["description"] = payload.description
    doc["updated_at"] = datetime.now(timezone.utc).isoformat()

    _save_documents(docs)
    return {"data": doc, "message": "Document metadata updated successfully"}


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
