from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal
from uuid import UUID


class Founder(BaseModel):
    id: UUID
    company_id: UUID
    name: str
    email: str
    role: str
    equity_percentage: Decimal
    vesting_months: int
    cliff_months: int
    created_at: datetime

    class Config:
        from_attributes = True
