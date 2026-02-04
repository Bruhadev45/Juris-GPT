from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal
from uuid import UUID
from typing import Literal


MatterStatus = Literal[
    "draft", "payment_pending", "ai_generating", "lawyer_review", "approved", "rejected", "completed"
]


class LegalMatter(BaseModel):
    id: UUID
    company_id: UUID
    matter_type: str
    status: MatterStatus
    price: Decimal
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
