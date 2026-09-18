from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, projects, sites

app = FastAPI(
    title="Darukaa.Earth API",
    description="Geospatial analytics dashboard for carbon and biodiversity projects",
    version="1.0.0",
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
