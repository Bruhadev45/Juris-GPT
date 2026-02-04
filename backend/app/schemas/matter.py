from pydantic import BaseModel
from decimal import Decimal
from uuid import UUID
from datetime import datetime
from typing import Literal
from .company import CompanyResponse
from .founder import FounderResponse
from .preference import LegalPreferenceResponse


MatterStatus = Literal[
    "draft", "payment_pending", "ai_generating", "lawyer_review", "approved", "rejected", "completed"
]


class MatterCreate(BaseModel):
    company_id: UUID
    matter_type: str = "founder_agreement"


class MatterResponse(BaseModel):
    id: UUID
    company_id: UUID
    matter_type: str
    status: MatterStatus
    price: Decimal
    created_at: datetime
    updated_at: datetime
    company: CompanyResponse | None = None
    founders: list[FounderResponse] = []
    preferences: LegalPreferenceResponse | None = None

    class Config:
        from_attributes = True


class MatterStatusResponse(BaseModel):
    id: UUID
    status: MatterStatus
    updated_at: datetime
