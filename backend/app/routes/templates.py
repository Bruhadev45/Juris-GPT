"""
Legal Document Templates — AI-powered document generation using GPT-4o.
Generates complete legal documents from template fields.
"""

import json
import os
from pathlib import Path
from fastapi import APIRouter, HTTPException
from typing import Optional, List, Dict, Any
from app.services.ai_analyzer import generate_template_document

router = APIRouter()

# Load templates from JSON file
def load_templates() -> List[Dict[str, Any]]:
    """Load templates from the JSON data file."""
    # Try multiple possible paths for the templates file
    possible_paths = [
        Path(__file__).parent.parent.parent / "data" / "datasets" / "samples" / "templates.json",
        Path("/Users/bruuu/Desktop/Juris-GPT/Juris-GPT/backend/data/datasets/samples/templates.json"),
        Path(os.getcwd()) / "data" / "datasets" / "samples" / "templates.json",
    ]

    for path in possible_paths:
        if path.exists():
            with open(path, "r", encoding="utf-8") as f:
                templates = json.load(f)
                # Convert JSON boolean values and ensure proper Python types
                for template in templates:
                    for field in template.get("fields", []):
                        if "required" in field:
                            field["required"] = bool(field["required"])
                        if "default" in field and isinstance(field["default"], str):
                            if field["default"].lower() == "true":
                                field["default"] = True
                            elif field["default"].lower() == "false":
                                field["default"] = False
                return templates

    # Fallback to minimal inline templates if file not found
    print("WARNING: templates.json not found, using fallback templates")
    return [
        {
            "id": "nda",
            "name": "Non-Disclosure Agreement (NDA)",
            "description": "Protect confidential information shared between parties",
            "category": "Startup",
            "estimated_time": "5 minutes",
            "field_count": 6,
            "price": 999,
            "fields": [
                {"name": "disclosing_party", "label": "Disclosing Party Name", "type": "text", "required": True},
                {"name": "receiving_party", "label": "Receiving Party Name", "type": "text", "required": True},
                {"name": "purpose", "label": "Purpose of Disclosure", "type": "textarea", "required": True},
                {"name": "duration_months", "label": "Duration (months)", "type": "number", "required": True, "default": 24},
                {"name": "jurisdiction", "label": "Governing Law (State)", "type": "select", "required": True, "options": ["Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "Other"]},
                {"name": "mutual", "label": "Mutual NDA?", "type": "boolean", "required": False, "default": False},
            ],
        }
    ]


# Load templates on module initialization
TEMPLATES = load_templates()


@router.get("/api/templates")
async def list_templates(category: Optional[str] = None, search: Optional[str] = None):
    """List all available document templates with optional filtering."""
    filtered_templates = TEMPLATES

    # Filter by category if provided
    if category:
        filtered_templates = [t for t in filtered_templates if t["category"].lower() == category.lower()]

    # Filter by search term if provided
    if search:
        search_lower = search.lower()
        filtered_templates = [
            t for t in filtered_templates
            if search_lower in t["name"].lower()
            or search_lower in t["description"].lower()
            or search_lower in t["category"].lower()
        ]

    return {
        "templates": [
            {
                "id": t["id"],
                "name": t["name"],
                "description": t["description"],
                "category": t["category"],
                "estimated_time": t["estimated_time"],
                "price": t.get("price", 999),
                "field_count": t.get("field_count", len(t["fields"])),
                "law_reference": t.get("law_reference", ""),
            }
            for t in filtered_templates
        ],
        "total": len(filtered_templates),
        "categories": list(set(t["category"] for t in TEMPLATES)),
    }


@router.get("/api/templates/categories")
async def get_categories():
    """Get all available template categories with counts."""
    categories = {}
    for t in TEMPLATES:
        cat = t["category"]
        if cat not in categories:
            categories[cat] = {"name": cat, "count": 0, "templates": []}
        categories[cat]["count"] += 1
        categories[cat]["templates"].append(t["id"])

    return {
        "categories": list(categories.values()),
        "total_templates": len(TEMPLATES),
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
    """Generate a complete legal document from a template using AI."""
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

    # Generate document using AI
    result = generate_template_document(
        template_name=template["name"],
        template_id=template["id"],
        fields=data,
        field_schema=template["fields"],
    )

    if result["success"]:
        return {
            "success": True,
            "message": f"{template['name']} generated successfully",
            "template_id": template_id,
            "data": data,
            "status": "completed",
            "document_content": result["document_content"],
        }
    else:
        return {
            "success": False,
            "message": f"Document generation failed: {result.get('error', 'Unknown error')}",
            "template_id": template_id,
            "data": data,
            "status": "failed",
        }
