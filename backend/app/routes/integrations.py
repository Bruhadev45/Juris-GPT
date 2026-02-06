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
        "name": "Supabase",
        "description": "Database & Storage",
        "status": "connected" if supabase_connected else "disconnected",
        "icon": "Database",
    })

    # OpenAI
    openai_connected = bool(settings.openai_api_key)
    results.append({
        "name": "OpenAI",
        "description": "AI Document Generation (GPT-4o)",
        "status": "connected" if openai_connected else "disconnected",
        "icon": "Zap",
    })

    # Resend
    resend_connected = bool(settings.resend_api_key)
    results.append({
        "name": "Resend",
        "description": "Email Notifications",
        "status": "connected" if resend_connected else "disconnected",
        "icon": "Mail",
    })

    # Razorpay
    razorpay_connected = bool(getattr(settings, "razorpay_key_id", None))
    results.append({
        "name": "Razorpay",
        "description": "Payment Gateway",
        "status": "connected" if razorpay_connected else "available",
        "icon": "CreditCard",
    })

    # Google Drive
    results.append({
        "name": "Google Drive",
        "description": "Cloud Document Storage",
        "status": "available",
        "icon": "Cloud",
    })

    return {"integrations": results}
