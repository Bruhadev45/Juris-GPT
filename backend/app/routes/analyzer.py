from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional
import json
import uuid
import hashlib
import random
from datetime import datetime
from pathlib import Path

router = APIRouter()

DATA_DIR = Path(__file__).parent.parent.parent.parent / "data"
ANALYZER_FILE = DATA_DIR / "analyzer_results.json"

CLAUSE_TYPES = [
    "indemnity",
    "termination",
    "non_compete",
    "intellectual_property",
    "force_majeure",
    "confidentiality",
    "limitation_of_liability",
    "governing_law",
]

CLAUSE_DISPLAY_NAMES = {
    "indemnity": "Indemnity",
    "termination": "Termination",
    "non_compete": "Non-Compete",
    "intellectual_property": "Intellectual Property",
    "force_majeure": "Force Majeure",
    "confidentiality": "Confidentiality",
    "limitation_of_liability": "Limitation of Liability",
    "governing_law": "Governing Law",
}


def _ensure_file():
    ANALYZER_FILE.parent.mkdir(parents=True, exist_ok=True)
    if not ANALYZER_FILE.exists():
        with open(ANALYZER_FILE, "w") as f:
            json.dump([], f)


def _load_results() -> list:
    _ensure_file()
    with open(ANALYZER_FILE, "r") as f:
        return json.load(f)


def _save_results(results: list):
    _ensure_file()
    with open(ANALYZER_FILE, "w") as f:
        json.dump(results, f, indent=2, default=str)


def _generate_seed(file_name: str) -> int:
    """Generate a deterministic seed from the file name for consistent mock results."""
    return int(hashlib.md5(file_name.encode()).hexdigest()[:8], 16)


def _generate_mock_analysis(file_name: str, file_size: int) -> dict:
    """Generate realistic mock clause-by-clause analysis based on file name."""
    seed = _generate_seed(file_name)
    rng = random.Random(seed)

    lower_name = file_name.lower()

    # Determine contract type heuristic
    is_employment = any(w in lower_name for w in ["employ", "offer", "appointment", "hr"])
    is_nda = any(w in lower_name for w in ["nda", "confidential", "non-disclosure"])
    is_service = any(w in lower_name for w in ["service", "sla", "msa", "consulting"])
    is_sale = any(w in lower_name for w in ["sale", "purchase", "buy"])
    is_lease = any(w in lower_name for w in ["lease", "rent", "tenancy"])
    is_partnership = any(w in lower_name for w in ["partner", "shareholder", "jv", "joint"])

    clause_templates = {
        "indemnity": {
            "found": rng.random() > 0.15,
            "text_samples": [
                "The Service Provider shall indemnify and hold harmless the Client against all claims, damages, losses arising from breach of this Agreement.",
                "Each party shall indemnify the other against third-party claims arising from negligence or wilful misconduct.",
                "The Vendor agrees to indemnify the Purchaser against any defects in title.",
            ],
            "risk_factors": [
                "Unlimited indemnity exposure",
                "One-sided indemnification clause",
                "No cap on indemnity amount",
                "Missing mutual indemnity provisions",
                "No notice requirement for indemnity claims",
            ],
            "suggestions": [
                "Consider adding a cap on indemnity liability equal to the contract value",
                "Include mutual indemnification obligations",
                "Add a time limit for bringing indemnity claims (e.g., 12 months from discovery)",
                "Require prompt written notice of any indemnity claim",
            ],
        },
        "termination": {
            "found": rng.random() > 0.05,
            "text_samples": [
                "Either party may terminate this Agreement by providing 30 days written notice to the other party.",
                "This Agreement may be terminated immediately upon material breach that remains uncured for 15 days after notice.",
                "The Company may terminate employment at any time with 3 months notice or salary in lieu thereof.",
            ],
            "risk_factors": [
                "No cure period for breach",
                "Termination for convenience favours one party",
                "No surviving obligations clause",
                "Missing termination-for-cause provisions",
                "Inadequate notice period",
            ],
            "suggestions": [
                "Add a minimum 30-day cure period for non-material breaches",
                "Ensure termination for convenience is mutual",
                "Specify which clauses survive termination (confidentiality, IP, indemnity)",
                "Include provisions for return of confidential information upon termination",
            ],
        },
        "non_compete": {
            "found": is_employment or is_partnership or rng.random() > 0.5,
            "text_samples": [
                "The Employee shall not engage in any competing business within India for a period of 2 years after termination.",
                "During the term and for 1 year thereafter, neither party shall solicit employees of the other party.",
                "The Partner agrees not to carry on a similar business within 50 km radius for 3 years post-exit.",
            ],
            "risk_factors": [
                "Non-compete may be unenforceable under Section 27 of Indian Contract Act",
                "Geographical scope too broad",
                "Duration exceeds reasonable limits",
                "No consideration provided for non-compete",
                "Restriction applies post-termination without compensation",
            ],
            "suggestions": [
                "Note: Post-employment non-compete clauses are generally unenforceable in India under Section 27 of the Indian Contract Act, 1872",
                "Consider replacing with narrower non-solicitation clause",
                "Limit scope to specific clients or projects rather than entire industry",
                "Include garden leave provisions if non-compete is critical",
            ],
        },
        "intellectual_property": {
            "found": is_service or is_employment or rng.random() > 0.3,
            "text_samples": [
                "All intellectual property created during the course of this engagement shall vest exclusively with the Client.",
                "The Company shall own all work product, inventions, and developments created by the Employee during employment.",
                "Pre-existing IP of each party shall remain with the respective party.",
            ],
            "risk_factors": [
                "No distinction between foreground and background IP",
                "Missing IP assignment clause",
                "No license-back provisions for contributed IP",
                "Unclear ownership of derivative works",
                "No moral rights waiver",
            ],
            "suggestions": [
                "Clearly distinguish between pre-existing IP and newly created IP",
                "Include IP assignment deed as a schedule to the agreement",
                "Add license-back provisions for any pre-existing IP contributed",
                "Specify ownership of all work product including source code, documentation, and designs",
            ],
        },
        "force_majeure": {
            "found": rng.random() > 0.25,
            "text_samples": [
                "Neither party shall be liable for failure to perform due to events beyond reasonable control including acts of God, war, pandemic, government action.",
                "Force Majeure events include but are not limited to natural disasters, epidemics, strikes, and regulatory changes.",
                "If Force Majeure continues for more than 90 days, either party may terminate this Agreement.",
            ],
            "risk_factors": [
                "Force majeure clause too narrow",
                "No pandemic/epidemic coverage",
                "Missing government action as force majeure event",
                "No termination right for prolonged force majeure",
                "No obligation to mitigate during force majeure",
            ],
            "suggestions": [
                "Expand force majeure to include pandemics, cyber attacks, and supply chain disruptions",
                "Add obligation to provide notice within 7 days of force majeure event",
                "Include termination right if force majeure exceeds 90 days",
                "Add duty to mitigate and explore alternatives during force majeure",
            ],
        },
        "confidentiality": {
            "found": is_nda or rng.random() > 0.1,
            "text_samples": [
                "Each party shall maintain the confidentiality of all Confidential Information received from the other party for a period of 5 years.",
                "Confidential Information means all information disclosed in writing marked as 'Confidential' or orally confirmed in writing within 10 days.",
                "The receiving party shall use the same degree of care as it uses for its own confidential information, but no less than reasonable care.",
            ],
            "risk_factors": [
                "Confidentiality period too short",
                "No definition of Confidential Information",
                "Missing permitted disclosures (legal/regulatory requirements)",
                "No return/destruction obligation",
                "One-sided confidentiality obligation",
            ],
            "suggestions": [
                "Extend confidentiality period to at least 3 years post-termination",
                "Define Confidential Information broadly with specific exclusions",
                "Include carve-out for disclosures required by law or court order",
                "Add obligation to return or destroy confidential information on termination",
            ],
        },
        "limitation_of_liability": {
            "found": rng.random() > 0.2,
            "text_samples": [
                "In no event shall either party's total liability exceed the amounts paid under this Agreement in the preceding 12 months.",
                "Neither party shall be liable for indirect, incidental, consequential, or punitive damages.",
                "The aggregate liability of the Service Provider shall not exceed the total fees paid by the Client under this Agreement.",
            ],
            "risk_factors": [
                "No liability cap specified",
                "Liability cap too low relative to potential damages",
                "Excludes all consequential damages without carve-outs",
                "No carve-out for IP infringement or data breach",
                "Limitation applies to intentional misconduct",
            ],
            "suggestions": [
                "Set liability cap at a reasonable multiple of annual contract value",
                "Carve out IP infringement, data breach, and confidentiality breach from the cap",
                "Ensure limitation does not apply to wilful misconduct or fraud",
                "Include specific sub-limits for different types of claims",
            ],
        },
        "governing_law": {
            "found": rng.random() > 0.1,
            "text_samples": [
                "This Agreement shall be governed by and construed in accordance with the laws of India. Courts in Mumbai shall have exclusive jurisdiction.",
                "Any disputes shall be resolved through arbitration under the Arbitration and Conciliation Act, 1996, seated in New Delhi.",
                "The parties agree to submit to the exclusive jurisdiction of the courts of Bengaluru, Karnataka.",
            ],
            "risk_factors": [
                "No governing law specified",
                "Foreign governing law may be disadvantageous",
                "No dispute resolution mechanism",
                "Missing arbitration clause",
                "Jurisdiction clause may be inconvenient",
            ],
            "suggestions": [
                "Specify Indian law as governing law for domestic contracts",
                "Include arbitration clause referencing the Arbitration and Conciliation Act, 1996",
                "Specify seat and venue of arbitration",
                "Consider including mediation as a first step before arbitration",
            ],
        },
    }

    clauses = []
    total_risk = 0
    clause_count = 0

    for clause_key in CLAUSE_TYPES:
        template = clause_templates[clause_key]
        found = template["found"]

        if found:
            risk_score = rng.randint(20, 85)
            num_risks = rng.randint(1, 3)
            num_suggestions = rng.randint(1, 3)

            clause_data = {
                "clause_type": clause_key,
                "display_name": CLAUSE_DISPLAY_NAMES[clause_key],
                "found": True,
                "extracted_text": rng.choice(template["text_samples"]),
                "risk_score": risk_score,
                "risk_level": "high" if risk_score >= 70 else "medium" if risk_score >= 40 else "low",
                "risk_factors": rng.sample(template["risk_factors"], min(num_risks, len(template["risk_factors"]))),
                "suggestions": rng.sample(template["suggestions"], min(num_suggestions, len(template["suggestions"]))),
            }
            total_risk += risk_score
            clause_count += 1
        else:
            clause_data = {
                "clause_type": clause_key,
                "display_name": CLAUSE_DISPLAY_NAMES[clause_key],
                "found": False,
                "extracted_text": None,
                "risk_score": 75,
                "risk_level": "high",
                "risk_factors": [f"No {CLAUSE_DISPLAY_NAMES[clause_key]} clause found in the document"],
                "suggestions": [f"Consider adding a {CLAUSE_DISPLAY_NAMES[clause_key]} clause to protect both parties"],
            }
            total_risk += 75
            clause_count += 1

    overall_risk = round(total_risk / clause_count) if clause_count > 0 else 50

    # Overall summary
    if overall_risk >= 70:
        summary = "This contract has significant risk areas that require immediate attention. Several critical clauses are either missing or contain provisions that could expose your interests."
    elif overall_risk >= 40:
        summary = "This contract has moderate risk levels. While key provisions are present, some clauses need strengthening to provide better protection."
    else:
        summary = "This contract is well-drafted with low overall risk. Minor improvements are suggested for enhanced protection."

    return {
        "clauses": clauses if clauses else [clause_data for clause_key in CLAUSE_TYPES for clause_data in [clause_data]],
        "overall_risk_score": overall_risk,
        "overall_risk_level": "high" if overall_risk >= 70 else "medium" if overall_risk >= 40 else "low",
        "summary": summary,
        "total_clauses_found": sum(1 for c in clauses if c.get("found", False)) if clauses else clause_count,
        "total_clauses_analyzed": len(CLAUSE_TYPES),
    }


def _generate_mock_analysis_proper(file_name: str, file_size: int) -> dict:
    """Generate realistic mock clause-by-clause analysis based on file name."""
    seed = _generate_seed(file_name)
    rng = random.Random(seed)

    lower_name = file_name.lower()

    is_employment = any(w in lower_name for w in ["employ", "offer", "appointment", "hr"])
    is_nda = any(w in lower_name for w in ["nda", "confidential", "non-disclosure"])
    is_service = any(w in lower_name for w in ["service", "sla", "msa", "consulting"])

    clause_configs = {
        "indemnity": {
            "base_found_prob": 0.85,
            "text_samples": [
                "The Service Provider shall indemnify and hold harmless the Client against all claims, damages, losses arising from breach of this Agreement.",
                "Each party shall indemnify the other against third-party claims arising from negligence or wilful misconduct.",
            ],
            "risk_factors": [
                "Unlimited indemnity exposure",
                "One-sided indemnification clause",
                "No cap on indemnity amount",
                "Missing mutual indemnity provisions",
            ],
            "suggestions": [
                "Consider adding a cap on indemnity liability equal to the contract value",
                "Include mutual indemnification obligations",
                "Add a time limit for bringing indemnity claims",
            ],
        },
        "termination": {
            "base_found_prob": 0.95,
            "text_samples": [
                "Either party may terminate this Agreement by providing 30 days written notice.",
                "This Agreement may be terminated immediately upon material breach uncured for 15 days.",
            ],
            "risk_factors": [
                "No cure period for breach",
                "Termination for convenience favours one party",
                "No surviving obligations clause",
            ],
            "suggestions": [
                "Add a minimum 30-day cure period for non-material breaches",
                "Ensure termination for convenience is mutual",
                "Specify which clauses survive termination",
            ],
        },
        "non_compete": {
            "base_found_prob": 0.5 if not is_employment else 0.9,
            "text_samples": [
                "The Employee shall not engage in any competing business within India for 2 years after termination.",
                "Neither party shall solicit employees of the other party for 1 year post-termination.",
            ],
            "risk_factors": [
                "Non-compete may be unenforceable under Section 27 of Indian Contract Act",
                "Geographical scope too broad",
                "Duration exceeds reasonable limits",
            ],
            "suggestions": [
                "Post-employment non-compete clauses are generally unenforceable in India under Section 27",
                "Consider replacing with narrower non-solicitation clause",
                "Limit scope to specific clients or projects",
            ],
        },
        "intellectual_property": {
            "base_found_prob": 0.7 if not is_service else 0.95,
            "text_samples": [
                "All IP created during this engagement shall vest exclusively with the Client.",
                "Pre-existing IP of each party shall remain with the respective party.",
            ],
            "risk_factors": [
                "No distinction between foreground and background IP",
                "Missing IP assignment clause",
                "Unclear ownership of derivative works",
            ],
            "suggestions": [
                "Clearly distinguish between pre-existing and newly created IP",
                "Include IP assignment deed as a schedule",
                "Add license-back provisions for contributed IP",
            ],
        },
        "force_majeure": {
            "base_found_prob": 0.75,
            "text_samples": [
                "Neither party shall be liable for failure to perform due to events beyond reasonable control.",
                "Force Majeure includes natural disasters, epidemics, strikes, and regulatory changes.",
            ],
            "risk_factors": [
                "Force majeure clause too narrow",
                "No pandemic/epidemic coverage",
                "No termination right for prolonged force majeure",
            ],
            "suggestions": [
                "Expand to include pandemics, cyber attacks, and supply chain disruptions",
                "Include termination right if force majeure exceeds 90 days",
                "Add duty to mitigate during force majeure",
            ],
        },
        "confidentiality": {
            "base_found_prob": 0.9 if not is_nda else 1.0,
            "text_samples": [
                "Each party shall maintain confidentiality of all Confidential Information for 5 years.",
                "Confidential Information means all information disclosed in writing marked as Confidential.",
            ],
            "risk_factors": [
                "Confidentiality period too short",
                "No definition of Confidential Information",
                "Missing permitted disclosures",
            ],
            "suggestions": [
                "Extend confidentiality period to at least 3 years post-termination",
                "Define Confidential Information broadly with specific exclusions",
                "Add carve-out for legally required disclosures",
            ],
        },
        "limitation_of_liability": {
            "base_found_prob": 0.8,
            "text_samples": [
                "Total liability shall not exceed amounts paid in the preceding 12 months.",
                "Neither party shall be liable for indirect, incidental, or consequential damages.",
            ],
            "risk_factors": [
                "No liability cap specified",
                "Excludes all consequential damages without carve-outs",
                "No carve-out for IP infringement or data breach",
            ],
            "suggestions": [
                "Set liability cap at reasonable multiple of annual contract value",
                "Carve out IP infringement and data breach from the cap",
                "Ensure limitation does not apply to wilful misconduct",
            ],
        },
        "governing_law": {
            "base_found_prob": 0.9,
            "text_samples": [
                "This Agreement shall be governed by the laws of India. Courts in Mumbai shall have exclusive jurisdiction.",
                "Disputes shall be resolved through arbitration under the Arbitration and Conciliation Act, 1996.",
            ],
            "risk_factors": [
                "No governing law specified",
                "No dispute resolution mechanism",
                "Missing arbitration clause",
            ],
            "suggestions": [
                "Specify Indian law as governing law for domestic contracts",
                "Include arbitration clause referencing the Arbitration and Conciliation Act, 1996",
                "Consider mediation as a first step before arbitration",
            ],
        },
    }

    clauses = []
    total_risk = 0

    for clause_key in CLAUSE_TYPES:
        config = clause_configs[clause_key]
        found = rng.random() < config["base_found_prob"]

        if found:
            risk_score = rng.randint(15, 85)
            clause_data = {
                "clause_type": clause_key,
                "display_name": CLAUSE_DISPLAY_NAMES[clause_key],
                "found": True,
                "extracted_text": rng.choice(config["text_samples"]),
                "risk_score": risk_score,
                "risk_level": "high" if risk_score >= 70 else "medium" if risk_score >= 40 else "low",
                "risk_factors": rng.sample(config["risk_factors"], rng.randint(1, min(2, len(config["risk_factors"])))),
                "suggestions": rng.sample(config["suggestions"], rng.randint(1, min(2, len(config["suggestions"])))),
            }
            total_risk += risk_score
        else:
            clause_data = {
                "clause_type": clause_key,
                "display_name": CLAUSE_DISPLAY_NAMES[clause_key],
                "found": False,
                "extracted_text": None,
                "risk_score": 75,
                "risk_level": "high",
                "risk_factors": [f"No {CLAUSE_DISPLAY_NAMES[clause_key]} clause found in the document"],
                "suggestions": [f"Consider adding a {CLAUSE_DISPLAY_NAMES[clause_key]} clause to protect both parties"],
            }
            total_risk += 75

        clauses.append(clause_data)

    overall_risk = round(total_risk / len(CLAUSE_TYPES))

    if overall_risk >= 70:
        summary = "This contract has significant risk areas that require immediate attention. Several critical clauses are either missing or contain provisions that could expose your interests."
    elif overall_risk >= 40:
        summary = "This contract has moderate risk levels. While key provisions are present, some clauses need strengthening to provide better protection."
    else:
        summary = "This contract is well-drafted with low overall risk. Minor improvements are suggested for enhanced protection."

    return {
        "clauses": clauses,
        "overall_risk_score": overall_risk,
        "overall_risk_level": "high" if overall_risk >= 70 else "medium" if overall_risk >= 40 else "low",
        "summary": summary,
        "total_clauses_found": sum(1 for c in clauses if c["found"]),
        "total_clauses_analyzed": len(CLAUSE_TYPES),
    }


@router.post("/upload")
async def upload_contract(
    file: UploadFile = File(...),
    description: str = Form(""),
):
    """Upload a contract for analysis."""
    _ensure_file()

    doc_id = str(uuid.uuid4())
    content = await file.read()
    file_size = len(content)

    record = {
        "id": doc_id,
        "file_name": file.filename or "unknown",
        "file_size": file_size,
        "file_type": file.content_type or "application/octet-stream",
        "description": description,
        "uploaded_at": datetime.utcnow().isoformat(),
        "status": "uploaded",
        "analysis": None,
    }

    results = _load_results()
    results.append(record)
    _save_results(results)

    return {"data": record, "message": "Contract uploaded. Use POST /analyze to start analysis."}


@router.post("/{doc_id}/analyze")
async def analyze_contract(doc_id: str):
    """Run clause-by-clause analysis on an uploaded contract."""
    results = _load_results()
    record = next((r for r in results if r["id"] == doc_id), None)
    if not record:
        raise HTTPException(status_code=404, detail="Contract not found. Upload first.")

    analysis = _generate_mock_analysis_proper(record["file_name"], record["file_size"])

    record["status"] = "analyzed"
    record["analyzed_at"] = datetime.utcnow().isoformat()
    record["analysis"] = analysis

    _save_results(results)

    return {"data": record}


@router.get("/{doc_id}")
async def get_analysis(doc_id: str):
    """Get analysis results for a contract."""
    results = _load_results()
    record = next((r for r in results if r["id"] == doc_id), None)
    if not record:
        raise HTTPException(status_code=404, detail="Contract not found")
    return {"data": record}
