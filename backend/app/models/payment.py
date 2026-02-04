from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal
from uuid import UUID
from typing import Optional, Literal


PaymentStatus = Literal["pending", "processing", "completed", "failed", "refunded"]


class Payment(BaseModel):
    id: UUID
    matter_id: UUID
    amount: Decimal
    razorpay_order_id: Optional[str]
    razorpay_payment_id: Optional[str]
    status: PaymentStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
