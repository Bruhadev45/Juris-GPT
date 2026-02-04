from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Optional, Literal


DisputeResolution = Literal["arbitration", "court", "mediation"]


class LegalPreference(BaseModel):
    id: UUID
    matter_id: UUID
    non_compete: bool
    non_compete_months: int
    dispute_resolution: DisputeResolution
    governing_law: str
    additional_terms: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
