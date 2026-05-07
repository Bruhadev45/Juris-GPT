"""
Lawyers API Routes
==================
Connect with verified lawyers for consultations and document reviews.
"""

from fastapi import APIRouter, Query, HTTPException, Body
from typing import Optional, List
from pydantic import BaseModel, EmailStr

from app.services.lawyer_directory import get_lawyer_service

router = APIRouter(prefix="/api/lawyers", tags=["Lawyers"])


class LawyerSearchParams(BaseModel):
    """Parameters for lawyer search."""
    practice_area: Optional[str] = None
    city: Optional[str] = None
    min_experience: int = 0
    max_hourly_rate: Optional[int] = None
    min_rating: float = 0.0
    sort_by: str = "rating"
    limit: int = 20
    offset: int = 0


class ConsultationBookingRequest(BaseModel):
    """Request model for booking consultation."""
    lawyer_id: str
    client_name: str
    client_email: EmailStr
    client_phone: str
    practice_area: str
    description: str
    preferred_date: str
    preferred_time: str
    duration_minutes: int = 30


class DocumentReviewRequest(BaseModel):
    """Request model for document review."""
    lawyer_id: str
    document_type: str
    page_count: int
    description: str
    urgency: str = "standard"  # standard, urgent, express


@router.get("/search")
async def search_lawyers(
    practice_area: Optional[str] = Query(None, description="Practice area filter"),
    city: Optional[str] = Query(None, description="City filter"),
    min_experience: int = Query(0, ge=0, description="Minimum years of experience"),
    max_hourly_rate: Optional[int] = Query(None, ge=0, description="Maximum hourly rate in INR"),
    min_rating: float = Query(0.0, ge=0, le=5, description="Minimum rating"),
    sort_by: str = Query("rating", description="Sort by: rating, experience, price"),
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0)
):
    """
    Search for lawyers by criteria.

    **Practice Areas:**
    - Corporate Law
    - Startup & Venture Capital
    - Intellectual Property
    - Employment & Labour Law
    - Tax Law
    - Real Estate & Property
    - Contract Law
    - Civil Litigation
    - Criminal Law
    - Banking & Finance
    - Insolvency & Bankruptcy
    - Regulatory Compliance
    - Data Privacy & IT Law
    - Arbitration & ADR
    - Environmental Law
    - Consumer Protection

    **Cities:**
    - Mumbai, Delhi, Bangalore, Chennai, Hyderabad
    - Kolkata, Pune, Ahmedabad, Jaipur
    - Noida, Gurugram, Chandigarh, Kochi

    **Sort Options:**
    - `rating` - Highest rated first
    - `experience` - Most experienced first
    - `price` - Lowest price first
    """
    service = get_lawyer_service()
    results = await service.search_lawyers(
        practice_area=practice_area,
        city=city,
        min_experience=min_experience,
        max_hourly_rate=max_hourly_rate,
        min_rating=min_rating,
        sort_by=sort_by,
        limit=limit,
        offset=offset
    )
    return results


@router.get("/profile/{lawyer_id}")
async def get_lawyer_profile(lawyer_id: str):
    """
    Get detailed lawyer profile by ID.

    Returns full profile including:
    - Contact information
    - Practice areas and expertise
    - Experience and education
    - Ratings and reviews
    - Fee structure
    - Notable cases
    """
    service = get_lawyer_service()
    lawyer = await service.get_lawyer(lawyer_id)
    if not lawyer:
        raise HTTPException(status_code=404, detail="Lawyer not found")
    return lawyer


@router.post("/consultation/book")
async def book_consultation(request: ConsultationBookingRequest):
    """
    Book a consultation with a lawyer.

    **Request Body:**
    ```json
    {
        "lawyer_id": "LAW001",
        "client_name": "John Doe",
        "client_email": "john@example.com",
        "client_phone": "+91-98765-43210",
        "practice_area": "Startup & Venture Capital",
        "description": "Need advice on term sheet negotiation for Series A funding",
        "preferred_date": "2024-03-15",
        "preferred_time": "10:00",
        "duration_minutes": 30
    }
    ```

    **Response:**
    Returns booking confirmation with:
    - Booking ID
    - Lawyer details
    - Schedule details
    - Amount to pay
    """
    service = get_lawyer_service()
    result = await service.book_consultation(
        lawyer_id=request.lawyer_id,
        client_id="current_user",  # TODO: Get from auth
        client_name=request.client_name,
        client_email=request.client_email,
        client_phone=request.client_phone,
        practice_area=request.practice_area,
        description=request.description,
        preferred_date=request.preferred_date,
        preferred_time=request.preferred_time,
        duration_minutes=request.duration_minutes
    )

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    return result


@router.post("/document-review/request")
async def request_document_review(request: DocumentReviewRequest):
    """
    Request document review from a lawyer.

    **Urgency Levels:**
    - `standard` - 3-5 business days (1x rate)
    - `urgent` - 1-2 business days (1.5x rate)
    - `express` - Within 24 hours (2x rate)

    **Document Types:**
    - NDA / Non-Disclosure Agreement
    - Employment Agreement
    - Service Agreement
    - Shareholders Agreement
    - Investment Agreement
    - Commercial Contract
    - Partnership Deed
    - Terms of Service
    - Privacy Policy

    **Pricing:**
    Based on lawyer's per-page rate × number of pages × urgency multiplier
    """
    service = get_lawyer_service()
    result = await service.request_document_review(
        lawyer_id=request.lawyer_id,
        client_id="current_user",  # TODO: Get from auth
        document_type=request.document_type,
        page_count=request.page_count,
        description=request.description,
        urgency=request.urgency
    )

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    return result


@router.get("/practice-areas")
async def get_practice_areas():
    """Get list of all practice areas for filtering."""
    service = get_lawyer_service()
    return {
        "practice_areas": service.get_practice_areas(),
        "description": "Use these values in the practice_area filter"
    }


@router.get("/cities")
async def get_cities():
    """Get list of supported cities for filtering."""
    service = get_lawyer_service()
    return {
        "cities": service.get_cities(),
        "description": "Use these values in the city filter"
    }


@router.get("/featured")
async def get_featured_lawyers():
    """
    Get featured/top-rated lawyers across different practice areas.
    """
    service = get_lawyer_service()

    # Get top lawyers in key practice areas
    featured = {}

    for area in ["Startup & Venture Capital", "Corporate Law", "Tax Law", "Intellectual Property"]:
        results = await service.search_lawyers(
            practice_area=area,
            min_rating=4.5,
            sort_by="rating",
            limit=3
        )
        featured[area] = results.get("lawyers", [])

    return {
        "featured_lawyers": featured,
        "categories": list(featured.keys())
    }


@router.get("/startup-specialists")
async def get_startup_specialists():
    """
    Get lawyers specializing in startup and VC law.

    These lawyers have expertise in:
    - Company incorporation and structuring
    - Fundraising (Seed, Series A, B, etc.)
    - ESOP structuring
    - Shareholders agreements
    - Founder agreements
    - DPIIT recognition
    """
    service = get_lawyer_service()
    results = await service.search_lawyers(
        practice_area="Startup & Venture Capital",
        sort_by="rating",
        limit=20
    )
    return results


@router.get("/compliance-experts")
async def get_compliance_experts():
    """
    Get lawyers specializing in regulatory compliance.

    Expertise includes:
    - Company law compliance (ROC filings)
    - Labour law compliance
    - GST and tax compliance
    - FEMA compliance
    - Data protection compliance
    - Environmental compliance
    """
    service = get_lawyer_service()
    results = await service.search_lawyers(
        practice_area="Regulatory Compliance",
        sort_by="rating",
        limit=20
    )
    return results


@router.get("/quick-review-lawyers")
async def get_quick_review_lawyers():
    """
    Get lawyers available for quick document reviews.

    Returns lawyers with lowest document review rates for cost-effective reviews.
    """
    service = get_lawyer_service()
    results = await service.search_lawyers(
        sort_by="price",
        is_available=True,
        limit=10
    )
    return {
        "lawyers": results.get("lawyers", []),
        "note": "These lawyers offer competitive rates for document reviews"
    }
