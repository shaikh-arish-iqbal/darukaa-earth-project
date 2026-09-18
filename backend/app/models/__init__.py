# Import all models here so SQLAlchemy knows about them when creating tables
from app.models.analytics import SiteAnalytics
from app.models.project import Project
from app.models.site import Site
from app.models.user import User

__all__ = ["User", "Project", "Site", "SiteAnalytics"]
