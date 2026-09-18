from pydantic import BaseModel
from datetime import datetime
from typing import Optional
import uuid


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None


class ProjectResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    description: Optional[str]
    created_at: datetime
    site_count: int = 0

    class Config:
        from_attributes = True
