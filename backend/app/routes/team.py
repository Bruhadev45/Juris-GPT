from fastapi import APIRouter, HTTPException
import uuid
import json
from datetime import datetime
from pathlib import Path

router = APIRouter()

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


def load_team():
    if not TEAM_FILE.exists():
        return DEFAULT_TEAM.copy()
    with open(TEAM_FILE, "r") as f:
        return json.load(f)


def save_team(team):
    TEAM_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(TEAM_FILE, "w") as f:
        json.dump(team, f, indent=2)


@router.get("")
async def list_members():
    team = load_team()
    return {"data": team, "total": len(team)}


@router.post("")
async def add_member(data: dict):
    team = load_team()
    member = {
        "id": str(uuid.uuid4()),
        "name": data.get("name", ""),
        "email": data.get("email", ""),
        "role": data.get("role", ""),
        "department": data.get("department", ""),
        "status": "active",
        "joined_at": datetime.utcnow().date().isoformat(),
    }
    team.append(member)
    save_team(team)
    return {"success": True, "member": member}


@router.put("/{member_id}")
async def update_member(member_id: str, data: dict):
    team = load_team()
    member = next((m for m in team if m["id"] == member_id), None)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    member.update({k: v for k, v in data.items() if k != "id"})
    save_team(team)
    return {"success": True, "member": member}


@router.delete("/{member_id}")
async def remove_member(member_id: str):
    team = load_team()
    team = [m for m in team if m["id"] != member_id]
    save_team(team)
    return {"success": True}
