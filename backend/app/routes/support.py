from fastapi import APIRouter, HTTPException
import uuid
import json
from datetime import datetime, timezone
from pathlib import Path
import aiofiles
import aiofiles.os
import asyncio

router = APIRouter()

TICKETS_FILE = Path(__file__).parent.parent.parent / "data" / "support_tickets.json"

# Lock for thread-safe file operations
_tickets_lock = asyncio.Lock()


async def load_tickets():
    """Load tickets from file (async)"""
    if not TICKETS_FILE.exists():
        return []
    async with aiofiles.open(TICKETS_FILE, "r") as f:
        content = await f.read()
        return json.loads(content)


async def save_tickets(tickets):
    """Save tickets to file (async)"""
    await aiofiles.os.makedirs(TICKETS_FILE.parent, exist_ok=True)
    async with aiofiles.open(TICKETS_FILE, "w") as f:
        await f.write(json.dumps(tickets, indent=2, default=str))


@router.post("/tickets")
async def create_ticket(data: dict):
    """Create a new support ticket"""
    async with _tickets_lock:
        tickets = await load_tickets()
        ticket = {
            "id": str(uuid.uuid4()),
            "name": data.get("name", ""),
            "email": data.get("email", ""),
            "subject": data.get("subject", ""),
            "message": data.get("message", ""),
            "category": data.get("category", "general"),
            "status": "open",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        tickets.append(ticket)
        await save_tickets(tickets)
    return {"success": True, "ticket": ticket}


@router.get("/tickets")
async def list_tickets():
    """List all support tickets"""
    async with _tickets_lock:
        tickets = await load_tickets()
    return {"data": tickets, "total": len(tickets)}


@router.get("/tickets/{ticket_id}")
async def get_ticket(ticket_id: str):
    """Get a specific support ticket"""
    async with _tickets_lock:
        tickets = await load_tickets()
    ticket = next((t for t in tickets if t["id"] == ticket_id), None)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket
