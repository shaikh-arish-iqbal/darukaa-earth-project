import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, projects, sites

logger = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Automatically initialize DB tables and seed demo data on startup
    try:
        from app.init_db import init_db
        from app.seed import seed

        logger.info("Running automatic database initialization...")
        init_db()
        logger.info("Running automatic database seeding...")
        seed()
        logger.info("Database initialized and seeded successfully!")
    except Exception as exc:
        logger.error("Startup database initialization error: %s", exc)
    yield


app = FastAPI(
    title="Darukaa.Earth API",
    description="Geospatial analytics dashboard for carbon and biodiversity projects",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allows the React frontend (running on a different port/domain) to call this API
# In production, replace "*" with the actual frontend URL
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(sites.router)


@app.get("/health")
def health_check():
    """Simple health check endpoint for deployment monitoring."""
    return {"status": "ok", "service": "darukaa-earth-api"}
