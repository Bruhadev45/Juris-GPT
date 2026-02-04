from fastapi import APIRouter, HTTPException
from uuid import UUID
from app.database import supabase
from app.schemas.company import CompanyCreate, CompanyResponse

router = APIRouter()


@router.post("", response_model=CompanyResponse)
async def create_company(company_data: CompanyCreate):
    """Create a new company"""
    # Auth removed - user_id can be passed in request or set to a default for now
    company_dict = company_data.model_dump()
    # TODO: Add user_id when auth is implemented
    # For now, using a placeholder or making it optional
    if "user_id" not in company_dict:
        company_dict["user_id"] = "00000000-0000-0000-0000-000000000000"  # Placeholder
    
    response = supabase.table("companies").insert(company_dict).execute()
    
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to create company")
    
    return CompanyResponse(**response.data[0])


@router.get("/{company_id}", response_model=CompanyResponse)
async def get_company(company_id: UUID):
    """Get company by ID"""
    response = supabase.table("companies").select("*").eq("id", str(company_id)).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Company not found")
    
    company = response.data[0]
    
    # Auth removed - no access check for now
    return CompanyResponse(**company)
