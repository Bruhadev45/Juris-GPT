from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional
import json
import uuid
from datetime import datetime, date
from pathlib import Path

router = APIRouter()

DATA_DIR = Path(__file__).parent.parent.parent.parent / "data"
RTI_FILE = DATA_DIR / "rti_applications.json"

DEPARTMENTS = [
    {"id": "info_broadcasting", "name": "Ministry of Information & Broadcasting", "pio_designation": "Central Public Information Officer (CPIO)"},
    {"id": "home_affairs", "name": "Ministry of Home Affairs", "pio_designation": "Central Public Information Officer (CPIO)"},
    {"id": "finance", "name": "Ministry of Finance", "pio_designation": "Central Public Information Officer (CPIO)"},
    {"id": "health", "name": "Ministry of Health & Family Welfare", "pio_designation": "Central Public Information Officer (CPIO)"},
    {"id": "education", "name": "Ministry of Education", "pio_designation": "Central Public Information Officer (CPIO)"},
    {"id": "railways", "name": "Ministry of Railways", "pio_designation": "Central Public Information Officer (CPIO)"},
    {"id": "urban_development", "name": "Ministry of Housing & Urban Affairs", "pio_designation": "Central Public Information Officer (CPIO)"},
    {"id": "rural_development", "name": "Ministry of Rural Development", "pio_designation": "Central Public Information Officer (CPIO)"},
    {"id": "law_justice", "name": "Ministry of Law & Justice", "pio_designation": "Central Public Information Officer (CPIO)"},
    {"id": "commerce_industry", "name": "Ministry of Commerce & Industry", "pio_designation": "Central Public Information Officer (CPIO)"},
    {"id": "environment", "name": "Ministry of Environment, Forest & Climate Change", "pio_designation": "Central Public Information Officer (CPIO)"},
    {"id": "labour", "name": "Ministry of Labour & Employment", "pio_designation": "Central Public Information Officer (CPIO)"},
    {"id": "corporate_affairs", "name": "Ministry of Corporate Affairs", "pio_designation": "Central Public Information Officer (CPIO)"},
    {"id": "electronics_it", "name": "Ministry of Electronics & Information Technology", "pio_designation": "Central Public Information Officer (CPIO)"},
    {"id": "external_affairs", "name": "Ministry of External Affairs", "pio_designation": "Central Public Information Officer (CPIO)"},
    {"id": "defence", "name": "Ministry of Defence", "pio_designation": "Central Public Information Officer (CPIO)"},
    {"id": "agriculture", "name": "Ministry of Agriculture & Farmers Welfare", "pio_designation": "Central Public Information Officer (CPIO)"},
    {"id": "power", "name": "Ministry of Power", "pio_designation": "Central Public Information Officer (CPIO)"},
    {"id": "petroleum", "name": "Ministry of Petroleum & Natural Gas", "pio_designation": "Central Public Information Officer (CPIO)"},
    {"id": "telecom", "name": "Department of Telecommunications", "pio_designation": "Central Public Information Officer (CPIO)"},
]


class RTIGenerateRequest(BaseModel):
    department_id: str = Field(..., description="Department ID from /departments endpoint")
    subject: str = Field(..., min_length=5, max_length=500, description="Subject of the RTI application")
    information_requested: str = Field(..., min_length=10, max_length=5000, description="Detailed description of information sought")
    applicant_name: str = Field(..., min_length=2, max_length=200, description="Full name of the applicant")
    applicant_address: str = Field(..., min_length=10, max_length=1000, description="Full postal address of the applicant")
    applicant_phone: Optional[str] = Field(None, max_length=15, description="Contact phone number")
    applicant_email: Optional[str] = Field(None, max_length=200, description="Contact email address")
    fee_mode: str = Field("IPO", description="Mode of fee payment: IPO (Indian Postal Order), DD (Demand Draft), Cash, Online")
    is_bpl: bool = Field(False, description="Whether the applicant belongs to Below Poverty Line category (fee exempt)")


def _ensure_file():
    RTI_FILE.parent.mkdir(parents=True, exist_ok=True)
    if not RTI_FILE.exists():
        with open(RTI_FILE, "w") as f:
            json.dump([], f)


def _load_applications() -> list:
    _ensure_file()
    with open(RTI_FILE, "r") as f:
        return json.load(f)


def _save_applications(apps: list):
    _ensure_file()
    with open(RTI_FILE, "w") as f:
        json.dump(apps, f, indent=2, default=str)


def _generate_rti_text(dept: dict, req: RTIGenerateRequest) -> str:
    """Generate a properly formatted RTI application text."""
    today_str = date.today().strftime("%d/%m/%Y")

    fee_text = "Rs. 10/- via Indian Postal Order" if req.fee_mode == "IPO" else \
               "Rs. 10/- via Demand Draft" if req.fee_mode == "DD" else \
               "Rs. 10/- in Cash" if req.fee_mode == "Cash" else \
               "Rs. 10/- via Online Payment"

    if req.is_bpl:
        fee_text = "NIL (BPL category - fee exempt under Section 7(5) of RTI Act, 2005)"

    contact_lines = ""
    if req.applicant_phone:
        contact_lines += f"\nPhone: {req.applicant_phone}"
    if req.applicant_email:
        contact_lines += f"\nEmail: {req.applicant_email}"

    application_text = f"""APPLICATION UNDER THE RIGHT TO INFORMATION ACT, 2005
{'=' * 65}

Date: {today_str}

To,
The {dept['pio_designation']},
{dept['name']},
Government of India,
New Delhi - 110001

Subject: {req.subject}

Respected Sir/Madam,

I, {req.applicant_name}, am an Indian citizen and I hereby submit this
application under Section 6(1) of the Right to Information Act, 2005
to seek the following information:

INFORMATION SOUGHT:
{'-' * 40}
{req.information_requested}
{'-' * 40}

I request that the above information be provided to me in the form of
photocopies/printed format/electronic format (whichever is applicable
and available).

I state that the information sought does not fall within the
restrictions contained in Section 8 of the RTI Act and to the best of
my knowledge it pertains to your office.

APPLICATION FEE:
{fee_text}

APPLICANT DETAILS:
Name: {req.applicant_name}
Address: {req.applicant_address}{contact_lines}

I hereby declare that I am a citizen of India and the information
sought is for a lawful purpose.

Thanking you,

{req.applicant_name}
Date: {today_str}
Place: As per address above

{'=' * 65}
NOTE: This application has been generated as a draft. Please review
and verify all details before submission. The application fee of
Rs. 10/- must be attached as per the mode indicated above.
{'=' * 65}

IMPORTANT GUIDELINES:
1. Send this application via Speed Post/Registered Post for proof of
   delivery.
2. Keep a photocopy of the application and postal receipt.
3. Response is expected within 30 days from receipt of application.
4. If no response within 30 days, you may file a First Appeal under
   Section 19(1) to the First Appellate Authority.
5. If dissatisfied with the First Appeal, file Second Appeal to the
   Central/State Information Commission under Section 19(3).
"""
    return application_text


@router.get("/departments")
async def get_departments():
    """Get all available government departments for RTI applications."""
    return {"data": DEPARTMENTS, "total": len(DEPARTMENTS)}


@router.post("/generate")
async def generate_rti(req: RTIGenerateRequest):
    """Generate a formatted RTI application."""
    dept = next((d for d in DEPARTMENTS if d["id"] == req.department_id), None)
    if not dept:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid department ID. Use GET /departments for available options.",
        )

    application_text = _generate_rti_text(dept, req)

    app_id = str(uuid.uuid4())
    record = {
        "id": app_id,
        "department_id": req.department_id,
        "department_name": dept["name"],
        "subject": req.subject,
        "information_requested": req.information_requested,
        "applicant_name": req.applicant_name,
        "applicant_address": req.applicant_address,
        "applicant_phone": req.applicant_phone,
        "applicant_email": req.applicant_email,
        "fee_mode": req.fee_mode,
        "is_bpl": req.is_bpl,
        "application_text": application_text,
        "generated_at": datetime.utcnow().isoformat(),
        "status": "draft",
    }

    apps = _load_applications()
    apps.append(record)
    _save_applications(apps)

    return {"data": record, "message": "RTI application generated successfully"}


@router.get("/applications")
async def list_applications(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """List all generated RTI applications."""
    apps = _load_applications()
    total = len(apps)
    # Sort newest first
    apps.sort(key=lambda x: x.get("generated_at", ""), reverse=True)
    apps = apps[offset : offset + limit]
    return {"data": apps, "total": total}


@router.get("/applications/{app_id}")
async def get_application(app_id: str):
    """Get a specific RTI application by ID."""
    apps = _load_applications()
    app = next((a for a in apps if a["id"] == app_id), None)
    if not app:
        raise HTTPException(status_code=404, detail="RTI application not found")
    return {"data": app}
