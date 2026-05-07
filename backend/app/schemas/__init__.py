from .company import CompanyCreate, CompanyResponse
from .founder import FounderCreate, FounderResponse
from .matter import MatterCreate, MatterResponse, MatterStatusResponse
from .document import DocumentResponse, DocumentGenerateRequest

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
