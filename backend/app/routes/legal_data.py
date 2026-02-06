"""
API routes for serving Indian legal data
"""
import json
import os
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

router = APIRouter(prefix="/api/legal", tags=["legal-data"])

# Base path to datasets
BASE_DIR = Path(__file__).parent.parent.parent.parent
DATA_DIR = BASE_DIR / "data" / "datasets"


class LawSection(BaseModel):
    section: int
    title: str
    description: str


class RelatedPdf(BaseModel):
    title: str
    url: str


class CaseSummary(BaseModel):
    id: Optional[int] = None
    case_name: str
    citation: str
    court: str
    principle: str
    summary: str
    relevance: str
    date: Optional[str] = None
    judges: Optional[List[str]] = None
    status: Optional[str] = None
    description: Optional[str] = None
    key_points: Optional[List[str]] = None
    related_pdfs: Optional[List[RelatedPdf]] = None
    related_sections: Optional[List[str]] = None


class CaseListItem(BaseModel):
    id: Optional[int] = None
    case_name: str
    citation: str
    court: str
    principle: str
    summary: str
    relevance: str
    date: Optional[str] = None
    status: Optional[str] = None


class CreateCaseRequest(BaseModel):
    case_name: str
    citation: str
    court: str
    principle: str
    summary: str
    relevance: str
    date: Optional[str] = None
    judges: Optional[List[str]] = None
    status: Optional[str] = None
    description: Optional[str] = None
    key_points: Optional[List[str]] = None
    related_pdfs: Optional[List[RelatedPdf]] = None
    related_sections: Optional[List[str]] = None


class CompaniesActSection(BaseModel):
    act: str
    section: str
    title: str
    content: str


class PaginatedCompaniesActResponse(BaseModel):
    data: List[CompaniesActSection]
    total: int
    limit: int
    offset: int


@router.get("/laws/{law_name}", response_model=List[LawSection])
async def get_law_sections(
    law_name: str,
    section: Optional[int] = Query(None, description="Filter by specific section number"),
    limit: int = Query(100, ge=1, le=1000, description="Limit number of results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
):
    """
    Get sections from Indian laws (CPC, IPC, CRPC, etc.)
    
    Available laws: cpc, ipc, crpc, hma, ida, iea, mva, nia
    """
    law_files = {
        "cpc": "cpc.json",
        "ipc": "ipc.json",
        "crpc": "crpc.json",
        "hma": "hma.json",
        "ida": "ida.json",
        "iea": "iea.json",
        "mva": "MVA.json",
        "nia": "nia.json",
    }
    
    if law_name.lower() not in law_files:
        raise HTTPException(
            status_code=404,
            detail=f"Law '{law_name}' not found. Available: {', '.join(law_files.keys())}"
        )
    
    law_file = DATA_DIR / "indian_law_json" / "Indian-Law-Penal-Code-Json-main" / law_files[law_name.lower()]
    
    if not law_file.exists():
        raise HTTPException(status_code=404, detail=f"Law file not found: {law_file}")
    
    try:
        with open(law_file, "r", encoding="utf-8") as f:
            sections = json.load(f)
        
        # Filter by section number if provided
        if section is not None:
            sections = [s for s in sections if s.get("section") == section]
        
        # Pagination
        paginated_sections = sections[offset:offset + limit]
        
        return paginated_sections
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading law file: {str(e)}")


@router.get("/laws", response_model=List[str])
async def list_available_laws():
    """List all available Indian laws"""
    return ["cpc", "ipc", "crpc", "hma", "ida", "iea", "mva", "nia"]


def _load_cases():
    """Load cases from JSON file"""
    cases_file = DATA_DIR / "samples" / "case_summaries.json"
    if not cases_file.exists():
        raise HTTPException(status_code=404, detail="Case summaries file not found")
    try:
        with open(cases_file, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading cases file: {str(e)}")


@router.get("/cases", response_model=List[CaseListItem])
async def get_case_summaries(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    search: Optional[str] = Query(None, description="Search in case name, principle, or summary"),
):
    """Get case summaries (list view — lightweight fields only)"""
    cases = _load_cases()

    if search:
        search_lower = search.lower()
        cases = [
            c for c in cases
            if search_lower in c.get("case_name", "").lower()
            or search_lower in c.get("principle", "").lower()
            or search_lower in c.get("summary", "").lower()
        ]

    return cases[offset:offset + limit]


@router.get("/cases/{case_id}", response_model=CaseSummary)
async def get_case_detail(case_id: int):
    """Get full case detail by id"""
    cases = _load_cases()
    for c in cases:
        if c.get("id") == case_id:
            return c
    raise HTTPException(status_code=404, detail=f"Case with id {case_id} not found")


@router.post("/cases", response_model=CaseSummary, status_code=201)
async def create_case(case: CreateCaseRequest):
    """Add a new case summary"""
    cases_file = DATA_DIR / "samples" / "case_summaries.json"

    # Load existing cases
    cases = []
    if cases_file.exists():
        try:
            with open(cases_file, "r", encoding="utf-8") as f:
                cases = json.load(f)
        except Exception:
            cases = []

    new_case = case.model_dump()
    max_id = max((c.get("id", 0) for c in cases), default=0)
    new_case["id"] = max_id + 1
    cases.append(new_case)

    # Ensure directory exists
    cases_file.parent.mkdir(parents=True, exist_ok=True)

    try:
        with open(cases_file, "w", encoding="utf-8") as f:
            json.dump(cases, f, indent=2, ensure_ascii=False)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving case: {str(e)}")

    return new_case


@router.get("/companies-act", response_model=PaginatedCompaniesActResponse)
async def get_companies_act_sections(
    section: Optional[str] = Query(None, description="Filter by section number"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    search: Optional[str] = Query(None, description="Search in title or content"),
):
    """Get Companies Act, 2013 sections"""
    companies_act_file = DATA_DIR / "samples" / "companies_act_sections.json"
    
    if not companies_act_file.exists():
        raise HTTPException(status_code=404, detail="Companies Act file not found")
    
    try:
        with open(companies_act_file, "r", encoding="utf-8") as f:
            sections = json.load(f)
        
        # Filter by section number
        if section:
            sections = [s for s in sections if s.get("section") == section]
        
        # Search filter
        if search:
            search_lower = search.lower()
            sections = [
                s for s in sections
                if search_lower in s.get("title", "").lower()
                or search_lower in s.get("content", "").lower()
            ]
        
        # Pagination
        total = len(sections)
        sections = sections[offset:offset + limit]
        
        return {
            "data": sections,
            "total": total,
            "limit": limit,
            "offset": offset,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading Companies Act file: {str(e)}")


@router.get("/stats")
async def get_legal_data_stats():
    """Get statistics about available legal data"""
    stats = {}
    
    # Count law sections
    law_files = {
        "cpc": "cpc.json",
        "ipc": "ipc.json",
        "crpc": "crpc.json",
        "hma": "hma.json",
        "ida": "ida.json",
        "iea": "iea.json",
        "mva": "MVA.json",
        "nia": "nia.json",
    }
    
    law_dir = DATA_DIR / "indian_law_json" / "Indian-Law-Penal-Code-Json-main"
    stats["laws"] = {}
    
    for law_name, filename in law_files.items():
        law_file = law_dir / filename
        if law_file.exists():
            try:
                with open(law_file, "r", encoding="utf-8") as f:
                    sections = json.load(f)
                    stats["laws"][law_name] = len(sections)
            except:
                stats["laws"][law_name] = 0
        else:
            stats["laws"][law_name] = 0
    
    # Count cases
    cases_file = DATA_DIR / "samples" / "case_summaries.json"
    if cases_file.exists():
        try:
            with open(cases_file, "r", encoding="utf-8") as f:
                cases = json.load(f)
                stats["cases"] = len(cases)
        except:
            stats["cases"] = 0
    else:
        stats["cases"] = 0
    
    # Count Companies Act sections
    companies_act_file = DATA_DIR / "samples" / "companies_act_sections.json"
    if companies_act_file.exists():
        try:
            with open(companies_act_file, "r", encoding="utf-8") as f:
                sections = json.load(f)
                stats["companies_act_sections"] = len(sections)
        except:
            stats["companies_act_sections"] = 0
    else:
        stats["companies_act_sections"] = 0
    
    return stats
