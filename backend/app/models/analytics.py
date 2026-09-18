import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, Date, DateTime, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class SiteAnalytics(Base):
    __tablename__ = "site_analytics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    site_id = Column(UUID(as_uuid=True), ForeignKey("sites.id", ondelete="CASCADE"), nullable=False)

    # The date this measurement was recorded
    date = Column(Date, nullable=False)

    # Carbon sequestration estimate in tonnes CO2 per hectare per year (mock data)
    carbon_seq_tonnes = Column(Float, nullable=True)

    # NDVI: Normalized Difference Vegetation Index, range -1 to 1 (mock data)
    ndvi = Column(Float, nullable=True)

    # Biodiversity score: a composite index 0-100 (mock data)
    biodiversity_score = Column(Float, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationship back to site
    site = relationship("Site", back_populates="analytics")
