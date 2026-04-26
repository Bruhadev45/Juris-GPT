"""
Compliance Deadlines API — with AI-powered risk assessment and Indian regulatory calendar.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from pydantic import BaseModel
import json
from datetime import date, timedelta
from pathlib import Path
from enum import Enum

router = APIRouter()

DATA_DIR = Path(__file__).parent.parent.parent.parent / "data" / "datasets" / "samples"


class CompanyType(str, Enum):
    PRIVATE_LIMITED = "private_limited"
    PUBLIC_LIMITED = "public_limited"
    LLP = "llp"
    ONE_PERSON = "one_person"
    PARTNERSHIP = "partnership"
    PROPRIETORSHIP = "proprietorship"


class IndianCalendarRequest(BaseModel):
    company_type: CompanyType = CompanyType.PRIVATE_LIMITED
    financial_year_end: str = "march"  # month when FY ends
    agm_date: Optional[str] = None  # Date of last AGM
    incorporation_date: Optional[str] = None


class ComplianceItem(BaseModel):
    id: str
    title: str
    category: str
    description: str
    due_date: str
    days_remaining: int
    status: str
    urgency: str
    recurring: str
    penalty: Optional[str] = None
    applicable_to: Optional[List[str]] = None
    law_reference: Optional[str] = None


class IndianCalendarResponse(BaseModel):
    company_type: str
    deadlines: List[ComplianceItem]
    summary: dict


# Indian regulatory categories with their applicable company types
INDIAN_COMPLIANCE_APPLICABILITY = {
    "ROC": {
        "applicable_to": ["private_limited", "public_limited", "one_person"],
        "description": "Ministry of Corporate Affairs (MCA) / Registrar of Companies filings under Companies Act 2013"
    },
    "GST": {
        "applicable_to": ["private_limited", "public_limited", "llp", "one_person", "partnership", "proprietorship"],
        "description": "Goods and Services Tax compliance under CGST/SGST/IGST Acts"
    },
    "TDS": {
        "applicable_to": ["private_limited", "public_limited", "llp", "one_person", "partnership", "proprietorship"],
        "description": "Tax Deducted at Source compliance under Income Tax Act 1961"
    },
    "PF/ESI": {
        "applicable_to": ["private_limited", "public_limited", "llp", "one_person", "partnership", "proprietorship"],
        "description": "Labour law compliance under EPF Act 1952 and ESI Act 1948"
    },
    "Income Tax": {
        "applicable_to": ["private_limited", "public_limited", "llp", "one_person", "partnership", "proprietorship"],
        "description": "Income Tax compliance under Income Tax Act 1961"
    },
    "Board Meetings": {
        "applicable_to": ["private_limited", "public_limited", "one_person"],
        "description": "Board and General Meetings under Companies Act 2013"
    }
}


def load_compliance_templates():
    """Load compliance deadline templates from JSON file."""
    file_path = DATA_DIR / "compliance_deadlines.json"
    if not file_path.exists():
        return []
    with open(file_path, "r") as f:
        return json.load(f)


def generate_upcoming_deadlines(templates, months_ahead=3, company_type=None):
    """Generate actual deadline dates from templates."""
    today = date.today()
    deadlines = []

    for template in templates:
        # Filter by company type if specified
        if company_type:
            applicable_to = template.get("applicable_to", [])
            category = template.get("category", "")

            # Check if category is applicable to company type
            category_info = INDIAN_COMPLIANCE_APPLICABILITY.get(category, {})
            category_applicable = category_info.get("applicable_to", [])

            # Skip if company type not in applicable list
            if category_applicable and company_type not in category_applicable:
                continue

        if template.get("recurring") == "monthly":
            for month_offset in range(months_ahead):
                month = today.month + month_offset
                year = today.year
                if month > 12:
                    month -= 12
                    year += 1
                try:
                    due = date(year, month, template["due_day"])
                except ValueError:
                    import calendar
                    last_day = calendar.monthrange(year, month)[1]
                    due = date(year, month, min(template["due_day"], last_day))

                days_remaining = (due - today).days
                deadlines.append({
                    **template,
                    "due_date": due.isoformat(),
                    "days_remaining": days_remaining,
                    "status": "overdue" if days_remaining < 0 else "upcoming" if days_remaining <= 7 else "pending",
                    "urgency": "critical" if days_remaining < 0 else "high" if days_remaining <= 7 else "medium" if days_remaining <= 30 else "low",
                })
        elif template.get("recurring") in ["quarterly", "annual"]:
            due_month = template.get("due_month", 1)
            due_day = template.get("due_day", 1)

            if template["recurring"] == "annual":
                for year in [today.year, today.year + 1]:
                    try:
                        due = date(year, due_month, due_day)
                    except ValueError:
                        continue
                    days_remaining = (due - today).days
                    if -30 <= days_remaining <= 365:
                        deadlines.append({
                            **template,
                            "due_date": due.isoformat(),
                            "days_remaining": days_remaining,
                            "status": "overdue" if days_remaining < 0 else "upcoming" if days_remaining <= 7 else "pending",
                            "urgency": "critical" if days_remaining < 0 else "high" if days_remaining <= 7 else "medium" if days_remaining <= 30 else "low",
                        })
            elif template["recurring"] == "quarterly":
                quarters = template.get("quarters", [])
                for q in quarters:
                    q_month = q.get("month", 1)
                    q_day = q.get("day", 1)
                    for year in [today.year, today.year + 1]:
                        try:
                            due = date(year, q_month, q_day)
                        except ValueError:
                            continue
                        days_remaining = (due - today).days
                        if -30 <= days_remaining <= 365:
                            deadlines.append({
                                **template,
                                "due_date": due.isoformat(),
                                "days_remaining": days_remaining,
                                "status": "overdue" if days_remaining < 0 else "upcoming" if days_remaining <= 7 else "pending",
                                "urgency": "critical" if days_remaining < 0 else "high" if days_remaining <= 7 else "medium" if days_remaining <= 30 else "low",
                            })

    deadlines.sort(key=lambda x: x["due_date"])
    return deadlines


@router.get("/api/compliance/deadlines")
async def get_deadlines(
    category: Optional[str] = Query(None, description="Filter by category (GST, ROC, TDS, etc.)"),
    status: Optional[str] = Query(None, description="Filter by status (pending, upcoming, overdue)"),
    company_type: Optional[str] = Query(None, description="Filter by company type"),
    limit: int = Query(50, ge=1, le=1000),
    offset: int = Query(0, ge=0),
):
    """Get all compliance deadlines with generated dates."""
    templates = load_compliance_templates()
    deadlines = generate_upcoming_deadlines(templates, company_type=company_type)

    if category:
        deadlines = [d for d in deadlines if d["category"].lower() == category.lower()]
    if status:
        deadlines = [d for d in deadlines if d["status"] == status]

    total = len(deadlines)
    deadlines = deadlines[offset:offset + limit]

    return {"data": deadlines, "total": total}


@router.get("/api/compliance/upcoming")
async def get_upcoming(days: int = Query(30, ge=1, le=365)):
    """Get deadlines due in the next N days."""
    templates = load_compliance_templates()
    deadlines = generate_upcoming_deadlines(templates)

    upcoming = [d for d in deadlines if 0 <= d["days_remaining"] <= days]
    return {"data": upcoming, "total": len(upcoming)}


@router.get("/api/compliance/categories")
async def get_categories():
    """Get all compliance categories with counts."""
    templates = load_compliance_templates()
    deadlines = generate_upcoming_deadlines(templates)

    categories = {}
    for d in deadlines:
        cat = d["category"]
        if cat not in categories:
            categories[cat] = 0
        categories[cat] += 1
    return {"categories": [{"name": k, "count": v} for k, v in categories.items()]}


@router.get("/api/compliance/indian-calendar")
async def get_indian_calendar(
    company_type: str = Query("private_limited", description="Type of company (private_limited, public_limited, llp, one_person, partnership, proprietorship)"),
    months_ahead: int = Query(6, ge=1, le=12, description="Number of months to look ahead"),
):
    """
    Get Indian compliance calendar based on company type.

    Returns pre-populated compliance deadlines applicable to the specified company type
    based on Indian regulatory requirements including:
    - ROC/MCA Filings (Companies Act 2013)
    - GST Compliance
    - TDS Compliance (Income Tax)
    - Labour Law Compliance (PF/ESI)
    - Board Meeting requirements
    """
    templates = load_compliance_templates()
    deadlines = generate_upcoming_deadlines(templates, months_ahead=months_ahead, company_type=company_type)

    # Calculate summary statistics
    today = date.today()
    overdue = [d for d in deadlines if d["status"] == "overdue"]
    due_this_week = [d for d in deadlines if 0 <= d["days_remaining"] <= 7]
    upcoming_30_days = [d for d in deadlines if 0 <= d["days_remaining"] <= 30]

    # Group by category
    by_category = {}
    for d in deadlines:
        cat = d["category"]
        if cat not in by_category:
            by_category[cat] = []
        by_category[cat].append(d)

    summary = {
        "total_deadlines": len(deadlines),
        "overdue_count": len(overdue),
        "due_this_week": len(due_this_week),
        "due_this_month": len(upcoming_30_days),
        "by_category": {k: len(v) for k, v in by_category.items()},
        "applicable_categories": [
            {
                "category": cat,
                "description": info["description"],
                "count": len(by_category.get(cat, []))
            }
            for cat, info in INDIAN_COMPLIANCE_APPLICABILITY.items()
            if company_type in info["applicable_to"]
        ]
    }

    return {
        "company_type": company_type,
        "generated_date": today.isoformat(),
        "deadlines": deadlines,
        "summary": summary
    }


@router.get("/api/compliance/indian-categories")
async def get_indian_categories():
    """Get information about Indian compliance categories."""
    return {
        "categories": [
            {
                "id": cat,
                "name": cat,
                "description": info["description"],
                "applicable_to": info["applicable_to"]
            }
            for cat, info in INDIAN_COMPLIANCE_APPLICABILITY.items()
        ]
    }


@router.get("/api/compliance/company-types")
async def get_company_types():
    """Get list of supported company types with their applicable compliance categories."""
    company_types = [
        {
            "id": "private_limited",
            "name": "Private Limited Company",
            "description": "Company limited by shares with restrictions on transfer of shares",
            "applicable_compliances": ["ROC", "GST", "TDS", "PF/ESI", "Income Tax", "Board Meetings"]
        },
        {
            "id": "public_limited",
            "name": "Public Limited Company",
            "description": "Company whose shares can be publicly traded",
            "applicable_compliances": ["ROC", "GST", "TDS", "PF/ESI", "Income Tax", "Board Meetings"]
        },
        {
            "id": "llp",
            "name": "Limited Liability Partnership",
            "description": "Partnership with limited liability for partners",
            "applicable_compliances": ["GST", "TDS", "PF/ESI", "Income Tax"]
        },
        {
            "id": "one_person",
            "name": "One Person Company (OPC)",
            "description": "Company with single shareholder and director",
            "applicable_compliances": ["ROC", "GST", "TDS", "PF/ESI", "Income Tax", "Board Meetings"]
        },
        {
            "id": "partnership",
            "name": "Partnership Firm",
            "description": "Traditional partnership under Partnership Act 1932",
            "applicable_compliances": ["GST", "TDS", "PF/ESI", "Income Tax"]
        },
        {
            "id": "proprietorship",
            "name": "Sole Proprietorship",
            "description": "Business owned and managed by single individual",
            "applicable_compliances": ["GST", "TDS", "PF/ESI", "Income Tax"]
        }
    ]
    return {"company_types": company_types}


@router.post("/api/compliance/mark-complete")
async def mark_complete(deadline_id: str, due_date: str):
    """Mark a compliance deadline as complete."""
    # In a real implementation, this would save to database
    # For now, we return success (client handles localStorage persistence)
    return {
        "success": True,
        "message": f"Deadline {deadline_id} for {due_date} marked as complete",
        "completed_at": date.today().isoformat()
    }


@router.get("/api/compliance/penalties")
async def get_penalties(category: Optional[str] = None):
    """Get penalty information for compliance categories."""
    penalties_info = {
        "ROC": {
            "category": "ROC/MCA Filings",
            "governing_law": "Companies Act, 2013",
            "penalties": [
                {
                    "filing": "AOC-4 (Financial Statements)",
                    "penalty": "Rs. 100/day per default for company and every officer",
                    "max_penalty": "Rs. 10 lakh for company"
                },
                {
                    "filing": "MGT-7 (Annual Return)",
                    "penalty": "Rs. 100/day per default for company and every officer",
                    "max_penalty": "Prosecution possible"
                },
                {
                    "filing": "DIR-3 KYC",
                    "penalty": "Rs. 5,000 late fee",
                    "consequence": "DIN deactivation"
                },
                {
                    "filing": "INC-20A (Business Commencement)",
                    "penalty": "Rs. 50,000 for company; Rs. 1,000/day for officers",
                    "consequence": "Company may be struck off"
                }
            ]
        },
        "GST": {
            "category": "GST Compliance",
            "governing_law": "CGST Act, 2017",
            "penalties": [
                {
                    "filing": "GSTR-1/3B",
                    "penalty": "Rs. 50/day for CGST + Rs. 50/day for SGST",
                    "max_penalty": "Rs. 10,000 total",
                    "interest": "18% p.a. on tax due"
                },
                {
                    "filing": "GSTR-9 (Annual)",
                    "penalty": "Rs. 200/day",
                    "max_penalty": "0.50% of turnover"
                }
            ]
        },
        "TDS": {
            "category": "TDS Compliance",
            "governing_law": "Income Tax Act, 1961",
            "penalties": [
                {
                    "filing": "TDS Payment",
                    "penalty": "1% per month from deduction to deposit",
                    "additional": "1.5% per month from due date"
                },
                {
                    "filing": "TDS Return (24Q/26Q)",
                    "penalty": "Rs. 200/day under Section 234E",
                    "max_penalty": "Equal to TDS amount",
                    "additional_penalty": "Rs. 10,000 to Rs. 1,00,000 under Section 271H"
                },
                {
                    "filing": "Form 16/16A",
                    "penalty": "Rs. 100/day per certificate per deductee"
                }
            ]
        },
        "PF/ESI": {
            "category": "Labour Law Compliance",
            "governing_law": "EPF Act, 1952 and ESI Act, 1948",
            "penalties": [
                {
                    "filing": "PF Payment",
                    "penalty": "Interest @ 12% p.a.",
                    "damages": "Up to 100% of arrears",
                    "prosecution": "Possible under Section 14"
                },
                {
                    "filing": "ESI Payment",
                    "penalty": "Interest @ 12% p.a.",
                    "damages": "Up to 25% of arrears",
                    "prosecution": "Imprisonment possible"
                }
            ]
        },
        "Income Tax": {
            "category": "Income Tax Compliance",
            "governing_law": "Income Tax Act, 1961",
            "penalties": [
                {
                    "filing": "ITR Filing",
                    "penalty": "Rs. 5,000 under Section 234F",
                    "reduced_penalty": "Rs. 1,000 if income below Rs. 5 lakh",
                    "interest": "1% per month under Section 234A"
                },
                {
                    "filing": "Advance Tax",
                    "penalty": "Interest @ 1% per month under Section 234B/234C"
                },
                {
                    "filing": "Tax Audit (44AB)",
                    "penalty": "0.5% of turnover or Rs. 1,50,000 whichever is less"
                }
            ]
        }
    }

    if category:
        if category.upper() in penalties_info:
            return {"penalty_info": penalties_info[category.upper()]}
        else:
            raise HTTPException(status_code=404, detail=f"Category {category} not found")

    return {"penalties": list(penalties_info.values())}


@router.get("/api/compliance/risk-assessment/{deadline_id}")
async def get_risk_assessment(deadline_id: str):
    """Get AI-powered risk assessment for a specific compliance deadline."""
    templates = load_compliance_templates()
    deadlines = generate_upcoming_deadlines(templates)

    deadline = next((d for d in deadlines if d.get("id") == deadline_id), None)
    if not deadline:
        raise HTTPException(status_code=404, detail="Deadline not found")

    try:
        from app.services.ai_analyzer import assess_compliance_risk
        assessment = assess_compliance_risk(
            deadline.get("title", ""),
            deadline.get("category", ""),
            deadline.get("days_remaining", 0),
        )
        return {
            "deadline_id": deadline_id,
            "title": deadline.get("title", ""),
            "category": deadline.get("category", ""),
            "days_remaining": deadline.get("days_remaining", 0),
            "assessment": assessment,
        }
    except Exception as e:
        return {
            "deadline_id": deadline_id,
            "title": deadline.get("title", ""),
            "assessment": {
                "risk_note": "AI assessment unavailable",
                "penalty_info": deadline.get("penalty", "Contact a compliance expert"),
                "action_items": ["Review deadline requirements", "Prepare required documents"],
            },
        }
