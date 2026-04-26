from fastapi import APIRouter, HTTPException, Depends
from uuid import UUID
from pydantic import BaseModel
from app.database import supabase
from app.schemas.matter import MatterCreate, MatterResponse, MatterStatusResponse
from app.schemas.founder import FounderCreate
from app.schemas.preference import LegalPreferenceCreate
from app.utils.validators import validate_equity_sum, validate_founder_count
from app.routes.auth import require_auth

router = APIRouter()


class MatterCreateRequest(BaseModel):
    matter_data: MatterCreate
    founders: list[FounderCreate]
    preferences: LegalPreferenceCreate


@router.post("", response_model=MatterResponse)
async def create_matter(
    request: MatterCreateRequest,
    user: dict = Depends(require_auth),
):
    """Create a new legal matter (founder agreement request)"""
    # Validate founders
    if not validate_founder_count(request.founders):
        raise HTTPException(status_code=400, detail="Must have 2-4 founders")

    if not validate_equity_sum(request.founders):
        raise HTTPException(status_code=400, detail="Total equity must equal 100%")

    # Verify company exists and user owns it
    company_response = supabase.table("companies").select("*").eq("id", str(request.matter_data.company_id)).execute()
    if not company_response.data:
        raise HTTPException(status_code=404, detail="Company not found")

    company = company_response.data[0]
    if company.get("user_id") != user["id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    # Create matter
    matter_dict = request.matter_data.model_dump()
    matter_dict["status"] = "draft"

    matter_response = supabase.table("legal_matters").insert(matter_dict).execute()
    if not matter_response.data:
        raise HTTPException(status_code=400, detail="Failed to create matter")

    matter_id = matter_response.data[0]["id"]

    # Create founders
    for founder in request.founders:
        founder_dict = founder.model_dump()
        founder_dict["company_id"] = str(request.matter_data.company_id)
        supabase.table("founders").insert(founder_dict).execute()

    # Create legal preferences
    pref_dict = request.preferences.model_dump()
    pref_dict["matter_id"] = matter_id
    supabase.table("legal_preferences").insert(pref_dict).execute()

    # Fetch complete matter with relations
    return await get_matter(matter_id, user)


@router.get("/{matter_id}", response_model=MatterResponse)
async def get_matter(
    matter_id: UUID,
    user: dict = Depends(require_auth),
):
    """Get matter by ID with all relations"""
    # Get matter
    matter_response = supabase.table("legal_matters").select("*").eq("id", str(matter_id)).execute()
    if not matter_response.data:
        raise HTTPException(status_code=404, detail="Matter not found")

    matter = matter_response.data[0]

    # Get company and verify ownership
    company_response = supabase.table("companies").select("*").eq("id", matter["company_id"]).execute()
    if not company_response.data:
        raise HTTPException(status_code=404, detail="Company not found")

    company = company_response.data[0]
    if company.get("user_id") != user["id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    from app.schemas.company import CompanyResponse
    company_obj = CompanyResponse(**company)

    # Get founders
    founders_response = supabase.table("founders").select("*").eq("company_id", matter["company_id"]).execute()
    from app.schemas.founder import FounderResponse
    founders = [FounderResponse(**f) for f in founders_response.data]

    # Get preferences
    pref_response = supabase.table("legal_preferences").select("*").eq("matter_id", str(matter_id)).execute()
    from app.schemas.preference import LegalPreferenceResponse
    preferences = LegalPreferenceResponse(**pref_response.data[0]) if pref_response.data else None

    matter_obj = MatterResponse(**matter)
    matter_obj.company = company_obj
    matter_obj.founders = founders
    matter_obj.preferences = preferences

    return matter_obj


@router.get("/{matter_id}/status", response_model=MatterStatusResponse)
async def get_matter_status(
    matter_id: UUID,
    user: dict = Depends(require_auth),
):
    """Get matter status"""
    matter_response = supabase.table("legal_matters").select("id, status, updated_at, company_id").eq("id", str(matter_id)).execute()
    if not matter_response.data:
        raise HTTPException(status_code=404, detail="Matter not found")

    matter = matter_response.data[0]

    # Verify ownership
    company_response = supabase.table("companies").select("user_id").eq("id", matter["company_id"]).execute()
    if company_response.data:
        owner_id = company_response.data[0]["user_id"]
        if owner_id != user["id"] and user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Access denied")

    return MatterStatusResponse(**{k: v for k, v in matter.items() if k != "company_id"})
