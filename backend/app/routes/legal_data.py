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


class CaseSummary(BaseModel):
    case_name: str
    citation: str
    court: str
    principle: str
    summary: str
    relevance: str


class CompaniesActSection(BaseModel):
    act: str
    section: str
    title: str
    content: str


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


@router.get("/cases", response_model=List[CaseSummary])
async def get_case_summaries(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    search: Optional[str] = Query(None, description="Search in case name, principle, or summary"),
):
    """Get case summaries"""
    cases_file = DATA_DIR / "samples" / "case_summaries.json"
    
    if not cases_file.exists():
        raise HTTPException(status_code=404, detail="Case summaries file not found")
    
    try:
        with open(cases_file, "r", encoding="utf-8") as f:
            cases = json.load(f)
        
        # Search filter
        if search:
            search_lower = search.lower()
            cases = [
                c for c in cases
                if search_lower in c.get("case_name", "").lower()
                or search_lower in c.get("principle", "").lower()
                or search_lower in c.get("summary", "").lower()
            ]
        
        # Pagination
        paginated_cases = cases[offset:offset + limit]
        
        return paginated_cases
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading cases file: {str(e)}")


@router.get("/companies-act", response_model=List[CompaniesActSection])
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
