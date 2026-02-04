from fastapi import APIRouter, HTTPException
from uuid import UUID
from app.database import supabase
from app.schemas.document import DocumentGenerateRequest, DocumentResponse
from app.services.ai_generator import generate_founder_agreement
from app.services.document_service import create_document_version, get_latest_document
from app.services.email_service import send_document_ready_email, send_admin_notification_email

router = APIRouter()


@router.post("/generate", response_model=DocumentResponse)
async def generate_document(request: DocumentGenerateRequest):
    """Generate AI document for a matter"""
    # Auth removed - no user check for now
    
    # Get matter
    matter_response = supabase.table("legal_matters").select("*").eq("id", str(request.matter_id)).execute()
    if not matter_response.data:
        raise HTTPException(status_code=404, detail="Matter not found")
    
    matter = matter_response.data[0]
    
    # Auth removed - no access check for now
    
    # Update matter status
    supabase.table("legal_matters").update({"status": "ai_generating"}).eq("id", str(request.matter_id)).execute()
    
    try:
        # Get company details
        company_response = supabase.table("companies").select("*").eq("id", matter["company_id"]).execute()
        company = company_response.data[0]
        
        # Get founders
        founders_response = supabase.table("founders").select("*").eq("company_id", matter["company_id"]).execute()
        founders = founders_response.data
        
        # Get preferences
        pref_response = supabase.table("legal_preferences").select("*").eq("matter_id", str(request.matter_id)).execute()
        preferences = pref_response.data[0] if pref_response.data else {}
        
        # Generate document
        document_content = generate_founder_agreement(
            company_name=company["name"],
            company_description=company.get("description", ""),
            company_state=company["state"],
            authorized_capital=company["authorized_capital"],
            founders=founders,
            preferences=preferences,
        )
        
        # Get latest version number
        latest_doc = await get_latest_document(request.matter_id)
        version = (latest_doc["version"] + 1) if latest_doc else 1
        
        # Create document version
        document = await create_document_version(
            matter_id=request.matter_id,
            content=document_content,
            version=version,
            is_final=False
        )
        
        # Update matter status
        supabase.table("legal_matters").update({"status": "lawyer_review"}).eq("id", str(request.matter_id)).execute()
        
        # Create lawyer review entry
        supabase.table("lawyer_reviews").insert({
            "matter_id": str(request.matter_id),
            "status": "pending"
        }).execute()
        
        # Send emails (user email removed since auth is disabled)
        # TODO: Get user email from matter/company when auth is added back
        # await send_document_ready_email(user.email, str(request.matter_id))
        await send_admin_notification_email("admin@jurisgpt.com", str(request.matter_id))
        
        return DocumentResponse(**document)
        
    except Exception as e:
        # Update matter status on error
        supabase.table("legal_matters").update({"status": "draft"}).eq("id", str(request.matter_id)).execute()
        raise HTTPException(status_code=500, detail=f"Failed to generate document: {str(e)}")


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(document_id: UUID):
    """Get document by ID"""
    # Auth removed - no user check for now
    
    response = supabase.table("documents").select("*").eq("id", str(document_id)).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Document not found")
    
    document = response.data[0]
    
    # Auth removed - no access check for now
    return DocumentResponse(**document)


@router.get("/{document_id}/download")
async def download_document(document_id: UUID):
    """Download document file"""
    # Auth removed - no user check for now
    
    response = supabase.table("documents").select("*").eq("id", str(document_id)).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Document not found")
    
    document = response.data[0]
    
    # Auth removed - no access check for now
    
    # Only allow download if final
    if not document.get("is_final"):
        raise HTTPException(status_code=400, detail="Document not yet finalized")
    
    if not document.get("storage_url"):
        raise HTTPException(status_code=404, detail="Document file not found")
    
    return {"url": document["storage_url"], "filename": document.get("file_name", "document.docx")}
