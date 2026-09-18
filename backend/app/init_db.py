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

from app.database import Base, engine

# Import all models so Base knows about them


def init_db():
    print("Creating database tables...")
    # This runs CREATE TABLE IF NOT EXISTS for all models
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created successfully.")
    print("   Tables: users, projects, sites, site_analytics")
    print("\nNext step: run the seed script to add demo data:")
    print("   python -m app.seed")


if __name__ == "__main__":
    init_db()
