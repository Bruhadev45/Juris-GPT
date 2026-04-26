"""
Document Version Control routes for JurisGPT
Implements document versioning, history, and comparison
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
from uuid import UUID
import secrets
import difflib

router = APIRouter()


# ============== Models ==============

class DocumentVersion(BaseModel):
    id: str
    document_id: str
    version_number: int
    content: str
    content_hash: str
    created_by: Optional[str] = None
    created_at: datetime
    change_summary: Optional[str] = None
    is_current: bool = False
    word_count: int
    character_count: int


class CreateVersionRequest(BaseModel):
    document_id: str
    content: str
    change_summary: Optional[str] = None
    created_by: Optional[str] = None


class CompareVersionsResponse(BaseModel):
    version_a: int
    version_b: int
    additions: int
    deletions: int
    diff_html: str
    changes: List[dict]


class RestoreVersionRequest(BaseModel):
    version_id: str
    created_by: Optional[str] = None


# ============== In-Memory Storage ==============

# {document_id: [versions]}
versions_db: dict = {}
# {version_id: version}
version_lookup: dict = {}


# ============== Helper Functions ==============

def generate_version_id() -> str:
    return f"ver_{secrets.token_hex(8)}"


def compute_hash(content: str) -> str:
    import hashlib
    return hashlib.sha256(content.encode()).hexdigest()[:16]


def compute_diff(old_content: str, new_content: str) -> dict:
    """Compute difference between two versions"""
    old_lines = old_content.splitlines(keepends=True)
    new_lines = new_content.splitlines(keepends=True)

    differ = difflib.unified_diff(old_lines, new_lines, lineterm='')
    diff_lines = list(differ)

    additions = sum(1 for line in diff_lines if line.startswith('+') and not line.startswith('+++'))
    deletions = sum(1 for line in diff_lines if line.startswith('-') and not line.startswith('---'))

    # Generate HTML diff
    html_differ = difflib.HtmlDiff()
    diff_html = html_differ.make_table(old_lines, new_lines, context=True, numlines=3)

    # Extract changes
    changes = []
    matcher = difflib.SequenceMatcher(None, old_lines, new_lines)
    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag != 'equal':
            changes.append({
                'type': tag,
                'old_start': i1,
                'old_end': i2,
                'new_start': j1,
                'new_end': j2,
                'old_text': ''.join(old_lines[i1:i2]) if tag in ['replace', 'delete'] else None,
                'new_text': ''.join(new_lines[j1:j2]) if tag in ['replace', 'insert'] else None
            })

    return {
        'additions': additions,
        'deletions': deletions,
        'diff_html': diff_html,
        'changes': changes
    }


# ============== Routes ==============

@router.post("/create", response_model=DocumentVersion)
async def create_version(request: CreateVersionRequest):
    """Create a new version of a document"""
    document_id = request.document_id

    # Get existing versions
    existing_versions = versions_db.get(document_id, [])

    # Determine version number
    version_number = len(existing_versions) + 1

    # Check if content is different from last version
    if existing_versions:
        last_version = existing_versions[-1]
        if compute_hash(request.content) == last_version.content_hash:
            raise HTTPException(
                status_code=400,
                detail="No changes detected from previous version"
            )
        # Mark previous versions as not current
        for v in existing_versions:
            v.is_current = False

    # Create new version
    version_id = generate_version_id()
    version = DocumentVersion(
        id=version_id,
        document_id=document_id,
        version_number=version_number,
        content=request.content,
        content_hash=compute_hash(request.content),
        created_by=request.created_by,
        created_at=datetime.now(timezone.utc),
        change_summary=request.change_summary,
        is_current=True,
        word_count=len(request.content.split()),
        character_count=len(request.content)
    )

    # Store version
    if document_id not in versions_db:
        versions_db[document_id] = []
    versions_db[document_id].append(version)
    version_lookup[version_id] = version

    return version


@router.get("/{document_id}/history")
async def get_version_history(document_id: str, limit: int = 20, offset: int = 0):
    """Get version history for a document"""
    versions = versions_db.get(document_id, [])

    # Sort by version number descending
    sorted_versions = sorted(versions, key=lambda v: v.version_number, reverse=True)

    return {
        "document_id": document_id,
        "total_versions": len(versions),
        "versions": [
            {
                "id": v.id,
                "version_number": v.version_number,
                "created_by": v.created_by,
                "created_at": v.created_at,
                "change_summary": v.change_summary,
                "is_current": v.is_current,
                "word_count": v.word_count
            }
            for v in sorted_versions[offset:offset + limit]
        ]
    }


@router.get("/{document_id}/version/{version_number}", response_model=DocumentVersion)
async def get_specific_version(document_id: str, version_number: int):
    """Get a specific version of a document"""
    versions = versions_db.get(document_id, [])

    for version in versions:
        if version.version_number == version_number:
            return version

    raise HTTPException(status_code=404, detail="Version not found")


@router.get("/{document_id}/current", response_model=DocumentVersion)
async def get_current_version(document_id: str):
    """Get the current (latest) version of a document"""
    versions = versions_db.get(document_id, [])

    if not versions:
        raise HTTPException(status_code=404, detail="No versions found for document")

    # Find current version
    for version in versions:
        if version.is_current:
            return version

    # If no version marked as current, return latest
    return sorted(versions, key=lambda v: v.version_number)[-1]


@router.get("/{document_id}/compare")
async def compare_versions(
    document_id: str,
    version_a: int,
    version_b: int
) -> CompareVersionsResponse:
    """Compare two versions of a document"""
    versions = versions_db.get(document_id, [])

    ver_a = None
    ver_b = None

    for version in versions:
        if version.version_number == version_a:
            ver_a = version
        if version.version_number == version_b:
            ver_b = version

    if not ver_a or not ver_b:
        raise HTTPException(status_code=404, detail="One or both versions not found")

    # Compute diff
    diff = compute_diff(ver_a.content, ver_b.content)

    return CompareVersionsResponse(
        version_a=version_a,
        version_b=version_b,
        additions=diff['additions'],
        deletions=diff['deletions'],
        diff_html=diff['diff_html'],
        changes=diff['changes']
    )


@router.post("/{document_id}/restore")
async def restore_version(document_id: str, request: RestoreVersionRequest):
    """Restore a previous version as the current version"""
    if request.version_id not in version_lookup:
        raise HTTPException(status_code=404, detail="Version not found")

    old_version = version_lookup[request.version_id]

    if old_version.document_id != document_id:
        raise HTTPException(status_code=400, detail="Version does not belong to this document")

    # Create new version from old content
    new_version_request = CreateVersionRequest(
        document_id=document_id,
        content=old_version.content,
        change_summary=f"Restored from version {old_version.version_number}",
        created_by=request.created_by
    )

    return await create_version(new_version_request)


@router.delete("/{document_id}/version/{version_number}")
async def delete_version(document_id: str, version_number: int):
    """Delete a specific version (not recommended, for admin use only)"""
    versions = versions_db.get(document_id, [])

    for i, version in enumerate(versions):
        if version.version_number == version_number:
            if version.is_current:
                raise HTTPException(
                    status_code=400,
                    detail="Cannot delete current version"
                )
            del versions[i]
            del version_lookup[version.id]
            return {"message": f"Version {version_number} deleted"}

    raise HTTPException(status_code=404, detail="Version not found")


@router.get("/{document_id}/stats")
async def get_version_stats(document_id: str):
    """Get statistics about document versions"""
    versions = versions_db.get(document_id, [])

    if not versions:
        raise HTTPException(status_code=404, detail="No versions found")

    word_counts = [v.word_count for v in versions]
    char_counts = [v.character_count for v in versions]

    return {
        "document_id": document_id,
        "total_versions": len(versions),
        "first_version_date": min(v.created_at for v in versions),
        "latest_version_date": max(v.created_at for v in versions),
        "current_version": next((v.version_number for v in versions if v.is_current), None),
        "word_count_stats": {
            "current": word_counts[-1] if word_counts else 0,
            "min": min(word_counts) if word_counts else 0,
            "max": max(word_counts) if word_counts else 0,
            "average": sum(word_counts) / len(word_counts) if word_counts else 0
        },
        "contributors": list(set(v.created_by for v in versions if v.created_by))
    }
