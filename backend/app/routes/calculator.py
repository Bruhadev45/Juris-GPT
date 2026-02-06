from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
import math

router = APIRouter()


# ─── Pydantic models ───────────────────────────────────────────────────────────

class StampDutyRequest(BaseModel):
    state: str = Field(..., description="Indian state (e.g., Maharashtra, Karnataka, Delhi)")
    document_type: str = Field(..., description="Type of document (e.g., Sale Deed, Lease, Gift Deed)")
    property_value: float = Field(..., gt=0, description="Property/transaction value in INR")
    is_female: bool = Field(False, description="Whether the buyer is female (some states offer concession)")

class CourtFeesRequest(BaseModel):
    court_type: str = Field(..., description="Type of court (District Court, High Court, Supreme Court, Consumer Forum, NCLT)")
    case_type: str = Field(..., description="Type of case (Civil Suit, Criminal Appeal, Writ Petition, Company Petition, etc.)")
    claim_amount: float = Field(0, ge=0, description="Claim amount in INR (for ad-valorem fee calculation)")

class GSTRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Base amount in INR")
    rate: float = Field(..., description="GST rate (5, 12, 18, or 28)")
    is_igst: bool = Field(False, description="True for IGST (inter-state), False for CGST+SGST (intra-state)")

class TDSRequest(BaseModel):
    section: str = Field(..., description="TDS section (194A, 194C, 194H, 194I, 194J)")
    amount: float = Field(..., gt=0, description="Payment amount in INR")
    has_pan: bool = Field(True, description="Whether the deductee has provided PAN")

class GratuityRequest(BaseModel):
    last_drawn_salary: float = Field(..., gt=0, description="Last drawn basic salary + DA per month in INR")
    years_of_service: float = Field(..., gt=0, description="Total years of continuous service")

class EMIRequest(BaseModel):
    principal: float = Field(..., gt=0, description="Loan principal amount in INR")
    annual_rate: float = Field(..., gt=0, description="Annual interest rate in percentage")
    tenure_months: int = Field(..., gt=0, le=360, description="Loan tenure in months")


# ─── Stamp duty rates by state ────────────────────────────────────────────────

STAMP_DUTY_RATES = {
    "Maharashtra": {
        "Sale Deed": {"rate": 5.0, "registration": 1.0, "metro_surcharge": 1.0, "female_concession": 1.0},
        "Lease": {"rate": 3.0, "registration": 1.0, "metro_surcharge": 0.0, "female_concession": 0.0},
        "Gift Deed": {"rate": 3.0, "registration": 1.0, "metro_surcharge": 0.0, "female_concession": 0.0},
        "Mortgage Deed": {"rate": 5.0, "registration": 1.0, "metro_surcharge": 0.0, "female_concession": 0.0},
        "Power of Attorney": {"rate": 3.0, "registration": 1.0, "metro_surcharge": 0.0, "female_concession": 0.0},
        "Agreement to Sell": {"rate": 5.0, "registration": 1.0, "metro_surcharge": 1.0, "female_concession": 1.0},
        "Partnership Deed": {"rate": 0.5, "registration": 1.0, "metro_surcharge": 0.0, "female_concession": 0.0},
    },
    "Karnataka": {
        "Sale Deed": {"rate": 5.0, "registration": 1.0, "metro_surcharge": 0.0, "female_concession": 0.0},
        "Lease": {"rate": 3.0, "registration": 1.0, "metro_surcharge": 0.0, "female_concession": 0.0},
        "Gift Deed": {"rate": 5.0, "registration": 1.0, "metro_surcharge": 0.0, "female_concession": 0.0},
        "Mortgage Deed": {"rate": 5.0, "registration": 1.0, "metro_surcharge": 0.0, "female_concession": 0.0},
        "Power of Attorney": {"rate": 5.0, "registration": 1.0, "metro_surcharge": 0.0, "female_concession": 0.0},
        "Agreement to Sell": {"rate": 5.0, "registration": 1.0, "metro_surcharge": 0.0, "female_concession": 0.0},
        "Partnership Deed": {"rate": 0.5, "registration": 1.0, "metro_surcharge": 0.0, "female_concession": 0.0},
    },
    "Delhi": {
        "Sale Deed": {"rate": 6.0, "registration": 1.0, "metro_surcharge": 0.0, "female_concession": 2.0},
        "Lease": {"rate": 3.0, "registration": 1.0, "metro_surcharge": 0.0, "female_concession": 0.0},
        "Gift Deed": {"rate": 4.0, "registration": 1.0, "metro_surcharge": 0.0, "female_concession": 0.0},
        "Mortgage Deed": {"rate": 5.0, "registration": 1.0, "metro_surcharge": 0.0, "female_concession": 0.0},
        "Power of Attorney": {"rate": 3.0, "registration": 1.0, "metro_surcharge": 0.0, "female_concession": 0.0},
        "Agreement to Sell": {"rate": 6.0, "registration": 1.0, "metro_surcharge": 0.0, "female_concession": 2.0},
        "Partnership Deed": {"rate": 0.5, "registration": 1.0, "metro_surcharge": 0.0, "female_concession": 0.0},
    },
    "Tamil Nadu": {
        "Sale Deed": {"rate": 7.0, "registration": 4.0, "metro_surcharge": 0.0, "female_concession": 0.0},
        "Lease": {"rate": 4.0, "registration": 1.0, "metro_surcharge": 0.0, "female_concession": 0.0},
        "Gift Deed": {"rate": 7.0, "registration": 4.0, "metro_surcharge": 0.0, "female_concession": 0.0},
        "Mortgage Deed": {"rate": 4.0, "registration": 1.0, "metro_surcharge": 0.0, "female_concession": 0.0},
        "Power of Attorney": {"rate": 4.0, "registration": 1.0, "metro_surcharge": 0.0, "female_concession": 0.0},
        "Agreement to Sell": {"rate": 7.0, "registration": 4.0, "metro_surcharge": 0.0, "female_concession": 0.0},
        "Partnership Deed": {"rate": 1.0, "registration": 1.0, "metro_surcharge": 0.0, "female_concession": 0.0},
    },
    "Uttar Pradesh": {
        "Sale Deed": {"rate": 7.0, "registration": 1.0, "metro_surcharge": 0.0, "female_concession": 2.0},
        "Lease": {"rate": 4.0, "registration": 1.0, "metro_surcharge": 0.0, "female_concession": 0.0},
        "Gift Deed": {"rate": 5.0, "registration": 1.0, "metro_surcharge": 0.0, "female_concession": 0.0},
        "Mortgage Deed": {"rate": 5.0, "registration": 1.0, "metro_surcharge": 0.0, "female_concession": 0.0},
        "Power of Attorney": {"rate": 4.0, "registration": 1.0, "metro_surcharge": 0.0, "female_concession": 0.0},
        "Agreement to Sell": {"rate": 7.0, "registration": 1.0, "metro_surcharge": 0.0, "female_concession": 2.0},
        "Partnership Deed": {"rate": 0.5, "registration": 1.0, "metro_surcharge": 0.0, "female_concession": 0.0},
    },
    "Rajasthan": {
        "Sale Deed": {"rate": 5.0, "registration": 1.0, "metro_surcharge": 0.0, "female_concession": 1.0},
        "Lease": {"rate": 3.0, "registration": 1.0, "metro_surcharge": 0.0, "female_concession": 0.0},
        "Gift Deed": {"rate": 3.0, "registration": 1.0, "metro_surcharge": 0.0, "female_concession": 0.0},
        "Mortgage Deed": {"rate": 4.0, "registration": 1.0, "metro_surcharge": 0.0, "female_concession": 0.0},
        "Power of Attorney": {"rate": 3.0, "registration": 1.0, "metro_surcharge": 0.0, "female_concession": 0.0},
        "Agreement to Sell": {"rate": 5.0, "registration": 1.0, "metro_surcharge": 0.0, "female_concession": 1.0},
        "Partnership Deed": {"rate": 0.5, "registration": 1.0, "metro_surcharge": 0.0, "female_concession": 0.0},
    },
    "West Bengal": {
        "Sale Deed": {"rate": 6.0, "registration": 1.0, "metro_surcharge": 1.0, "female_concession": 0.0},
        "Lease": {"rate": 3.0, "registration": 1.0, "metro_surcharge": 0.0, "female_concession": 0.0},
        "Gift Deed": {"rate": 5.0, "registration": 1.0, "metro_surcharge": 0.0, "female_concession": 0.0},
        "Mortgage Deed": {"rate": 5.0, "registration": 1.0, "metro_surcharge": 0.0, "female_concession": 0.0},
        "Power of Attorney": {"rate": 4.0, "registration": 1.0, "metro_surcharge": 0.0, "female_concession": 0.0},
        "Agreement to Sell": {"rate": 6.0, "registration": 1.0, "metro_surcharge": 1.0, "female_concession": 0.0},
        "Partnership Deed": {"rate": 0.5, "registration": 1.0, "metro_surcharge": 0.0, "female_concession": 0.0},
    },
    "Gujarat": {
        "Sale Deed": {"rate": 4.9, "registration": 1.0, "metro_surcharge": 0.0, "female_concession": 0.0},
        "Lease": {"rate": 3.0, "registration": 1.0, "metro_surcharge": 0.0, "female_concession": 0.0},
        "Gift Deed": {"rate": 4.9, "registration": 1.0, "metro_surcharge": 0.0, "female_concession": 0.0},
        "Mortgage Deed": {"rate": 4.9, "registration": 1.0, "metro_surcharge": 0.0, "female_concession": 0.0},
        "Power of Attorney": {"rate": 3.0, "registration": 1.0, "metro_surcharge": 0.0, "female_concession": 0.0},
        "Agreement to Sell": {"rate": 4.9, "registration": 1.0, "metro_surcharge": 0.0, "female_concession": 0.0},
        "Partnership Deed": {"rate": 0.5, "registration": 1.0, "metro_surcharge": 0.0, "female_concession": 0.0},
    },
    "Telangana": {
        "Sale Deed": {"rate": 5.0, "registration": 0.5, "metro_surcharge": 0.0, "female_concession": 0.0},
        "Lease": {"rate": 3.0, "registration": 0.5, "metro_surcharge": 0.0, "female_concession": 0.0},
        "Gift Deed": {"rate": 5.0, "registration": 0.5, "metro_surcharge": 0.0, "female_concession": 0.0},
        "Mortgage Deed": {"rate": 5.0, "registration": 0.5, "metro_surcharge": 0.0, "female_concession": 0.0},
        "Power of Attorney": {"rate": 3.0, "registration": 0.5, "metro_surcharge": 0.0, "female_concession": 0.0},
        "Agreement to Sell": {"rate": 5.0, "registration": 0.5, "metro_surcharge": 0.0, "female_concession": 0.0},
        "Partnership Deed": {"rate": 0.5, "registration": 0.5, "metro_surcharge": 0.0, "female_concession": 0.0},
    },
    "Kerala": {
        "Sale Deed": {"rate": 8.0, "registration": 2.0, "metro_surcharge": 0.0, "female_concession": 0.0},
        "Lease": {"rate": 4.0, "registration": 2.0, "metro_surcharge": 0.0, "female_concession": 0.0},
        "Gift Deed": {"rate": 5.0, "registration": 2.0, "metro_surcharge": 0.0, "female_concession": 0.0},
        "Mortgage Deed": {"rate": 5.0, "registration": 2.0, "metro_surcharge": 0.0, "female_concession": 0.0},
        "Power of Attorney": {"rate": 5.0, "registration": 2.0, "metro_surcharge": 0.0, "female_concession": 0.0},
        "Agreement to Sell": {"rate": 8.0, "registration": 2.0, "metro_surcharge": 0.0, "female_concession": 0.0},
        "Partnership Deed": {"rate": 1.0, "registration": 2.0, "metro_surcharge": 0.0, "female_concession": 0.0},
    },
}

# TDS sections and rates
TDS_RATES = {
    "194A": {
        "description": "Interest other than interest on securities",
        "rate": 10.0,
        "rate_no_pan": 20.0,
        "threshold": 40000,
        "threshold_senior": 50000,
        "notes": "Applicable on interest from bank deposits, FDs, etc.",
    },
    "194C": {
        "description": "Payment to contractors",
        "rate_individual": 1.0,
        "rate_others": 2.0,
        "rate_no_pan": 20.0,
        "threshold_single": 30000,
        "threshold_aggregate": 100000,
        "notes": "1% for individuals/HUF, 2% for others. Applicable on contractor payments.",
    },
    "194H": {
        "description": "Commission or brokerage",
        "rate": 5.0,
        "rate_no_pan": 20.0,
        "threshold": 15000,
        "notes": "Applicable on commission, brokerage (excluding insurance commission).",
    },
    "194I": {
        "description": "Rent",
        "rate_land_building": 10.0,
        "rate_plant_machinery": 2.0,
        "rate_no_pan": 20.0,
        "threshold": 240000,
        "notes": "2% for plant & machinery, 10% for land/building/furniture/fittings.",
    },
    "194J": {
        "description": "Professional or technical fees",
        "rate_professional": 10.0,
        "rate_technical": 2.0,
        "rate_no_pan": 20.0,
        "threshold": 30000,
        "notes": "10% for professional services, 2% for technical services/royalty. Threshold per transaction.",
    },
}

COURT_FEE_SCHEDULE = {
    "District Court": {
        "Civil Suit": {"type": "ad_valorem", "rate": 7.5, "minimum": 500, "maximum": 1500000},
        "Criminal Appeal": {"type": "fixed", "amount": 500},
        "Execution Petition": {"type": "ad_valorem", "rate": 2.5, "minimum": 200, "maximum": 500000},
        "Injunction": {"type": "fixed", "amount": 1000},
        "Declaratory Suit": {"type": "fixed", "amount": 2000},
    },
    "High Court": {
        "Civil Suit": {"type": "ad_valorem", "rate": 10.0, "minimum": 5000, "maximum": 5000000},
        "Writ Petition": {"type": "fixed", "amount": 5000},
        "Criminal Appeal": {"type": "fixed", "amount": 2000},
        "First Appeal": {"type": "ad_valorem", "rate": 5.0, "minimum": 2000, "maximum": 2500000},
        "Second Appeal": {"type": "ad_valorem", "rate": 5.0, "minimum": 3000, "maximum": 2500000},
        "Company Petition": {"type": "fixed", "amount": 5000},
    },
    "Supreme Court": {
        "Special Leave Petition": {"type": "fixed", "amount": 10000},
        "Civil Appeal": {"type": "fixed", "amount": 15000},
        "Criminal Appeal": {"type": "fixed", "amount": 5000},
        "Writ Petition": {"type": "fixed", "amount": 10000},
        "Review Petition": {"type": "fixed", "amount": 5000},
    },
    "Consumer Forum": {
        "District Commission (up to 1 Cr)": {"type": "slab", "slabs": [
            {"upto": 100000, "fee": 0},
            {"upto": 200000, "fee": 200},
            {"upto": 500000, "fee": 500},
            {"upto": 1000000, "fee": 1000},
            {"upto": 2000000, "fee": 2000},
            {"upto": 5000000, "fee": 3000},
            {"upto": 10000000, "fee": 5000},
        ]},
        "State Commission (1 Cr - 10 Cr)": {"type": "fixed", "amount": 25000},
        "National Commission (above 10 Cr)": {"type": "fixed", "amount": 50000},
    },
    "NCLT": {
        "Company Petition": {"type": "fixed", "amount": 5000},
        "Insolvency Application": {"type": "fixed", "amount": 2000},
        "CIRP Application": {"type": "fixed", "amount": 25000},
        "Appeal": {"type": "fixed", "amount": 10000},
    },
}


@router.get("/types")
async def get_calculator_types():
    """Get all available calculator types and their descriptions."""
    return {
        "calculators": [
            {
                "id": "stamp-duty",
                "name": "Stamp Duty Calculator",
                "description": "Calculate stamp duty and registration fees for property transactions across Indian states",
                "endpoint": "POST /api/calculator/stamp-duty",
            },
            {
                "id": "court-fees",
                "name": "Court Fees Calculator",
                "description": "Calculate court fees for various types of legal proceedings",
                "endpoint": "POST /api/calculator/court-fees",
            },
            {
                "id": "gst",
                "name": "GST Calculator",
                "description": "Calculate GST breakdown with CGST, SGST, and IGST components",
                "endpoint": "POST /api/calculator/gst",
            },
            {
                "id": "tds",
                "name": "TDS Calculator",
                "description": "Calculate TDS deductions under various sections of the Income Tax Act",
                "endpoint": "POST /api/calculator/tds",
            },
            {
                "id": "gratuity",
                "name": "Gratuity Calculator",
                "description": "Calculate gratuity payable under the Payment of Gratuity Act, 1972",
                "endpoint": "POST /api/calculator/gratuity",
            },
            {
                "id": "emi",
                "name": "EMI Calculator",
                "description": "Calculate EMI, total interest, and amortization for loans",
                "endpoint": "POST /api/calculator/emi",
            },
        ]
    }


@router.post("/stamp-duty")
async def calculate_stamp_duty(req: StampDutyRequest):
    """Calculate stamp duty and registration fees for a property transaction."""
    state_rates = STAMP_DUTY_RATES.get(req.state)
    if not state_rates:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported state: {req.state}. Available states: {', '.join(STAMP_DUTY_RATES.keys())}",
        )

    doc_rates = state_rates.get(req.document_type)
    if not doc_rates:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported document type for {req.state}: {req.document_type}. Available: {', '.join(state_rates.keys())}",
        )

    effective_rate = doc_rates["rate"]

    # Apply female concession if applicable
    female_concession = 0.0
    if req.is_female and doc_rates.get("female_concession", 0) > 0:
        female_concession = doc_rates["female_concession"]
        effective_rate -= female_concession

    # Calculate stamp duty
    stamp_duty = round(req.property_value * effective_rate / 100, 2)

    # Metro surcharge (e.g., Mumbai, Kolkata)
    metro_surcharge = round(req.property_value * doc_rates.get("metro_surcharge", 0) / 100, 2)

    # Registration fee
    registration_fee = round(req.property_value * doc_rates["registration"] / 100, 2)
    # Registration fee cap (Maharashtra caps at Rs 30,000 for most documents)
    if req.state == "Maharashtra":
        registration_fee = min(registration_fee, 30000)

    total = round(stamp_duty + metro_surcharge + registration_fee, 2)

    return {
        "data": {
            "state": req.state,
            "document_type": req.document_type,
            "property_value": req.property_value,
            "stamp_duty_rate": effective_rate,
            "stamp_duty_amount": stamp_duty,
            "metro_surcharge": metro_surcharge,
            "registration_fee": registration_fee,
            "female_concession_applied": req.is_female and female_concession > 0,
            "female_concession_percent": female_concession,
            "total_payable": total,
            "breakdown": {
                "stamp_duty": stamp_duty,
                "metro_surcharge": metro_surcharge,
                "registration_fee": registration_fee,
            },
            "notes": f"Stamp duty rate: {effective_rate}% of {req.property_value:,.2f}. Registration fee: {doc_rates['registration']}%.",
        }
    }


@router.post("/court-fees")
async def calculate_court_fees(req: CourtFeesRequest):
    """Calculate court fees for legal proceedings."""
    court = COURT_FEE_SCHEDULE.get(req.court_type)
    if not court:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported court type. Available: {', '.join(COURT_FEE_SCHEDULE.keys())}",
        )

    case = court.get(req.case_type)
    if not case:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported case type for {req.court_type}. Available: {', '.join(court.keys())}",
        )

    fee = 0.0
    fee_type = case["type"]

    if fee_type == "fixed":
        fee = case["amount"]
    elif fee_type == "ad_valorem":
        if req.claim_amount <= 0:
            raise HTTPException(status_code=400, detail="Claim amount is required for ad-valorem fee calculation")
        fee = round(req.claim_amount * case["rate"] / 100, 2)
        fee = max(fee, case.get("minimum", 0))
        fee = min(fee, case.get("maximum", float("inf")))
    elif fee_type == "slab":
        for slab in case["slabs"]:
            if req.claim_amount <= slab["upto"]:
                fee = slab["fee"]
                break
        else:
            fee = case["slabs"][-1]["fee"]

    return {
        "data": {
            "court_type": req.court_type,
            "case_type": req.case_type,
            "claim_amount": req.claim_amount,
            "fee_type": fee_type,
            "court_fee": fee,
            "notes": f"Court fee calculated for {req.case_type} in {req.court_type}. Fees are subject to revision by respective state/court rules.",
        }
    }


@router.post("/gst")
async def calculate_gst(req: GSTRequest):
    """Calculate GST breakdown with CGST, SGST, and IGST components."""
    valid_rates = [5, 12, 18, 28]
    if req.rate not in valid_rates:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid GST rate. Must be one of: {valid_rates}",
        )

    total_gst = round(req.amount * req.rate / 100, 2)

    if req.is_igst:
        breakdown = {
            "igst_rate": req.rate,
            "igst_amount": total_gst,
            "cgst_rate": 0,
            "cgst_amount": 0,
            "sgst_rate": 0,
            "sgst_amount": 0,
        }
    else:
        half_rate = req.rate / 2
        half_amount = round(total_gst / 2, 2)
        breakdown = {
            "igst_rate": 0,
            "igst_amount": 0,
            "cgst_rate": half_rate,
            "cgst_amount": half_amount,
            "sgst_rate": half_rate,
            "sgst_amount": half_amount,
        }

    total_with_gst = round(req.amount + total_gst, 2)

    return {
        "data": {
            "base_amount": req.amount,
            "gst_rate": req.rate,
            "gst_amount": total_gst,
            "total_amount": total_with_gst,
            "is_igst": req.is_igst,
            "breakdown": breakdown,
            "notes": f"{'IGST' if req.is_igst else 'CGST + SGST'} @ {req.rate}% on {req.amount:,.2f}",
        }
    }


@router.post("/tds")
async def calculate_tds(req: TDSRequest):
    """Calculate TDS deduction under the specified section."""
    section = TDS_RATES.get(req.section)
    if not section:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported TDS section. Available: {', '.join(TDS_RATES.keys())}",
        )

    # Determine applicable rate
    if not req.has_pan:
        rate = section["rate_no_pan"]
    elif req.section == "194C":
        # Default to individual rate; use rate_others for non-individual
        rate = section["rate_individual"]
    elif req.section == "194I":
        # Default to land/building rate
        rate = section["rate_land_building"]
    elif req.section == "194J":
        # Default to professional rate
        rate = section["rate_professional"]
    else:
        rate = section["rate"]

    tds_amount = round(req.amount * rate / 100, 2)

    # Health & education cess (4% on TDS — technically this is on the payee's total tax,
    # but we show it for awareness)
    cess = round(tds_amount * 4 / 100, 2)

    return {
        "data": {
            "section": req.section,
            "section_description": section["description"],
            "payment_amount": req.amount,
            "has_pan": req.has_pan,
            "tds_rate": rate,
            "tds_amount": tds_amount,
            "cess_rate": 4.0,
            "cess_amount": cess,
            "total_tds_with_cess": round(tds_amount + cess, 2),
            "net_payment": round(req.amount - tds_amount, 2),
            "notes": section["notes"],
        }
    }


@router.post("/gratuity")
async def calculate_gratuity(req: GratuityRequest):
    """
    Calculate gratuity under the Payment of Gratuity Act, 1972.
    Formula: Gratuity = (15 x Last Drawn Salary x Years of Service) / 26
    For employees not covered under the Act: (15 x Last Drawn Salary x Years of Service) / 30
    Maximum gratuity: Rs 20,00,000
    """
    if req.years_of_service < 5:
        eligible = False
        gratuity_amount = 0.0
        notes = "Minimum 5 years of continuous service required for gratuity eligibility under the Payment of Gratuity Act, 1972. Exceptions: death or disablement."
    else:
        eligible = True
        # Standard formula: (15 * last_salary * years) / 26
        gratuity_amount = round((15 * req.last_drawn_salary * req.years_of_service) / 26, 2)
        notes = "Formula: (15 x Last Drawn Salary x Completed Years of Service) / 26. Last drawn salary = Basic + Dearness Allowance."

    # Maximum gratuity cap
    max_gratuity = 2000000  # Rs 20 lakh
    capped = gratuity_amount > max_gratuity
    if capped:
        gratuity_amount = max_gratuity

    # Tax exemption under Section 10(10) — for private employees
    # Least of: (a) Actual gratuity, (b) Rs 20 lakh, (c) 15 days salary per year
    tax_exempt = min(gratuity_amount, max_gratuity)

    return {
        "data": {
            "last_drawn_salary": req.last_drawn_salary,
            "years_of_service": req.years_of_service,
            "eligible": eligible,
            "gratuity_amount": gratuity_amount,
            "capped_at_maximum": capped,
            "maximum_limit": max_gratuity,
            "tax_exempt_amount": tax_exempt if eligible else 0,
            "formula": "(15 x Last Drawn Salary x Years of Service) / 26",
            "notes": notes,
        }
    }


@router.post("/emi")
async def calculate_emi(req: EMIRequest):
    """
    Calculate EMI using the standard formula:
    EMI = P x R x (1+R)^N / ((1+R)^N - 1)
    Where P = Principal, R = Monthly interest rate, N = Number of months
    """
    monthly_rate = req.annual_rate / (12 * 100)

    if monthly_rate == 0:
        emi = round(req.principal / req.tenure_months, 2)
    else:
        emi = req.principal * monthly_rate * math.pow(1 + monthly_rate, req.tenure_months)
        emi = emi / (math.pow(1 + monthly_rate, req.tenure_months) - 1)
        emi = round(emi, 2)

    total_payment = round(emi * req.tenure_months, 2)
    total_interest = round(total_payment - req.principal, 2)

    # Generate first 12 months of amortization schedule (or full if less)
    schedule_months = min(req.tenure_months, 12)
    amortization = []
    balance = req.principal
    for month in range(1, schedule_months + 1):
        interest_component = round(balance * monthly_rate, 2)
        principal_component = round(emi - interest_component, 2)
        balance = round(balance - principal_component, 2)
        if balance < 0:
            balance = 0
        amortization.append({
            "month": month,
            "emi": emi,
            "principal": principal_component,
            "interest": interest_component,
            "balance": balance,
        })

    return {
        "data": {
            "principal": req.principal,
            "annual_rate": req.annual_rate,
            "tenure_months": req.tenure_months,
            "monthly_emi": emi,
            "total_payment": total_payment,
            "total_interest": total_interest,
            "interest_to_principal_ratio": round(total_interest / req.principal * 100, 2),
            "amortization_schedule": amortization,
            "notes": f"EMI of {emi:,.2f}/month for {req.tenure_months} months at {req.annual_rate}% p.a.",
        }
    }
