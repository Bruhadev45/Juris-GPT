from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID


class UserProfile(BaseModel):
    id: UUID
    email: str
    name: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
