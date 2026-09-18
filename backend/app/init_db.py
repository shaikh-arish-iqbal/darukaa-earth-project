"""
Database initialization script.
Creates all tables using SQLAlchemy models.
Run this once before starting the application.

Usage:
    cd backend
    python -m app.init_db
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import app.models  # noqa: F401
from app.database import Base, engine
from sqlalchemy import text


def init_db():
    print("Ensuring PostGIS extension exists...")
    try:
        with engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
            conn.commit()
    except Exception as e:
        print(f"Note/Warning regarding PostGIS extension: {e}")

    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created successfully.")
    print("   Tables: users, projects, sites, site_analytics")


if __name__ == "__main__":
    init_db()
