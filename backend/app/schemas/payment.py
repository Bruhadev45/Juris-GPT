from pydantic import BaseModel
from uuid import UUID
from decimal import Decimal


class PaymentCreateOrderRequest(BaseModel):
    matter_id: UUID
    amount: Decimal = Decimal("1999.00")


class PaymentCreateOrderResponse(BaseModel):
    order_id: str
    amount: Decimal
    currency: str = "INR"
    razorpay_key: str


class PaymentVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
