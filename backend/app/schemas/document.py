from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional


class DocumentGenerateRequest(BaseModel):
    matter_id: UUID


class DocumentResponse(BaseModel):
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
