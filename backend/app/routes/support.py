from fastapi import APIRouter, HTTPException
import uuid
import json
from datetime import datetime
from pathlib import Path

router = APIRouter()

TICKETS_FILE = Path(__file__).parent.parent.parent / "data" / "support_tickets.json"


def load_tickets():
    if not TICKETS_FILE.exists():
        return []
    with open(TICKETS_FILE, "r") as f:
        return json.load(f)


def save_tickets(tickets):
    TICKETS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(TICKETS_FILE, "w") as f:
        json.dump(tickets, f, indent=2, default=str)


@router.post("/tickets")
async def create_ticket(data: dict):
    tickets = load_tickets()
    ticket = {
        "id": str(uuid.uuid4()),
        "name": data.get("name", ""),
        "email": data.get("email", ""),
        "subject": data.get("subject", ""),
        "message": data.get("message", ""),
        "category": data.get("category", "general"),
        "status": "open",
        "created_at": datetime.utcnow().isoformat(),
    }
    tickets.append(ticket)
    save_tickets(tickets)
    return {"success": True, "ticket": ticket}


@router.get("/tickets")
async def list_tickets():
    tickets = load_tickets()
    return {"data": tickets, "total": len(tickets)}


@router.get("/tickets/{ticket_id}")
async def get_ticket(ticket_id: str):
    tickets = load_tickets()
    ticket = next((t for t in tickets if t["id"] == ticket_id), None)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket
