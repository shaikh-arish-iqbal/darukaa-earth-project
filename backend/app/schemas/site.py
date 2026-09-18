from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Any
import uuid


class GeoJSONGeometry(BaseModel):
    """
    Represents a GeoJSON geometry object.
    When the user draws a polygon on Mapbox, the drawing library returns
    a GeoJSON Feature. We extract just the 'geometry' part (type + coordinates).
    """
    type: str  # e.g. "Polygon"
    coordinates: Any  # nested list of [lon, lat] pairs


class SiteCreate(BaseModel):
    name: str
    description: Optional[str] = None
    geometry: GeoJSONGeometry  # The drawn polygon as GeoJSON


class SiteResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    name: str
    description: Optional[str]
    # We return geometry as a GeoJSON dict so the frontend can display it
    geometry: Optional[Any]
    created_at: datetime

    class Config:
        from_attributes = True
