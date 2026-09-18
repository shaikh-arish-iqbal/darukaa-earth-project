from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.config import settings

# Create SQLAlchemy engine connecting to PostgreSQL
engine = create_engine(settings.DATABASE_URL)

# Each request gets its own database session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all SQLAlchemy models
Base = declarative_base()


def get_db():
    """
    FastAPI dependency that provides a database session per request.
    Ensures the session is always closed after the request completes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
