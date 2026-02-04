from .company import CompanyCreate, CompanyResponse
from .founder import FounderCreate, FounderResponse
from .matter import MatterCreate, MatterResponse, MatterStatusResponse
from .document import DocumentResponse, DocumentGenerateRequest
# Payment schemas removed for now - can be added back later
# from .payment import PaymentCreateOrderRequest, PaymentCreateOrderResponse, PaymentVerifyRequest

__all__ = [
    "CompanyCreate",
    "CompanyResponse",
    "FounderCreate",
    "FounderResponse",
    "MatterCreate",
    "MatterResponse",
    "MatterStatusResponse",
    "DocumentResponse",
    "DocumentGenerateRequest",
]
