from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Optional, Literal


ReviewStatus = Literal["pending", "approved", "changes_requested"]


class LawyerReview(BaseModel):
    id: UUID
    matter_id: UUID
    lawyer_id: Optional[UUID]
    status: ReviewStatus
    notes: Optional[str]
    changes_requested: Optional[str]
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
