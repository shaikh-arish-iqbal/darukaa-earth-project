import uuid
from datetime import datetime, timezone

from geoalchemy2 import Geometry
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Site(Base):
    __tablename__ = "sites"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)

    # PostGIS geometry column — stores a polygon in WGS84 (EPSG:4326, standard lat/lon)
    # GeoAlchemy2 maps this to PostGIS's GEOMETRY type
    geometry = Column(Geometry(geometry_type="POLYGON", srid=4326), nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    project = relationship("Project", back_populates="sites")
    analytics = relationship("SiteAnalytics", back_populates="site", cascade="all, delete-orphan")
