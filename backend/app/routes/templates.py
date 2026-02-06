from fastapi import APIRouter, HTTPException
from typing import Optional
import json

router = APIRouter()

TEMPLATES = [
    {
        "id": "nda",
        "name": "Non-Disclosure Agreement (NDA)",
        "description": "Protect confidential information shared between parties",
        "category": "Contracts",
        "estimated_time": "5 minutes",
        "price": 999,
        "fields": [
            {"name": "disclosing_party", "label": "Disclosing Party Name", "type": "text", "required": True},
            {"name": "receiving_party", "label": "Receiving Party Name", "type": "text", "required": True},
            {"name": "purpose", "label": "Purpose of Disclosure", "type": "textarea", "required": True},
            {"name": "duration_months", "label": "Duration (months)", "type": "number", "required": True, "default": 24},
            {"name": "jurisdiction", "label": "Governing Law (State)", "type": "select", "required": True, "options": ["Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "Telangana", "Gujarat", "Rajasthan", "Uttar Pradesh", "West Bengal", "Other"]},
            {"name": "mutual", "label": "Mutual NDA?", "type": "boolean", "required": False, "default": False},
        ],
    },
    {
        "id": "employment",
        "name": "Employment Contract",
        "description": "Standard employment agreement compliant with Indian labor laws",
        "category": "Employment",
        "estimated_time": "10 minutes",
        "price": 1499,
        "fields": [
            {"name": "employer_name", "label": "Employer / Company Name", "type": "text", "required": True},
            {"name": "employee_name", "label": "Employee Name", "type": "text", "required": True},
            {"name": "designation", "label": "Designation / Role", "type": "text", "required": True},
            {"name": "department", "label": "Department", "type": "text", "required": False},
            {"name": "salary_monthly", "label": "Monthly Salary (INR)", "type": "number", "required": True},
            {"name": "joining_date", "label": "Joining Date", "type": "date", "required": True},
            {"name": "probation_months", "label": "Probation Period (months)", "type": "number", "required": True, "default": 6},
            {"name": "notice_period_months", "label": "Notice Period (months)", "type": "number", "required": True, "default": 2},
            {"name": "work_location", "label": "Work Location", "type": "text", "required": True},
            {"name": "non_compete", "label": "Include Non-Compete Clause?", "type": "boolean", "required": False, "default": False},
        ],
    },
    {
        "id": "msa",
        "name": "Master Service Agreement (MSA)",
        "description": "Framework agreement for ongoing service relationships",
        "category": "Contracts",
        "estimated_time": "10 minutes",
        "price": 1999,
        "fields": [
            {"name": "service_provider", "label": "Service Provider Name", "type": "text", "required": True},
            {"name": "client_name", "label": "Client Name", "type": "text", "required": True},
            {"name": "services_description", "label": "Description of Services", "type": "textarea", "required": True},
            {"name": "payment_terms", "label": "Payment Terms", "type": "select", "required": True, "options": ["Net 15", "Net 30", "Net 45", "Net 60", "Milestone-based"]},
            {"name": "contract_value", "label": "Estimated Contract Value (INR)", "type": "number", "required": False},
            {"name": "duration_months", "label": "Contract Duration (months)", "type": "number", "required": True, "default": 12},
            {"name": "auto_renewal", "label": "Auto-Renewal?", "type": "boolean", "required": False, "default": True},
            {"name": "jurisdiction", "label": "Governing Law (State)", "type": "select", "required": True, "options": ["Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "Telangana", "Gujarat", "Rajasthan", "Uttar Pradesh", "West Bengal", "Other"]},
        ],
    },
    {
        "id": "freelancer",
        "name": "Freelancer Agreement",
        "description": "Independent contractor agreement with IP assignment and payment terms",
        "category": "Employment",
        "estimated_time": "8 minutes",
        "price": 999,
        "fields": [
            {"name": "company_name", "label": "Company Name", "type": "text", "required": True},
            {"name": "freelancer_name", "label": "Freelancer Name", "type": "text", "required": True},
            {"name": "scope_of_work", "label": "Scope of Work", "type": "textarea", "required": True},
            {"name": "deliverables", "label": "Deliverables", "type": "textarea", "required": True},
            {"name": "total_fee", "label": "Total Fee (INR)", "type": "number", "required": True},
            {"name": "payment_schedule", "label": "Payment Schedule", "type": "select", "required": True, "options": ["Upfront", "Milestone-based", "On Completion", "Weekly", "Monthly"]},
            {"name": "deadline", "label": "Project Deadline", "type": "date", "required": True},
            {"name": "ip_assignment", "label": "IP Assignment to Company?", "type": "boolean", "required": True, "default": True},
        ],
    },
    {
        "id": "mou",
        "name": "Memorandum of Understanding (MoU)",
        "description": "Non-binding agreement outlining terms between parties",
        "category": "Contracts",
        "estimated_time": "7 minutes",
        "price": 799,
        "fields": [
            {"name": "party_one", "label": "Party One Name", "type": "text", "required": True},
            {"name": "party_two", "label": "Party Two Name", "type": "text", "required": True},
            {"name": "purpose", "label": "Purpose of MoU", "type": "textarea", "required": True},
            {"name": "terms", "label": "Key Terms", "type": "textarea", "required": True},
            {"name": "duration_months", "label": "Duration (months)", "type": "number", "required": True, "default": 12},
            {"name": "binding", "label": "Legally Binding?", "type": "boolean", "required": False, "default": False},
        ],
    },
    {
        "id": "rental",
        "name": "Rental / Lease Agreement",
        "description": "Residential or commercial rental agreement under Indian Transfer of Property Act",
        "category": "Property",
        "estimated_time": "10 minutes",
        "price": 1499,
        "fields": [
            {"name": "landlord_name", "label": "Landlord Name", "type": "text", "required": True},
            {"name": "tenant_name", "label": "Tenant Name", "type": "text", "required": True},
            {"name": "property_address", "label": "Property Address", "type": "textarea", "required": True},
            {"name": "property_type", "label": "Property Type", "type": "select", "required": True, "options": ["Residential", "Commercial", "Industrial"]},
            {"name": "monthly_rent", "label": "Monthly Rent (INR)", "type": "number", "required": True},
            {"name": "security_deposit", "label": "Security Deposit (INR)", "type": "number", "required": True},
            {"name": "lease_duration_months", "label": "Lease Duration (months)", "type": "number", "required": True, "default": 11},
            {"name": "start_date", "label": "Lease Start Date", "type": "date", "required": True},
            {"name": "state", "label": "State", "type": "select", "required": True, "options": ["Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "Telangana", "Gujarat", "Rajasthan", "Uttar Pradesh", "West Bengal", "Other"]},
        ],
    },
    {
        "id": "poa",
        "name": "Power of Attorney",
        "description": "Authorize someone to act on your behalf in legal or financial matters",
        "category": "Legal",
        "estimated_time": "8 minutes",
        "price": 1299,
        "fields": [
            {"name": "principal_name", "label": "Principal (Grantor) Name", "type": "text", "required": True},
            {"name": "agent_name", "label": "Agent (Attorney) Name", "type": "text", "required": True},
            {"name": "powers_granted", "label": "Powers Granted", "type": "textarea", "required": True, "placeholder": "Describe the specific powers being granted"},
            {"name": "poa_type", "label": "Type of PoA", "type": "select", "required": True, "options": ["General", "Special / Specific", "Durable"]},
            {"name": "duration", "label": "Duration", "type": "select", "required": True, "options": ["Until Revoked", "6 Months", "1 Year", "2 Years", "5 Years"]},
            {"name": "purpose", "label": "Purpose", "type": "textarea", "required": True},
        ],
    },
]


@router.get("/api/templates")
async def list_templates():
    """List all available document templates."""
    return {
        "templates": [
            {
                "id": t["id"],
                "name": t["name"],
                "description": t["description"],
                "category": t["category"],
                "estimated_time": t["estimated_time"],
                "price": t["price"],
                "field_count": len(t["fields"]),
            }
            for t in TEMPLATES
        ]
    }


@router.get("/api/templates/{template_id}")
async def get_template(template_id: str):
    """Get a specific template with its field schema."""
    template = next((t for t in TEMPLATES if t["id"] == template_id), None)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


@router.post("/api/templates/{template_id}/generate")
async def generate_from_template(template_id: str, data: dict):
    """Generate a document from a template. Returns placeholder for now - will integrate with AI generator."""
    template = next((t for t in TEMPLATES if t["id"] == template_id), None)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    # Validate required fields
    for field in template["fields"]:
        if field["required"] and field["name"] not in data:
            raise HTTPException(
                status_code=400,
                detail=f"Required field missing: {field['label']}",
            )

    # For now, return a confirmation. Will integrate with AI generator later.
    return {
        "success": True,
        "message": f"{template['name']} generation started",
        "template_id": template_id,
        "data": data,
        "status": "generating",
    }
