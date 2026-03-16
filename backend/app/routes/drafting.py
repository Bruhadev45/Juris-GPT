"""
AI-Powered Drafting — Generate legal documents using GPT-4 with Indian law context.
Users describe what they need in natural language and get a complete legal document.
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
import io

from app.services.ai_analyzer import DRAFTING_DOCUMENT_TYPES, generate_drafted_document
from app.services.document_service import markdown_to_docx

router = APIRouter()


class DraftingRequest(BaseModel):
    document_type: str = Field(..., description="ID of the document type to generate")
    description: str = Field(..., min_length=20, max_length=2000, description="Natural language description of the document")


@router.get("/types")
async def get_document_types():
    """List all available document types for AI drafting."""
    return {"types": DRAFTING_DOCUMENT_TYPES}


@router.post("/generate")
async def generate_document(request: DraftingRequest):
    """Generate a complete legal document from a natural language description."""
    # Validate document type
    valid_ids = [t["id"] for t in DRAFTING_DOCUMENT_TYPES]
    if request.document_type not in valid_ids:
        raise HTTPException(status_code=400, detail=f"Invalid document type. Choose from: {', '.join(valid_ids)}")

    result = generate_drafted_document(
        document_type=request.document_type,
        description=request.description,
    )

    if not result["success"]:
        raise HTTPException(status_code=500, detail=result.get("error", "Document generation failed"))

    return result


class DownloadRequest(BaseModel):
    content: str = Field(..., description="Markdown content to convert to DOCX")
    filename: str = Field(default="document.docx", description="Output filename")


@router.post("/download")
async def download_as_docx(request: DownloadRequest):
    """Convert generated markdown document to downloadable DOCX."""
    try:
        docx_bytes = markdown_to_docx(request.content, request.filename)
        buffer = io.BytesIO(docx_bytes)
        return StreamingResponse(
            buffer,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f"attachment; filename={request.filename}"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate DOCX: {str(e)}")
