"""
Pytest configuration and fixtures shared across all tests.
"""

import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app

# Use the database URL provided by environment (e.g. from CI), or a local test fallback
TEST_DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://darukaa:password@localhost:5432/darukaa_test"
)

# Don't use check_same_thread as it is an sqlite-only parameter
engine_test = create_engine(TEST_DATABASE_URL)
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
