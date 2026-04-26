from fastapi import APIRouter, HTTPException, Depends
from uuid import UUID
from app.database import supabase
from app.schemas.company import CompanyCreate, CompanyResponse
from app.routes.auth import require_auth

router = APIRouter()


@router.post("", response_model=CompanyResponse)
async def create_company(
    company_data: CompanyCreate,
    user: dict = Depends(require_auth),
):
    """Create a new company"""
    company_dict = company_data.model_dump()
    company_dict["user_id"] = user["id"]

    response = supabase.table("companies").insert(company_dict).execute()

    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to create company")

    return CompanyResponse(**response.data[0])


@router.get("/{company_id}", response_model=CompanyResponse)
async def get_company(
    company_id: UUID,
    user: dict = Depends(require_auth),
):
    """Get company by ID"""
    response = supabase.table("companies").select("*").eq("id", str(company_id)).execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Company not found")

    company = response.data[0]

    # Verify ownership
    if company.get("user_id") != user["id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    return CompanyResponse(**company)
