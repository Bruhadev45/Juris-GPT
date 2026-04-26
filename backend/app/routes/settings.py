from fastapi import APIRouter
from pathlib import Path
import json
import aiofiles
import aiofiles.os
import asyncio

router = APIRouter()

# Lock for thread-safe file operations
_settings_lock = asyncio.Lock()

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


async def load_settings():
    """Load settings from file (async)"""
    if not SETTINGS_FILE.exists():
        return DEFAULT_SETTINGS.copy()
    async with aiofiles.open(SETTINGS_FILE, "r") as f:
        content = await f.read()
        return json.loads(content)


async def save_settings(settings):
    """Save settings to file (async)"""
    await aiofiles.os.makedirs(SETTINGS_FILE.parent, exist_ok=True)
    async with aiofiles.open(SETTINGS_FILE, "w") as f:
        await f.write(json.dumps(settings, indent=2))


@router.get("")
async def get_settings():
    """Get all settings"""
    async with _settings_lock:
        return await load_settings()


@router.put("/profile")
async def update_profile(data: dict):
    """Update profile settings"""
    async with _settings_lock:
        settings = await load_settings()
        settings["profile"].update(data)
        await save_settings(settings)
    return {"success": True, "profile": settings["profile"]}


@router.put("/notifications")
async def update_notifications(data: dict):
    """Update notification settings"""
    async with _settings_lock:
        settings = await load_settings()
        settings["notifications"].update(data)
        await save_settings(settings)
    return {"success": True, "notifications": settings["notifications"]}


@router.put("/appearance")
async def update_appearance(data: dict):
    """Update appearance settings"""
    async with _settings_lock:
        settings = await load_settings()
        settings["appearance"].update(data)
        await save_settings(settings)
    return {"success": True, "appearance": settings["appearance"]}
