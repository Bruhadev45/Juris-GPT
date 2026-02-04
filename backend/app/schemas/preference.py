from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional, Literal


DisputeResolution = Literal["arbitration", "court", "mediation"]


class LegalPreferenceCreate(BaseModel):
    non_compete: bool = True
    non_compete_months: int = Field(default=12, ge=0, le=60)
    dispute_resolution: DisputeResolution = "arbitration"
    governing_law: str = "india"
    additional_terms: Optional[str] = Field(None, max_length=2000)


class LegalPreferenceResponse(BaseModel):
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
