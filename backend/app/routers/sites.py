import json
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.auth.jwt import get_current_user
from app.database import get_db
from app.models.analytics import SiteAnalytics
from app.models.project import Project
from app.models.site import Site
from app.models.user import User
from app.schemas.analytics import AnalyticsRecord, AnalyticsResponse
from app.schemas.site import SiteCreate, SiteResponse

router = APIRouter(tags=["Sites"])


def _site_to_response(site: Site, db: Session) -> SiteResponse:
    """
    Convert a Site model to a SiteResponse.
    The geometry is stored in PostGIS binary format (WKB).
    We use PostGIS's ST_AsGeoJSON() function to convert it back to GeoJSON
    so the frontend can render it on the Mapbox map.
    """
    geojson = None
    if site.geometry is not None:
        result = db.execute(
            text("SELECT ST_AsGeoJSON(ST_GeomFromWKB(:geom, 4326))"),
            {"geom": bytes(site.geometry.data)},
        ).scalar()
        if result:
            geojson = json.loads(result)

    return SiteResponse(
        id=site.id,
        project_id=site.project_id,
        name=site.name,
        description=site.description,
        geometry=geojson,
        created_at=site.created_at,
    )


@router.get("/projects/{project_id}/sites", response_model=List[SiteResponse])
def list_sites(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all sites for a project. Verifies the project belongs to the current user."""
    project = (
        db.query(Project)
        .filter(
            Project.id == project_id,
            Project.user_id == current_user.id,
        )
        .first()
    )

    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    return [_site_to_response(site, db) for site in project.sites]


@router.post(
    "/projects/{project_id}/sites", response_model=SiteResponse, status_code=status.HTTP_201_CREATED
)
def create_site(
    project_id: str,
    body: SiteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new site with a polygon geometry.

    The polygon flow:
    1. User draws polygon on Mapbox → Mapbox Draw returns a GeoJSON Feature
    2. Frontend extracts the geometry (type + coordinates) and sends it to this endpoint
    3. We convert the GeoJSON geometry to a JSON string
    4. PostGIS function ST_GeomFromGeoJSON() converts that string into a PostGIS geometry object
    5. SQLAlchemy stores it in the GEOMETRY(Polygon, 4326) column
    6. When reading back, ST_AsGeoJSON() converts it back to GeoJSON for the frontend
    """
    project = (
        db.query(Project)
        .filter(
            Project.id == project_id,
            Project.user_id == current_user.id,
        )
        .first()
    )

    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    # Convert the Pydantic geometry model to a JSON string for PostGIS
    geometry_json = json.dumps(body.geometry.model_dump())

    # Use PostGIS ST_GeomFromGeoJSON to parse the GeoJSON into a geometry value
    geom_value = db.execute(
        text("SELECT ST_GeomFromGeoJSON(:geojson)"),
        {"geojson": geometry_json},
    ).scalar()

    site = Site(
        project_id=project_id,
        name=body.name,
        description=body.description,
        geometry=geom_value,
    )
    db.add(site)
    db.commit()
    db.refresh(site)

    return _site_to_response(site, db)


@router.get("/sites/{site_id}", response_model=SiteResponse)
def get_site(
    site_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single site by ID."""
    site = (
        db.query(Site)
        .join(Project)
        .filter(Site.id == site_id, Project.user_id == current_user.id)
        .first()
    )

    if not site:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found")

    return _site_to_response(site, db)


@router.get("/sites/{site_id}/analytics", response_model=AnalyticsResponse)
def get_site_analytics(
    site_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get analytics time-series data for a site.
    Note: This data is mock/demo data seeded for demonstration purposes.
    """
    site = (
        db.query(Site)
        .join(Project)
        .filter(Site.id == site_id, Project.user_id == current_user.id)
        .first()
    )

    if not site:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found")

    records = (
        db.query(SiteAnalytics)
        .filter(SiteAnalytics.site_id == site_id)
        .order_by(SiteAnalytics.date)
        .all()
    )

    return AnalyticsResponse(
        site_id=site.id,
        records=[AnalyticsRecord.model_validate(r) for r in records],
    )
