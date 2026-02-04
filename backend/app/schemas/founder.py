from pydantic import BaseModel, Field, EmailStr
from decimal import Decimal
from uuid import UUID
from datetime import datetime


class FounderCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    role: str = Field(..., min_length=1, max_length=50)
    equity_percentage: Decimal = Field(..., gt=0, le=100)
    vesting_months: int = Field(default=48, ge=12, le=120)
    cliff_months: int = Field(default=12, ge=0, le=48)


class FounderResponse(BaseModel):
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
