from fastapi import APIRouter
from pathlib import Path
import json

router = APIRouter()

SETTINGS_FILE = Path(__file__).parent.parent.parent / "data" / "settings.json"

DEFAULT_SETTINGS = {
    "profile": {
        "name": "Admin User",
        "email": "admin@jurisgpt.com",
        "company": "JurisGPT",
        "role": "Administrator",
    },
    "notifications": {
        "email_notifications": True,
        "compliance_alerts": True,
        "document_updates": True,
        "weekly_digest": False,
    },
    "appearance": {
        "theme": "system",
        "language": "en",
        "timezone": "Asia/Kolkata",
    },
}


def load_settings():
    if not SETTINGS_FILE.exists():
        return DEFAULT_SETTINGS.copy()
    with open(SETTINGS_FILE, "r") as f:
        return json.load(f)


def save_settings(settings):
    SETTINGS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(SETTINGS_FILE, "w") as f:
        json.dump(settings, f, indent=2)


@router.get("")
async def get_settings():
    return load_settings()


@router.put("/profile")
async def update_profile(data: dict):
    settings = load_settings()
    settings["profile"].update(data)
    save_settings(settings)
    return {"success": True, "profile": settings["profile"]}


@router.put("/notifications")
async def update_notifications(data: dict):
    settings = load_settings()
    settings["notifications"].update(data)
    save_settings(settings)
    return {"success": True, "notifications": settings["notifications"]}


@router.put("/appearance")
async def update_appearance(data: dict):
    settings = load_settings()
    settings["appearance"].update(data)
    save_settings(settings)
    return {"success": True, "appearance": settings["appearance"]}
