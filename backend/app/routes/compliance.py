"""
Compliance Deadlines API — with AI-powered risk assessment.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import json
from datetime import date, timedelta
from pathlib import Path

router = APIRouter()

DATA_DIR = Path(__file__).parent.parent.parent.parent / "data" / "datasets" / "samples"


def load_compliance_templates():
    """Load compliance deadline templates from JSON file."""
    file_path = DATA_DIR / "compliance_deadlines.json"
    if not file_path.exists():
        return []
    with open(file_path, "r") as f:
        return json.load(f)


def generate_upcoming_deadlines(templates, months_ahead=3):
    """Generate actual deadline dates from templates."""
    today = date.today()
    deadlines = []

    for template in templates:
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
    limit: int = Query(50, ge=1, le=1000),
    offset: int = Query(0, ge=0),
):
    """Get all compliance deadlines with generated dates."""
    templates = load_compliance_templates()
    deadlines = generate_upcoming_deadlines(templates)

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
    categories = {}
    for t in templates:
        cat = t["category"]
        if cat not in categories:
            categories[cat] = 0
        categories[cat] += 1
    return {"categories": [{"name": k, "count": v} for k, v in categories.items()]}


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
