from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Optional


class Document(BaseModel):
    id: UUID
    matter_id: UUID
    content: Optional[str]
    version: int
    is_final: bool
    storage_url: Optional[str]
    file_name: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
