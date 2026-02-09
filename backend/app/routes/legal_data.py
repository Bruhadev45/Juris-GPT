"""
API routes for serving Indian legal data with enhanced search.
Features: fuzzy matching, relevance scoring, unified search, cross-category results.
"""

import json
import os
import re
from difflib import SequenceMatcher
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

router = APIRouter(prefix="/api/legal", tags=["legal-data"])

# Base path to datasets
BASE_DIR = Path(__file__).parent.parent.parent.parent
DATA_DIR = BASE_DIR / "data" / "datasets"


# ── Models ──────────────────────────────────────────────────────────────────

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


class SearchResult(BaseModel):
    """Unified search result with relevance scoring."""
    type: str  # "case", "statute", "companies_act"
    title: str
    subtitle: str
    content: str
    relevance_score: float  # 0.0 - 1.0
    source: str
    metadata: dict = {}


class UnifiedSearchResponse(BaseModel):
    results: List[SearchResult]
    total: int
    query: str
    suggestions: List[str] = []


# ── Search Utilities ────────────────────────────────────────────────────────

def _fuzzy_score(query: str, text: str) -> float:
    """Calculate fuzzy match score between query and text."""
    if not query or not text:
        return 0.0

    query_lower = query.lower()
    text_lower = text.lower()

    # Exact match bonus
    if query_lower in text_lower:
        # Higher score for matches at the start
        position_bonus = 1.0 - (text_lower.index(query_lower) / max(len(text_lower), 1)) * 0.3
        return min(1.0, 0.7 + position_bonus * 0.3)

    # Word-level matching
    query_words = set(query_lower.split())
    text_words = set(text_lower.split())
    word_overlap = len(query_words & text_words) / max(len(query_words), 1)
    if word_overlap > 0:
        return 0.3 + word_overlap * 0.4

    # Fuzzy sequence matching
    return SequenceMatcher(None, query_lower, text_lower[:200]).ratio() * 0.5


def _calculate_relevance(query: str, item: dict, fields: List[str], weights: Optional[dict] = None) -> float:
    """Calculate weighted relevance score across multiple fields."""
    if not query:
        return 0.5

    if weights is None:
        weights = {f: 1.0 / len(fields) for f in fields}

    total_score = 0.0
    total_weight = 0.0

    for field in fields:
        value = item.get(field, "")
        if isinstance(value, list):
            value = " ".join(str(v) for v in value)
        elif not isinstance(value, str):
            value = str(value)

        weight = weights.get(field, 1.0)
        score = _fuzzy_score(query, value)
        total_score += score * weight
        total_weight += weight

    return round(total_score / max(total_weight, 0.001), 3)


def _generate_search_suggestions(query: str, results_count: int) -> List[str]:
    """Generate relevant search suggestions based on the query."""
    query_lower = query.lower()

    suggestion_map = {
        "contract": ["Contract breach remedies", "Service agreement clauses", "Contract termination India"],
        "arbitration": ["Arbitration and Conciliation Act 1996", "International arbitration India", "Arbitration clause enforceability"],
        "company": ["Company incorporation process", "Director duties and liabilities", "Company winding up"],
        "director": ["Director disqualification", "Independent director requirements", "Director remuneration"],
        "share": ["Share transfer restrictions", "Right of first refusal", "Share buyback provisions"],
        "employee": ["Employment termination India", "Gratuity calculation", "PF and ESI compliance"],
        "ipc": ["IPC Section 420 cheating", "IPC criminal breach of trust", "IPC defamation"],
        "property": ["Property transfer registration", "Tenancy laws India", "Property dispute resolution"],
        "tax": ["GST compliance requirements", "Income tax filing deadlines", "TDS deduction rates"],
        "patent": ["Patent filing India", "Patent infringement remedies", "Patent licensing"],
        "trademark": ["Trademark registration process", "Trademark infringement", "Trademark opposition"],
        "startup": ["Startup India registration", "DPIIT recognition benefits", "Startup compliance checklist"],
        "gst": ["GST return filing", "GST registration threshold", "Input tax credit"],
        "labour": ["Labour law compliance", "Shops and Establishment Act", "Minimum wages"],
        "data": ["DPDPA 2023 compliance", "Data protection officer", "Cross-border data transfer"],
        "dispute": ["Dispute resolution mechanisms", "Mediation vs arbitration", "Consumer dispute forum"],
    }

    suggestions = []
    for keyword, sug_list in suggestion_map.items():
        if keyword in query_lower:
            suggestions.extend(sug_list)

    # If no keyword match, provide general suggestions
    if not suggestions:
        suggestions = [
            f"{query} under Indian law",
            f"{query} legal provisions",
            f"{query} case law India",
            f"{query} compliance requirements",
        ]

    return suggestions[:5]


def _search_filter(items: list, search: str, fields: List[str]) -> list:
    """Enhanced search filter with fuzzy matching and relevance scoring."""
    if not search:
        return items

    scored_items = []
    for item in items:
        score = _calculate_relevance(search, item, fields)
        if score > 0.1:  # Minimum threshold
            scored_items.append((score, item))

    # Sort by score descending
    scored_items.sort(key=lambda x: x[0], reverse=True)
    return [item for _, item in scored_items]


# ── Data Loading ────────────────────────────────────────────────────────────

LAW_FILES = {
    "cpc": "cpc.json",
    "ipc": "ipc.json",
    "crpc": "crpc.json",
    "hma": "hma.json",
    "ida": "ida.json",
    "iea": "iea.json",
    "mva": "MVA.json",
    "nia": "nia.json",
}

LAW_DISPLAY_NAMES = {
    "cpc": "Code of Civil Procedure, 1908",
    "ipc": "Indian Penal Code, 1860",
    "crpc": "Code of Criminal Procedure, 1973",
    "hma": "Hindu Marriage Act, 1955",
    "ida": "Industrial Disputes Act, 1947",
    "iea": "Indian Evidence Act, 1872",
    "mva": "Motor Vehicles Act, 1988",
    "nia": "National Investigation Agency Act, 2008",
}


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


def _load_law_sections(law_name: str) -> list:
    """Load sections for a specific law."""
    if law_name.lower() not in LAW_FILES:
        return []
    law_file = DATA_DIR / "indian_law_json" / "Indian-Law-Penal-Code-Json-main" / LAW_FILES[law_name.lower()]
    if not law_file.exists():
        return []
    try:
        with open(law_file, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


def _load_companies_act() -> list:
    """Load Companies Act sections."""
    file_path = DATA_DIR / "samples" / "companies_act_sections.json"
    if not file_path.exists():
        return []
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


# ── Unified Search Endpoint ─────────────────────────────────────────────────

@router.get("/search", response_model=UnifiedSearchResponse)
async def unified_search(
    q: str = Query(..., min_length=1, description="Search query"),
    types: Optional[str] = Query(None, description="Comma-separated types: cases,statutes,companies_act"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """
    Unified search across all legal data with relevance scoring.
    Searches cases, statutes (all laws), and Companies Act simultaneously.
    Results are ranked by relevance.
    """
    search_types = set(types.split(",")) if types else {"cases", "statutes", "companies_act"}
    all_results: List[SearchResult] = []

    # Search cases
    if "cases" in search_types:
        try:
            cases = _load_cases()
            for case in cases:
                score = _calculate_relevance(
                    q, case,
                    ["case_name", "principle", "summary", "court", "relevance"],
                    weights={"case_name": 2.0, "principle": 1.5, "summary": 1.0, "court": 0.5, "relevance": 0.8},
                )
                if score > 0.1:
                    all_results.append(SearchResult(
                        type="case",
                        title=case.get("case_name", ""),
                        subtitle=f"{case.get('court', '')} • {case.get('citation', '')}",
                        content=case.get("summary", case.get("principle", "")),
                        relevance_score=score,
                        source="Case Law",
                        metadata={
                            "id": case.get("id"),
                            "citation": case.get("citation", ""),
                            "court": case.get("court", ""),
                            "principle": case.get("principle", ""),
                            "relevance": case.get("relevance", ""),
                            "date": case.get("date"),
                        },
                    ))
        except Exception:
            pass

    # Search all statutes
    if "statutes" in search_types:
        for law_name in LAW_FILES:
            sections = _load_law_sections(law_name)
            for sec in sections:
                score = _calculate_relevance(
                    q, sec,
                    ["title", "description"],
                    weights={"title": 2.0, "description": 1.0},
                )
                if score > 0.1:
                    all_results.append(SearchResult(
                        type="statute",
                        title=f"Section {sec.get('section', '?')}: {sec.get('title', '')}",
                        subtitle=LAW_DISPLAY_NAMES.get(law_name, law_name.upper()),
                        content=sec.get("description", ""),
                        relevance_score=score,
                        source=law_name.upper(),
                        metadata={
                            "law": law_name,
                            "section": sec.get("section"),
                            "law_name": LAW_DISPLAY_NAMES.get(law_name, law_name.upper()),
                        },
                    ))

    # Search Companies Act
    if "companies_act" in search_types:
        ca_sections = _load_companies_act()
        for sec in ca_sections:
            score = _calculate_relevance(
                q, sec,
                ["title", "content", "section"],
                weights={"title": 2.0, "content": 1.0, "section": 0.5},
            )
            if score > 0.1:
                all_results.append(SearchResult(
                    type="companies_act",
                    title=f"Section {sec.get('section', '?')}: {sec.get('title', '')}",
                    subtitle=sec.get("act", "Companies Act, 2013"),
                    content=sec.get("content", ""),
                    relevance_score=score,
                    source="Companies Act",
                    metadata={
                        "act": sec.get("act", ""),
                        "section": sec.get("section", ""),
                    },
                ))

    # Sort by relevance score
    all_results.sort(key=lambda r: r.relevance_score, reverse=True)

    total = len(all_results)
    paginated = all_results[offset:offset + limit]
    suggestions = _generate_search_suggestions(q, total)

    return UnifiedSearchResponse(
        results=paginated,
        total=total,
        query=q,
        suggestions=suggestions,
    )


# ── Existing Endpoints (Enhanced) ───────────────────────────────────────────

@router.get("/laws", response_model=List[str])
async def list_available_laws():
    """List all available Indian laws"""
    return list(LAW_FILES.keys())


@router.get("/laws/details")
async def list_laws_with_details():
    """List all available Indian laws with display names and section counts."""
    result = []
    for key, display_name in LAW_DISPLAY_NAMES.items():
        sections = _load_law_sections(key)
        result.append({
            "id": key,
            "name": display_name,
            "abbreviation": key.upper(),
            "section_count": len(sections),
        })
    return result


@router.get("/laws/{law_name}", response_model=List[LawSection])
async def get_law_sections(
    law_name: str,
    section: Optional[int] = Query(None, description="Filter by specific section number"),
    search: Optional[str] = Query(None, description="Search in title or description"),
    limit: int = Query(100, ge=1, le=1000, description="Limit number of results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
):
    """
    Get sections from Indian laws (CPC, IPC, CRPC, etc.)
    Now with fuzzy search support.
    """
    if law_name.lower() not in LAW_FILES:
        raise HTTPException(
            status_code=404,
            detail=f"Law '{law_name}' not found. Available: {', '.join(LAW_FILES.keys())}",
        )

    sections = _load_law_sections(law_name)

    # Filter by section number if provided
    if section is not None:
        sections = [s for s in sections if s.get("section") == section]

    # Enhanced search with fuzzy matching
    if search:
        sections = _search_filter(sections, search, ["title", "description"])

    # Pagination
    return sections[offset:offset + limit]


@router.get("/cases", response_model=List[CaseListItem])
async def get_case_summaries(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    search: Optional[str] = Query(None, description="Search in case name, principle, or summary"),
):
    """Get case summaries with enhanced fuzzy search."""
    cases = _load_cases()

    if search:
        cases = _search_filter(
            cases, search,
            ["case_name", "principle", "summary", "court", "relevance"],
        )

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
    """Get Companies Act, 2013 sections with enhanced search."""
    sections = _load_companies_act()
    if not sections:
        raise HTTPException(status_code=404, detail="Companies Act file not found")

    # Filter by section number
    if section:
        sections = [s for s in sections if s.get("section") == section]

    # Enhanced search with fuzzy matching
    if search:
        sections = _search_filter(sections, search, ["title", "content", "section"])

    total = len(sections)
    sections = sections[offset:offset + limit]

    return {
        "data": sections,
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get("/stats")
async def get_legal_data_stats():
    """Get statistics about available legal data"""
    stats = {}

    law_dir = DATA_DIR / "indian_law_json" / "Indian-Law-Penal-Code-Json-main"
    stats["laws"] = {}

    for law_name, filename in LAW_FILES.items():
        law_file = law_dir / filename
        if law_file.exists():
            try:
                with open(law_file, "r", encoding="utf-8") as f:
                    sections = json.load(f)
                    stats["laws"][law_name] = len(sections)
            except Exception:
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
        except Exception:
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
        except Exception:
            stats["companies_act_sections"] = 0
    else:
        stats["companies_act_sections"] = 0

    return stats
