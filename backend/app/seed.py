"""
Demo Data Seeder
================
Creates demo/mock data for the Darukaa.Earth application.

This script creates:
- 1 demo user (demo@darukaa.earth / demo1234)
- 2 projects
- 3 sites with real polygon coordinates
- 24 months of mock analytics per site

NOTE: All analytics values are mock/demo data for demonstration purposes only.
They do not represent real carbon sequestration or biodiversity measurements.

Usage:
    cd backend
    python -m app.seed
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
import random
from datetime import date, timedelta

from sqlalchemy import text

from app.auth.jwt import hash_password
from app.database import SessionLocal
from app.models import Project, Site, SiteAnalytics, User

# ── Demo polygon coordinates (real locations) ──────────────────────────────────

# Amazon rainforest area (Brazil) — approximate polygon
AMAZON_SITE_1 = {
    "type": "Polygon",
    "coordinates": [
        [
            [-60.025, -3.106],
            [-59.876, -3.106],
            [-59.876, -3.245],
            [-60.025, -3.245],
            [-60.025, -3.106],
        ]
    ],
}

# Another Amazon site nearby
AMAZON_SITE_2 = {
    "type": "Polygon",
    "coordinates": [
        [
            [-59.800, -3.350],
            [-59.650, -3.350],
            [-59.650, -3.480],
            [-59.800, -3.480],
            [-59.800, -3.350],
        ]
    ],
}

# Borneo forest area (Malaysia) — approximate polygon
BORNEO_SITE_1 = {
    "type": "Polygon",
    "coordinates": [
        [
            [117.562, 4.980],
            [117.710, 4.980],
            [117.710, 4.850],
            [117.562, 4.850],
            [117.562, 4.980],
        ]
    ],
}


def generate_analytics(site_id, months=24, base_carbon=12.0, base_ndvi=0.72, base_bio=65.0):
    """
    Generate mock analytics records for a site.
    Values follow a realistic seasonal trend with some random variation.

    NOTE: These are MOCK values for demo purposes only.
    Real carbon sequestration requires satellite/field data analysis.
    """
    records = []
    start_date = date(2023, 1, 1)

    for i in range(months):
        current_date = start_date + timedelta(days=30 * i)

        # Add seasonal variation (peaks in growing season) + random noise
        season_factor = 1 + 0.15 * (1 if 4 <= current_date.month <= 9 else -0.5)
        noise = random.uniform(-0.05, 0.05)

        records.append(
            SiteAnalytics(
                site_id=site_id,
                date=current_date,
                carbon_seq_tonnes=round(base_carbon * season_factor * (1 + noise), 2),
                ndvi=round(min(1.0, base_ndvi * season_factor * (1 + noise * 0.5)), 4),
                biodiversity_score=round(
                    min(100.0, base_bio * season_factor * (1 + noise * 0.3)), 1
                ),
            )
        )

    return records


def seed():
    """Run the seeder. Safe to run multiple times — checks before inserting."""
    db = SessionLocal()

    try:
        # Check if demo user already exists
        existing = db.query(User).filter(User.email == "demo@darukaa.earth").first()
        if existing:
            print("Demo data already exists. Skipping.")
            return

        print("Creating demo user...")
        user = User(
            name="Demo User",
            email="demo@darukaa.earth",
            password_hash=hash_password("demo1234"),
        )
        db.add(user)
        db.flush()  # Get the user.id without committing

        print("Creating projects...")
        project_amazon = Project(
            user_id=user.id,
            name="Amazon Reforestation",
            description="Monitoring carbon sequestration and biodiversity in the Amazon Basin, Brazil.",
        )
        project_borneo = Project(
            user_id=user.id,
            name="Borneo Biodiversity Reserve",
            description="Tracking biodiversity metrics in the Borneo tropical rainforest, Malaysia.",
        )
        db.add(project_amazon)
        db.add(project_borneo)
        db.flush()

        print("Creating sites with PostGIS polygons...")

        def insert_site(project_id, name, description, geojson_polygon):
            """Insert a site using ST_GeomFromGeoJSON to store the polygon in PostGIS."""
            geom_value = db.execute(
                text("SELECT ST_GeomFromGeoJSON(:geojson)"),
                {"geojson": json.dumps(geojson_polygon)},
            ).scalar()

            site = Site(
                project_id=project_id,
                name=name,
                description=description,
                geometry=geom_value,
            )
            db.add(site)
            db.flush()
            return site

        # Amazon sites
        site_a1 = insert_site(
            project_amazon.id,
            "Site Alpha — Northern Sector",
            "Primary forest monitoring zone. Dense canopy with high carbon stock.",
            AMAZON_SITE_1,
        )
        site_a2 = insert_site(
            project_amazon.id,
            "Site Beta — Eastern Corridor",
            "Reforestation area with mixed native species planted since 2020.",
            AMAZON_SITE_2,
        )

        # Borneo site
        site_b1 = insert_site(
            project_borneo.id,
            "Kinabatangan Floodplain",
            "Critical wildlife corridor supporting orangutan and pygmy elephant populations.",
            BORNEO_SITE_1,
        )

        print("Generating mock analytics data (24 months per site)...")
        analytics = []
        analytics += generate_analytics(
            site_a1.id, months=24, base_carbon=14.5, base_ndvi=0.78, base_bio=72.0
        )
        analytics += generate_analytics(
            site_a2.id, months=24, base_carbon=9.2, base_ndvi=0.65, base_bio=58.0
        )
        analytics += generate_analytics(
            site_b1.id, months=24, base_carbon=16.1, base_ndvi=0.82, base_bio=81.0
        )

        db.add_all(analytics)
        db.commit()

        print("\n✅ Seed complete!")
        print("   Demo credentials:")
        print("   Email: demo@darukaa.earth")
        print("   Password: demo1234")

    except Exception as e:
        db.rollback()
        print(f"❌ Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
