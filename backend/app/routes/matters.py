from fastapi import APIRouter, HTTPException
from uuid import UUID
from pydantic import BaseModel
from app.database import supabase
from app.schemas.matter import MatterCreate, MatterResponse, MatterStatusResponse
from app.schemas.founder import FounderCreate
from app.schemas.preference import LegalPreferenceCreate
from app.utils.validators import validate_equity_sum, validate_founder_count

router = APIRouter()


class MatterCreateRequest(BaseModel):
    matter_data: MatterCreate
    founders: list[FounderCreate]
    preferences: LegalPreferenceCreate


@router.post("", response_model=MatterResponse)
async def create_matter(request: MatterCreateRequest):
    """Create a new legal matter (founder agreement request)"""
    # Auth removed - no user check for now
    
    # Validate founders
    if not validate_founder_count(request.founders):
        raise HTTPException(status_code=400, detail="Must have 2-4 founders")
    
    if not validate_equity_sum(request.founders):
        raise HTTPException(status_code=400, detail="Total equity must equal 100%")
    
    # Verify company exists
    company_response = supabase.table("companies").select("*").eq("id", str(request.matter_data.company_id)).execute()
    if not company_response.data:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Auth removed - no ownership check for now
    
    # Create matter
    matter_dict = request.matter_data.model_dump()
    matter_dict["status"] = "draft"  # Can be changed to "ai_generating" if auto-generate on create
    
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
    return await get_matter(matter_id)


@router.get("/{matter_id}", response_model=MatterResponse)
async def get_matter(matter_id: UUID):
    """Get matter by ID with all relations"""
    # Auth removed - no user check for now
    
    # Get matter
    matter_response = supabase.table("legal_matters").select("*").eq("id", str(matter_id)).execute()
    if not matter_response.data:
        raise HTTPException(status_code=404, detail="Matter not found")
    
    matter = matter_response.data[0]
    
    # Get company
    company_response = supabase.table("companies").select("*").eq("id", matter["company_id"]).execute()
    if not company_response.data:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Auth removed - no ownership check for now
    
    # Get company
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
async def get_matter_status(matter_id: UUID):
    """Get matter status"""
    # Auth removed - no user check for now
    
    matter_response = supabase.table("legal_matters").select("id, status, updated_at").eq("id", str(matter_id)).execute()
    if not matter_response.data:
        raise HTTPException(status_code=404, detail="Matter not found")
    
    matter = matter_response.data[0]
    
    # Auth removed - no access check for now
    return MatterStatusResponse(**matter)
