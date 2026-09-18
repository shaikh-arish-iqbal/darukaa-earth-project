"""
Pytest configuration and fixtures shared across all tests.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app

# Use SQLite in-memory for tests (no PostGIS needed for basic tests)
# For spatial tests you'd need a real PostGIS database
TEST_DATABASE_URL = "sqlite:///./test.db"

engine_test = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def client():
    """
    Creates a fresh test client with an in-memory SQLite database for each test.
    This ensures tests don't affect each other.
    """
    # Create tables fresh for each test
    Base.metadata.create_all(bind=engine_test)

    # Override the get_db dependency to use the test database
    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as c:
        yield c

    # Clean up after test
    Base.metadata.drop_all(bind=engine_test)
    app.dependency_overrides.clear()
