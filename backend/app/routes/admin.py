import logging

from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from uuid import UUID
from datetime import datetime, timezone
from app.database import supabase
from app.routes.auth import require_admin
from pydantic import BaseModel

router = APIRouter()
logger = logging.getLogger(__name__)


class ReviewApproveRequest(BaseModel):
    notes: Optional[str] = None


class ReviewRequestChangesRequest(BaseModel):
    changes_requested: str


@router.get("/reviews/pending")
async def get_pending_reviews(admin: dict = Depends(require_admin)):
    """Get all pending lawyer reviews (admin only)"""
    reviews_response = (
        supabase.table("lawyer_reviews")
        .select("*, legal_matters(*, companies(*), founders(*))")
        .eq("status", "pending")
        .limit(100)
        .execute()
    )

    return reviews_response.data


@router.post("/reviews/{review_id}/approve")
async def approve_review(
    review_id: UUID,
    request: ReviewApproveRequest,
    admin: dict = Depends(require_admin),
):
    """Approve a document review (admin only)"""
    # Get review
    review_response = supabase.table("lawyer_reviews").select("*").eq("id", str(review_id)).execute()
    if not review_response.data:
        raise HTTPException(status_code=404, detail="Review not found")

    review = review_response.data[0]
    matter_id = review["matter_id"]

    # Update review with admin's ID
    supabase.table("lawyer_reviews").update({
        "status": "approved",
        "lawyer_id": admin.get("id"),
        "notes": request.notes,
        "completed_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", str(review_id)).execute()

    # Update matter status
    supabase.table("legal_matters").update({"status": "completed"}).eq("id", matter_id).execute()

    # Mark document as final
    supabase.table("documents").update({"is_final": True}).eq("matter_id", matter_id).order("version", desc=True).limit(1).execute()

    # Get document URL
    doc_response = supabase.table("documents").select("storage_url").eq("matter_id", matter_id).order("version", desc=True).limit(1).execute()
    document_url = doc_response.data[0]["storage_url"] if doc_response.data else None

    # Get user email via joined query
    matter_response = (
        supabase.table("legal_matters")
        .select("company_id, companies(user_id, user_profiles(email))")
        .eq("id", matter_id)
        .execute()
    )
    if matter_response.data and document_url:
        try:
            company = matter_response.data[0].get("companies", {})
            user_profile = company.get("user_profiles", {})
            email = user_profile.get("email") if user_profile else None
            if email:
                from app.services.email_service import send_document_approved_email
                await send_document_approved_email(email, matter_id, document_url)
        except Exception as e:
            logger.error("Failed to send approval email for matter %s: %s", matter_id, e)

    return {"status": "approved", "message": "Document approved successfully"}


@router.post("/reviews/{review_id}/request-changes")
async def request_changes(
    review_id: UUID,
    request: ReviewRequestChangesRequest,
    admin: dict = Depends(require_admin),
):
    """Request changes to a document (admin only)"""
    # Get review
    review_response = supabase.table("lawyer_reviews").select("*").eq("id", str(review_id)).execute()
    if not review_response.data:
        raise HTTPException(status_code=404, detail="Review not found")

    review = review_response.data[0]
    matter_id = review["matter_id"]

    # Update review with admin's ID
    supabase.table("lawyer_reviews").update({
        "status": "changes_requested",
        "lawyer_id": admin.get("id"),
        "changes_requested": request.changes_requested,
        "completed_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", str(review_id)).execute()

    # Update matter status
    supabase.table("legal_matters").update({"status": "rejected"}).eq("id", matter_id).execute()

    # Get user email
    matter_response = (
        supabase.table("legal_matters")
        .select("company_id, companies(user_id, user_profiles(email))")
        .eq("id", matter_id)
        .execute()
    )
    if matter_response.data:
        try:
            company = matter_response.data[0].get("companies", {})
            user_profile = company.get("user_profiles", {})
            email = user_profile.get("email") if user_profile else None
            if email:
                from app.services.email_service import send_changes_requested_email
                await send_changes_requested_email(email, matter_id, request.changes_requested)
        except Exception as e:
            logger.error("Failed to send changes-requested email for matter %s: %s", matter_id, e)

    return {"status": "changes_requested", "message": "Changes requested successfully"}
