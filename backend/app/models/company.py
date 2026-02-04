from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal
from uuid import UUID


class Company(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    description: str | None
    state: str
    authorized_capital: Decimal
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
