from __future__ import annotations
from pydantic import BaseModel, Field
from decimal import Decimal
from uuid import UUID
from datetime import datetime
from typing import Optional


class CompanyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    state: str = Field(..., min_length=1, max_length=50)
    authorized_capital: Decimal = Field(..., gt=0)


class CompanyResponse(BaseModel):
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
