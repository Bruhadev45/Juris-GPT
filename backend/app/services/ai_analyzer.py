"""
AI-powered contract analysis and document review service.
Uses OpenAI GPT-4o for real clause-by-clause analysis of legal documents.
"""

import json
import io
from typing import Dict, List, Optional
from pathlib import Path
from openai import OpenAI
from app.config import settings

client = OpenAI(api_key=settings.openai_api_key)


def extract_text_from_file(file_path: str, file_content: Optional[bytes] = None) -> str:
    """Extract text from PDF, DOCX, DOC, or TXT files."""
    path = Path(file_path)
    ext = path.suffix.lower()

    if file_content is None and path.exists():
        with open(path, "rb") as f:
            file_content = f.read()

    if file_content is None:
        return ""

    if ext == ".txt":
        return file_content.decode("utf-8", errors="ignore")

    elif ext == ".docx":
        try:
            from docx import Document
            doc = Document(io.BytesIO(file_content))
            return "\n".join([para.text for para in doc.paragraphs if para.text.strip()])
        except Exception as e:
            return f"[Error extracting DOCX: {e}]"

    elif ext == ".pdf":
        try:
            from PyPDF2 import PdfReader
            reader = PdfReader(io.BytesIO(file_content))
            text_parts = []
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
            return "\n".join(text_parts)
        except Exception as e:
            return f"[Error extracting PDF: {e}]"

    elif ext == ".doc":
        return "[DOC format requires additional processing. Please convert to DOCX or PDF.]"

    return "[Unsupported file format]"


def analyze_contract_with_ai(document_text: str, file_name: str) -> dict:
    """
    Perform real AI clause-by-clause analysis of a contract using GPT-4o.
    Returns structured analysis matching the frontend's expected format.
    """
    # Truncate very long documents to fit context window
    max_chars = 25000
    truncated = document_text[:max_chars]
    if len(document_text) > max_chars:
        truncated += "\n\n[Document truncated for analysis — remaining text omitted]"

    system_prompt = """You are an expert Indian corporate lawyer and contract analyst. 
Analyze the provided contract clause by clause. You MUST return a valid JSON object (no markdown, no code fences).

Analyze these 8 key clause types:
1. Indemnity
2. Termination
3. Non-Compete
4. Intellectual Property
5. Force Majeure
6. Confidentiality
7. Limitation of Liability
8. Governing Law / Dispute Resolution

For each clause, determine:
- Whether it is present, missing, or risky (has concerning provisions)
- The risk level (Low, Medium, or High)
- A brief description of what was found or what's concerning
- Specific risk factors identified
- Actionable suggestions for improvement

Apply Indian law context: reference the Indian Contract Act 1872, Companies Act 2013, 
Arbitration and Conciliation Act 1996, IT Act 2000, and DPDPA 2023 where relevant.

Return ONLY this JSON structure:
{
  "overall_risk_score": <number 0-10>,
  "summary": "<2-3 sentence summary of the contract's overall risk posture>",
  "contract_type": "<detected type: employment/nda/service/partnership/lease/other>",
  "clauses": [
    {
      "name": "<clause name>",
      "status": "<Present|Missing|Risky>",
      "risk_level": "<Low|Medium|High>",
      "description": "<1-2 sentence description of findings>",
      "extracted_text": "<relevant excerpt from the document if found, or null>",
      "risk_factors": ["<risk factor 1>", "<risk factor 2>"],
      "suggestions": ["<suggestion 1>", "<suggestion 2>"]
    }
  ],
  "suggestions": [
    "<top-level actionable suggestion 1>",
    "<top-level actionable suggestion 2>",
    "<top-level actionable suggestion 3>",
    "<top-level actionable suggestion 4>"
  ],
  "risks": [
    {
      "title": "<risk title>",
      "severity": "<high|medium|low>",
      "description": "<description of the risk>"
    }
  ]
}"""

    user_prompt = f"""Analyze the following contract document:

FILE NAME: {file_name}

DOCUMENT TEXT:
---
{truncated}
---

Provide a thorough clause-by-clause analysis in the JSON format specified. 
Be specific about what you find in the actual document text — do not hallucinate clauses that aren't there.
If the document text is empty or unreadable, still return the JSON structure with all clauses marked as "Missing"."""

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
            max_tokens=4000,
            response_format={"type": "json_object"},
        )

        result_text = response.choices[0].message.content
        analysis = json.loads(result_text)

        # Ensure required fields exist with defaults
        analysis.setdefault("overall_risk_score", 5)
        analysis.setdefault("summary", "Analysis complete.")
        analysis.setdefault("contract_type", "other")
        analysis.setdefault("clauses", [])
        analysis.setdefault("suggestions", [])
        analysis.setdefault("risks", [])

        # Normalize clause data
        for clause in analysis["clauses"]:
            clause.setdefault("name", "Unknown")
            clause.setdefault("status", "Missing")
            clause.setdefault("risk_level", "Medium")
            clause.setdefault("description", "")
            clause.setdefault("extracted_text", None)
            clause.setdefault("risk_factors", [])
            clause.setdefault("suggestions", [])

        return analysis

    except json.JSONDecodeError:
        # If GPT returns non-JSON, return a structured error
        return _generate_error_analysis("AI response was not valid JSON. Please try again.")
    except Exception as e:
        return _generate_error_analysis(f"AI analysis failed: {str(e)}")


def review_document_with_ai(document_text: str, file_name: str) -> dict:
    """
    Perform AI review of a legal document.
    Returns structured review matching the review page's expected format.
    """
    max_chars = 25000
    truncated = document_text[:max_chars]
    if len(document_text) > max_chars:
        truncated += "\n\n[Document truncated for review]"

    system_prompt = """You are an expert Indian legal document reviewer. 
Review the provided document and identify key clauses, risks, and provide suggestions.
You MUST return a valid JSON object (no markdown, no code fences).

Return ONLY this JSON structure:
{
  "overall_risk_score": <number 0-100>,
  "summary": "<2-3 sentence summary of the document review>",
  "clauses": [
    {
      "name": "<clause name>",
      "status": "<present|missing>",
      "risk": "<high|medium|low>"
    }
  ],
  "risks": [
    {
      "title": "<risk title>",
      "severity": "<high|medium|low>",
      "description": "<detailed description>"
    }
  ],
  "suggestions": [
    "<actionable suggestion 1>",
    "<actionable suggestion 2>"
  ]
}

Analyze at least these clauses: Indemnity, Limitation of Liability, Termination, 
Force Majeure, Confidentiality, Dispute Resolution, Governing Law, IP Assignment, 
Non-Compete, Payment Terms, Data Protection.

Apply Indian legal context: Indian Contract Act 1872, Companies Act 2013, 
Arbitration and Conciliation Act 1996, DPDPA 2023."""

    user_prompt = f"""Review the following legal document:

FILE NAME: {file_name}

DOCUMENT TEXT:
---
{truncated}
---

Provide a thorough review focusing on identifying present/missing clauses, 
risk assessment, and actionable suggestions for improvement."""

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
            max_tokens=3000,
            response_format={"type": "json_object"},
        )

        result_text = response.choices[0].message.content
        analysis = json.loads(result_text)

        # Ensure required fields
        analysis.setdefault("overall_risk_score", 50)
        analysis.setdefault("summary", "Document reviewed.")
        analysis.setdefault("clauses", [])
        analysis.setdefault("risks", [])
        analysis.setdefault("suggestions", [])

        return analysis

    except Exception as e:
        # Return a structured fallback
        return {
            "overall_risk_score": 50,
            "summary": f"AI review encountered an error: {str(e)}. Showing default analysis.",
            "clauses": [
                {"name": "Indemnity", "status": "present", "risk": "medium"},
                {"name": "Limitation of Liability", "status": "present", "risk": "low"},
                {"name": "Termination", "status": "present", "risk": "low"},
                {"name": "Force Majeure", "status": "missing", "risk": "high"},
                {"name": "Confidentiality", "status": "present", "risk": "low"},
                {"name": "Dispute Resolution", "status": "present", "risk": "medium"},
                {"name": "Governing Law", "status": "present", "risk": "low"},
                {"name": "IP Assignment", "status": "missing", "risk": "high"},
            ],
            "risks": [
                {
                    "title": "AI Analysis Unavailable",
                    "severity": "medium",
                    "description": "Could not perform AI analysis. Please check OpenAI API key configuration.",
                }
            ],
            "suggestions": [
                "Configure a valid OpenAI API key for full AI-powered analysis",
                "Re-upload and try again if the issue persists",
            ],
        }


def generate_template_document(template_name: str, template_id: str, fields: dict, field_schema: list) -> dict:
    """
    Generate a complete legal document from a template using GPT-4o.
    Returns the generated document content in markdown format.
    """
    # Build field descriptions for prompt
    field_descriptions = []
    for key, value in fields.items():
        # Find the label from schema
        label = key
        for f in field_schema:
            if f["name"] == key:
                label = f["label"]
                break
        field_descriptions.append(f"- {label}: {value}")

    fields_text = "\n".join(field_descriptions)

    system_prompt = """You are an expert Indian corporate lawyer specializing in drafting legal documents.
Generate a complete, professional legal document based on the template type and provided details.
The document must:
1. Comply with relevant Indian laws (Companies Act 2013, Indian Contract Act 1872, etc.)
2. Use proper legal terminology and structure
3. Include all standard clauses for the document type
4. Be ready for lawyer review and client signature
5. Include proper recitals, definitions, operative clauses, and schedules
6. Use numbered sections and subsections
7. Be formatted in clean markdown

Return the complete document text in markdown format."""

    template_guidance = {
        "nda": "Generate a Non-Disclosure Agreement. Include: definition of confidential information, obligations of receiving party, permitted disclosures, term and termination, remedies, return of information, governing law.",
        "employment": "Generate an Employment Contract compliant with Indian labor laws. Include: appointment details, compensation, probation, duties, leave policy, confidentiality, IP assignment, termination, notice period, non-solicitation, governing law.",
        "msa": "Generate a Master Service Agreement. Include: scope of services, payment terms, SLAs, warranties, indemnification, limitation of liability, IP rights, confidentiality, termination, force majeure, governing law.",
        "freelancer": "Generate a Freelancer/Independent Contractor Agreement. Include: scope of work, deliverables, payment schedule, IP assignment, confidentiality, term, termination, relationship clarification (not employment), governing law.",
        "mou": "Generate a Memorandum of Understanding. Include: purpose, key terms, obligations of each party, duration, confidentiality, non-binding nature (if applicable), dispute resolution, governing law.",
        "rental": "Generate a Rental/Lease Agreement compliant with Indian Transfer of Property Act and relevant state Rent Control Act. Include: premises description, rent, security deposit, maintenance, restrictions, termination, lock-in period, governing law.",
        "poa": "Generate a Power of Attorney. Include: principal and agent details, powers granted, scope and limitations, duration, revocation terms, indemnity, governing law. Comply with Powers of Attorney Act, 1882.",
    }

    guidance = template_guidance.get(template_id, f"Generate a {template_name} document with all standard legal clauses.")

    user_prompt = f"""Generate the following legal document:

DOCUMENT TYPE: {template_name}
SPECIFIC GUIDANCE: {guidance}

PROVIDED DETAILS:
{fields_text}

Generate a complete, professional document in markdown format. Include:
- Title and date
- Parties section with complete details
- Recitals / Background
- All relevant operative clauses
- Schedules / Annexures if applicable
- Signature blocks for all parties
- Place for witnesses if required

Make it comprehensive and legally sound under Indian law."""

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
            max_tokens=6000,
        )

        document_content = response.choices[0].message.content

        return {
            "success": True,
            "document_content": document_content,
            "template_id": template_id,
            "template_name": template_name,
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "template_id": template_id,
            "template_name": template_name,
        }


def summarize_news_article(title: str, content: str) -> str:
    """Generate a concise AI summary of a legal news article."""
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": "You are a legal news analyst. Summarize the article in 2-3 concise sentences focusing on the legal implications for Indian businesses and startups.",
                },
                {
                    "role": "user",
                    "content": f"Title: {title}\n\nContent: {content[:3000]}",
                },
            ],
            temperature=0.3,
            max_tokens=200,
        )
        return response.choices[0].message.content
    except Exception:
        return ""


def assess_compliance_risk(deadline_title: str, category: str, days_remaining: int) -> dict:
    """Generate AI risk assessment for a compliance deadline."""
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": "You are an Indian compliance expert. Provide a brief risk assessment. Return JSON: {\"risk_note\": \"<1-2 sentence note>\", \"penalty_info\": \"<penalty details>\", \"action_items\": [\"<item1>\", \"<item2>\"]}",
                },
                {
                    "role": "user",
                    "content": f"Compliance: {deadline_title}\nCategory: {category}\nDays remaining: {days_remaining}",
                },
            ],
            temperature=0.2,
            max_tokens=300,
            response_format={"type": "json_object"},
        )
        return json.loads(response.choices[0].message.content)
    except Exception:
        return {"risk_note": "", "penalty_info": "", "action_items": []}


def _generate_error_analysis(error_msg: str) -> dict:
    """Generate a structured error analysis when AI fails."""
    clause_names = [
        "Indemnity", "Termination", "Non-Compete", "Intellectual Property",
        "Force Majeure", "Confidentiality", "Limitation of Liability", "Governing Law",
    ]
    return {
        "overall_risk_score": 5,
        "summary": f"Analysis could not be completed: {error_msg}",
        "contract_type": "unknown",
        "clauses": [
            {
                "name": name,
                "status": "Missing",
                "risk_level": "Medium",
                "description": "Could not analyze — AI service unavailable",
                "extracted_text": None,
                "risk_factors": ["AI analysis unavailable"],
                "suggestions": ["Retry analysis or check API configuration"],
            }
            for name in clause_names
        ],
        "suggestions": [
            "Ensure OpenAI API key is configured correctly",
            "Retry the analysis",
            "Check that the document is readable and contains text",
        ],
        "risks": [
            {
                "title": "Analysis Incomplete",
                "severity": "medium",
                "description": error_msg,
            }
        ],
    }
