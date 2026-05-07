"""
Cases API Routes
================
Provides real-time access to Indian legal cases from Indian Kanoon.
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List
from pydantic import BaseModel

from app.services.indian_kanoon import get_kanoon_client, COURT_CODES

router = APIRouter(prefix="/api/cases", tags=["Cases"])


class CaseSearchResponse(BaseModel):
    """Response model for case search."""
    total_results: int
    page: int
    cases: List[dict]
    query: str
    is_demo: Optional[bool] = None
    message: Optional[str] = None


class CaseDocumentResponse(BaseModel):
    """Response model for single case document."""
    id: str
    title: str
    content: str
    court: str
    date: str
    citation: str
    judges: List[str]
    url: str
    is_demo: Optional[bool] = None


@router.get("/search", response_model=CaseSearchResponse)
async def search_cases(
    q: str = Query(..., description="Search query"),
    page: int = Query(0, ge=0, description="Page number"),
    court: Optional[str] = Query(None, description="Court filter (e.g., supremecourt, delhihighcourt)"),
    from_date: Optional[str] = Query(None, description="From date (YYYY-MM-DD)"),
    to_date: Optional[str] = Query(None, description="To date (YYYY-MM-DD)"),
    doc_type: Optional[str] = Query(None, description="Document type (judgments, acts)")
):
    """
    Search Indian legal cases.

    **Query Examples:**
    - `Section 498A IPC` - Search for dowry harassment cases
    - `"Companies Act" AND "director"` - Boolean search
    - `Kesavananda Bharati` - Search by case name

    **Court Codes:**
    - `supremecourt` - Supreme Court of India
    - `delhihighcourt` - Delhi High Court
    - `bombayhighcourt` - Bombay High Court
    - See /api/cases/courts for full list
    """
    client = get_kanoon_client()
    try:
        results = await client.search_cases(
            query=q,
            page=page,
            court_filter=court,
            from_date=from_date,
            to_date=to_date,
            doc_type=doc_type
        )
        return CaseSearchResponse(**results)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/document/{doc_id}")
async def get_case_document(doc_id: str):
    """
    Get full case document by ID.

    The document ID can be obtained from search results.
    """
    client = get_kanoon_client()
    try:
        doc = await client.get_document(doc_id)
        return doc
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recent/supreme-court")
async def get_recent_supreme_court_cases(
    limit: int = Query(20, ge=1, le=50)
):
    """Get recent Supreme Court judgments."""
    client = get_kanoon_client()
    try:
        cases = await client.get_recent_supreme_court_cases(limit=limit)
        return {"cases": cases, "court": "Supreme Court of India"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recent/high-court/{court}")
async def get_recent_high_court_cases(
    court: str,
    limit: int = Query(20, ge=1, le=50)
):
    """
    Get recent High Court judgments.

    **Court Codes:**
    - `delhi` - Delhi High Court
    - `bombay` - Bombay High Court
    - `madras` - Madras High Court
    - `calcutta` - Calcutta High Court
    - `karnataka` - Karnataka High Court
    """
    # Map common names to Indian Kanoon codes
    court_mapping = {
        "delhi": "delhihighcourt",
        "bombay": "bombayhighcourt",
        "mumbai": "bombayhighcourt",
        "madras": "madrashighcourt",
        "chennai": "madrashighcourt",
        "calcutta": "calcuttahighcourt",
        "kolkata": "calcuttahighcourt",
        "karnataka": "karnatakaHighcourt",
        "bangalore": "karnatakaHighcourt",
        "kerala": "keralahighcourt",
        "allahabad": "allahabadhighcourt",
        "punjab": "punjabhighcourt",
        "gujarat": "gujarathighcourt",
        "rajasthan": "rajasthanhighcourt",
        "telangana": "telanganahighcourt",
        "hyderabad": "telanganahighcourt",
        "andhra": "andhrapradeshhighcourt",
    }

    court_code = court_mapping.get(court.lower(), court)

    client = get_kanoon_client()
    try:
        cases = await client.get_recent_high_court_cases(
            court=court_code,
            limit=limit
        )
        return {"cases": cases, "court": court_code}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/by-act/{act_name}")
async def search_cases_by_act(
    act_name: str,
    page: int = Query(0, ge=0)
):
    """
    Search cases related to a specific Act.

    **Examples:**
    - `Companies Act, 2013`
    - `Income Tax Act, 1961`
    - `Insolvency and Bankruptcy Code, 2016`
    """
    client = get_kanoon_client()
    try:
        results = await client.search_cases(query=f'"{act_name}"', page=page)
        return {
            "act": act_name,
            "total_results": results.get("total_results", 0),
            "cases": results.get("cases", [])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/by-section")
async def search_cases_by_section(
    act: str = Query(..., description="Act name"),
    section: str = Query(..., description="Section number"),
    page: int = Query(0, ge=0)
):
    """
    Search cases citing a specific section of an Act.

    **Examples:**
    - act: `Companies Act, 2013`, section: `149` (Independent Directors)
    - act: `IPC`, section: `420` (Cheating)
    - act: `Income Tax Act`, section: `80C` (Deductions)
    """
    client = get_kanoon_client()
    try:
        cases = await client.search_by_section(act_name=act, section=section)
        return {
            "act": act,
            "section": section,
            "cases": cases
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/citations/{doc_id}")
async def get_case_citations(doc_id: str):
    """
    Get citation analysis for a case.

    Returns cases that cite this document and cases this document cites.
    """
    client = get_kanoon_client()
    try:
        citations = await client.get_case_citations(doc_id)
        return citations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/courts")
async def get_court_codes():
    """
    Get list of supported court codes for filtering.
    """
    return {
        "courts": COURT_CODES,
        "description": "Use these codes in the 'court' query parameter for search"
    }


@router.get("/trending")
async def get_trending_cases():
    """
    Get trending/important recent cases.

    Returns a curated list of significant recent judgments across different areas of law.
    """
    client = get_kanoon_client()

    # Search for recent important cases in various areas
    trending = []

    try:
        # Corporate law
        corp_results = await client.search_cases(
            query="Companies Act OR SEBI OR NCLT",
            court_filter="supremecourt",
            page=0
        )
        trending.extend(corp_results.get("cases", [])[:3])

        # Tax law
        tax_results = await client.search_cases(
            query="Income Tax OR GST",
            court_filter="supremecourt",
            page=0
        )
        trending.extend(tax_results.get("cases", [])[:3])

        # Constitutional law
        const_results = await client.search_cases(
            query="Article 21 OR fundamental rights",
            court_filter="supremecourt",
            page=0
        )
        trending.extend(const_results.get("cases", [])[:3])

        # IBC cases
        ibc_results = await client.search_cases(
            query="Insolvency Bankruptcy Code",
            court_filter="supremecourt",
            page=0
        )
        trending.extend(ibc_results.get("cases", [])[:3])

        return {
            "trending_cases": trending,
            "total": len(trending),
            "categories": ["Corporate", "Tax", "Constitutional", "Insolvency"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
