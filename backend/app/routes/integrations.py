from fastapi import APIRouter
from app.config import settings
import httpx

router = APIRouter()


@router.get("")
async def check_integrations():
    """Check real connection status of configured services."""
    results = []

    # Supabase
    supabase_connected = False
    if settings.supabase_url and settings.supabase_service_key:
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{settings.supabase_url}/rest/v1/",
                    headers={"apikey": settings.supabase_service_key},
                    timeout=5.0,
                )
                supabase_connected = resp.status_code < 500
        except Exception:
            supabase_connected = False

    results.append({
        "id": "supabase",
        "name": "Supabase",
        "description": "Database & Storage for documents and user data",
        "category": "Storage",
        "status": "connected" if supabase_connected else "disconnected",
        "icon": "/integrations/supabase.svg",
    })

    # OpenAI
    openai_connected = bool(settings.openai_api_key)
    results.append({
        "id": "openai",
        "name": "OpenAI",
        "description": "AI-powered document generation and legal research",
        "category": "AI Services",
        "status": "connected" if openai_connected else "disconnected",
        "icon": "/integrations/openai.svg",
    })

    # Resend
    resend_connected = bool(settings.resend_api_key)
    results.append({
        "id": "resend",
        "name": "Resend",
        "description": "Email notifications for compliance alerts",
        "category": "Communication",
        "status": "connected" if resend_connected else "disconnected",
        "icon": "/integrations/resend.svg",
    })

    # Google Drive
    results.append({
        "id": "google-drive",
        "name": "Google Drive",
        "description": "Cloud document storage and backup",
        "category": "Storage",
        "status": "disconnected",
        "icon": "/integrations/google.svg",
    })

    # DigiLocker
    results.append({
        "id": "digilocker",
        "name": "DigiLocker",
        "description": "Government document verification service",
        "category": "Government",
        "status": "disconnected",
        "icon": "/integrations/digilocker.svg",
    })

    # MCA Portal
    results.append({
        "id": "mca",
        "name": "MCA Portal",
        "description": "Ministry of Corporate Affairs filing integration",
        "category": "Government",
        "status": "disconnected",
        "icon": "/integrations/mca.svg",
    })

    return {"integrations": results}
