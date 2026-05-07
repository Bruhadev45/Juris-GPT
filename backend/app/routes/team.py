from fastapi import APIRouter, HTTPException, Depends
import uuid
import json
from datetime import datetime, timezone
from pathlib import Path
import aiofiles
import aiofiles.os
import asyncio

from app.routes.auth import require_auth

router = APIRouter(dependencies=[Depends(require_auth)])

# Lock for thread-safe file operations
_team_lock = asyncio.Lock()

TEAM_FILE = Path(__file__).parent.parent.parent / "data" / "team.json"

DEFAULT_TEAM = [
    {
        "id": "1",
        "name": "Advocate Meera Reddy",
        "email": "meera@jurisgpt.com",
        "role": "Senior Legal Counsel",
        "department": "Corporate Law",
        "status": "active",
        "joined_at": "2025-06-01",
    },
    {
        "id": "2",
        "name": "Advocate Vikram Singh",
        "email": "vikram@jurisgpt.com",
        "role": "Legal Analyst",
        "department": "Compliance",
        "status": "active",
        "joined_at": "2025-08-15",
    },
    {
        "id": "3",
        "name": "Priya Nair",
        "email": "priya@jurisgpt.com",
        "role": "Legal Tech Lead",
        "department": "Technology",
        "status": "active",
        "joined_at": "2025-07-01",
    },
]


async def load_team():
    """Load team from file (async)"""
    if not TEAM_FILE.exists():
        return DEFAULT_TEAM.copy()
    async with aiofiles.open(TEAM_FILE, "r") as f:
        content = await f.read()
        return json.loads(content)


async def save_team(team):
    """Save team to file (async)"""
    await aiofiles.os.makedirs(TEAM_FILE.parent, exist_ok=True)
    async with aiofiles.open(TEAM_FILE, "w") as f:
        await f.write(json.dumps(team, indent=2))


@router.get("")
async def list_members():
    """List all team members"""
    async with _team_lock:
        team = await load_team()
    return {"data": team, "total": len(team)}


@router.post("")
async def add_member(data: dict):
    """Add a new team member"""
    async with _team_lock:
        team = await load_team()
        member = {
            "id": str(uuid.uuid4()),
            "name": data.get("name", ""),
            "email": data.get("email", ""),
            "role": data.get("role", ""),
            "department": data.get("department", ""),
            "status": "active",
            "joined_at": datetime.now(timezone.utc).date().isoformat(),
        }
        team.append(member)
        await save_team(team)
    return {"success": True, "member": member}


@router.put("/{member_id}")
async def update_member(member_id: str, data: dict):
    """Update a team member"""
    async with _team_lock:
        team = await load_team()
        member = next((m for m in team if m["id"] == member_id), None)
        if not member:
            raise HTTPException(status_code=404, detail="Member not found")
        member.update({k: v for k, v in data.items() if k != "id"})
        await save_team(team)
    return {"success": True, "member": member}


@router.delete("/{member_id}")
async def remove_member(member_id: str):
    """Remove a team member"""
    async with _team_lock:
        team = await load_team()
        team = [m for m in team if m["id"] != member_id]
        await save_team(team)
    return {"success": True}
