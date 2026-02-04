from fastapi import APIRouter, HTTPException
from typing import Optional
from uuid import UUID
from app.database import supabase
from pydantic import BaseModel

router = APIRouter()


class ReviewApproveRequest(BaseModel):
    notes: Optional[str] = None


class ReviewRequestChangesRequest(BaseModel):
    changes_requested: str


@router.get("/reviews/pending")
async def get_pending_reviews():
    """Get all pending lawyer reviews"""
    # Auth removed - no admin check for now
    
    # Get pending reviews
    reviews_response = supabase.table("lawyer_reviews").select("*, legal_matters(*, companies(*), founders(*))").eq("status", "pending").execute()
    
    return reviews_response.data


@router.post("/reviews/{review_id}/approve")
async def approve_review(review_id: UUID, request: ReviewApproveRequest):
    """Approve a document review"""
    # Auth removed - no admin check for now
    
    # Get review
    review_response = supabase.table("lawyer_reviews").select("*").eq("id", str(review_id)).execute()
    if not review_response.data:
        raise HTTPException(status_code=404, detail="Review not found")
    
    review = review_response.data[0]
    matter_id = review["matter_id"]
    
    # Update review
    from datetime import datetime
    supabase.table("lawyer_reviews").update({
        "status": "approved",
        "lawyer_id": None,  # Auth removed - no user ID for now
        "notes": request.notes,
        "completed_at": datetime.utcnow().isoformat()
    }).eq("id", str(review_id)).execute()
    
    # Update matter status
    supabase.table("legal_matters").update({"status": "completed"}).eq("id", matter_id).execute()
    
    # Mark document as final
    supabase.table("documents").update({"is_final": True}).eq("matter_id", matter_id).order("version", desc=True).limit(1).execute()
    
    # Get document URL
    doc_response = supabase.table("documents").select("storage_url").eq("matter_id", matter_id).order("version", desc=True).limit(1).execute()
    document_url = doc_response.data[0]["storage_url"] if doc_response.data else None
    
    # Get user email
    matter_response = supabase.table("legal_matters").select("company_id").eq("id", matter_id).execute()
    if matter_response.data:
        company_response = supabase.table("companies").select("user_id").eq("id", matter_response.data[0]["company_id"]).execute()
        if company_response.data:
            user_response = supabase.table("user_profiles").select("email").eq("id", company_response.data[0]["user_id"]).execute()
            if user_response.data and document_url:
                from app.services.email_service import send_document_approved_email
                await send_document_approved_email(user_response.data[0]["email"], matter_id, document_url)
    
    return {"status": "approved", "message": "Document approved successfully"}


@router.post("/reviews/{review_id}/request-changes")
async def request_changes(review_id: UUID, request: ReviewRequestChangesRequest):
    """Request changes to a document"""
    # Auth removed - no admin check for now
    
    # Get review
    review_response = supabase.table("lawyer_reviews").select("*").eq("id", str(review_id)).execute()
    if not review_response.data:
        raise HTTPException(status_code=404, detail="Review not found")
    
    review = review_response.data[0]
    matter_id = review["matter_id"]
    
    # Update review
    from datetime import datetime
    supabase.table("lawyer_reviews").update({
        "status": "changes_requested",
        "lawyer_id": None,  # Auth removed - no user ID for now
        "changes_requested": request.changes_requested,
        "completed_at": datetime.utcnow().isoformat()
    }).eq("id", str(review_id)).execute()
    
    # Update matter status
    supabase.table("legal_matters").update({"status": "rejected"}).eq("id", matter_id).execute()
    
    # Get user email
    matter_response = supabase.table("legal_matters").select("company_id").eq("id", matter_id).execute()
    if matter_response.data:
        company_response = supabase.table("companies").select("user_id").eq("id", matter_response.data[0]["company_id"]).execute()
        if company_response.data:
            user_response = supabase.table("user_profiles").select("email").eq("id", company_response.data[0]["user_id"]).execute()
            if user_response.data:
                from app.services.email_service import send_changes_requested_email
                await send_changes_requested_email(user_response.data[0]["email"], matter_id, request.changes_requested)
    
    return {"status": "changes_requested", "message": "Changes requested successfully"}
