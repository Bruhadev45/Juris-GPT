from __future__ import annotations
from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal
from uuid import UUID
from typing import Optional


class Company(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    description: Optional[str]
    state: str
    authorized_capital: Decimal
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
