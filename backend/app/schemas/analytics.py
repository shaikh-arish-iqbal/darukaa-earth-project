import uuid
from datetime import date
from typing import List, Optional

from pydantic import BaseModel


class AnalyticsRecord(BaseModel):
    id: uuid.UUID
    site_id: uuid.UUID
    date: date
    carbon_seq_tonnes: Optional[float]
    ndvi: Optional[float]
    biodiversity_score: Optional[float]

    class Config:
        from_attributes = True


class AnalyticsResponse(BaseModel):
    site_id: uuid.UUID
    records: List[AnalyticsRecord]
    note: str = "Analytics data is mock/demo data for demonstration purposes."
