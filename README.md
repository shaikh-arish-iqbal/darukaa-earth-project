# Darukaa.Earth 🌍

A full-stack geospatial analytics dashboard for managing and visualizing carbon and biodiversity projects. Built for the Darukaa.Earth Full-Stack Developer Hackathon.

---

## Features

- **User Authentication** — Register and login with JWT-based auth
- **Project Management** — Create and manage multiple monitoring projects
- **Interactive Map** — Mapbox GL JS map displaying all project sites as polygons
- **Polygon Drawing** — Draw site boundaries directly on the map using Mapbox Draw
- **Site Analytics** — Chart.js visualization of carbon sequestration, NDVI, and biodiversity metrics over time
- **PostGIS Storage** — Site polygons stored as real geographic data in PostgreSQL + PostGIS

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Mapping | Mapbox GL JS + Mapbox Draw |
| Charting | Chart.js + react-chartjs-2 |
| Backend | Python + FastAPI |
| ORM | SQLAlchemy + GeoAlchemy2 |
| Database | PostgreSQL + PostGIS |
| Authentication | JWT (python-jose + passlib/bcrypt) |
| CI/CD | GitHub Actions |
| Code Quality | Ruff (backend), ESLint + Prettier (frontend), pre-commit |
| Deployment | Render.com (backend) + Vercel (frontend) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (React/Vite)               │
│                         Deployed: Vercel                     │
│  LoginPage  RegisterPage  DashboardPage  ProjectPage  SitePage │
│                    ↕ HTTP (axios)                           │
│              services/api.js (all API calls)                │
└─────────────────────────────────────────────────────────────┘
                              ↕ REST API (JSON)
┌─────────────────────────────────────────────────────────────┐
│                    Backend (FastAPI)                         │
│                    Deployed: Render.com                      │
│  /auth  /projects  /projects/{id}/sites  /sites/{id}        │
│  JWT middleware → route handlers → SQLAlchemy ORM           │
└─────────────────────────────────────────────────────────────┘
                              ↕ SQLAlchemy
┌─────────────────────────────────────────────────────────────┐
│              PostgreSQL + PostGIS                            │
│  users | projects | sites (GEOMETRY) | site_analytics       │
└─────────────────────────────────────────────────────────────┘
```

### Polygon Flow (key geospatial interaction)

```
User draws polygon on Mapbox
  → Mapbox Draw returns GeoJSON Feature { type: "Feature", geometry: {...} }
    → Frontend extracts geometry { type: "Polygon", coordinates: [...] }
      → POST /projects/{id}/sites  { name, description, geometry }
        → FastAPI validates with Pydantic
          → ST_GeomFromGeoJSON() converts GeoJSON → PostGIS geometry
            → Stored in GEOMETRY(Polygon, 4326) column
              → On read: ST_AsGeoJSON() converts back → returned to frontend
                → Mapbox renders as a polygon on the map
```

---

## Database Schema

### `users`
| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| name | VARCHAR | Display name |
| email | VARCHAR (unique) | Login identifier |
| password_hash | VARCHAR | bcrypt hash |
| created_at | TIMESTAMP | Auto-set |

### `projects`
| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| user_id | UUID → users | Owner (foreign key) |
| name | VARCHAR | Project name |
| description | TEXT | Optional description |
| created_at | TIMESTAMP | Auto-set |

### `sites`
| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| project_id | UUID → projects | Parent project |
| name | VARCHAR | Site name |
| description | TEXT | Optional |
| geometry | GEOMETRY(Polygon, 4326) | PostGIS polygon in WGS84 |
| created_at | TIMESTAMP | Auto-set |

### `site_analytics`
| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| site_id | UUID → sites | Parent site |
| date | DATE | Measurement date |
| carbon_seq_tonnes | FLOAT | Carbon sequestration (t CO₂/ha/yr) |
| ndvi | FLOAT | Normalized Difference Vegetation Index |
| biodiversity_score | FLOAT | Composite biodiversity index (0–100) |

> **Note:** All analytics values are **mock/demo data** seeded for demonstration purposes. Real values would require satellite imagery analysis or field surveys.

---

## API Overview

### Auth
```
POST /auth/register    — Create account (name, email, password)
POST /auth/login       — Login, returns JWT token
GET  /auth/me          — Get current user profile [requires token]
```

### Projects
```
GET    /projects         — List user's projects [JWT required]
POST   /projects         — Create project [JWT required]
GET    /projects/{id}    — Get project [JWT required]
DELETE /projects/{id}    — Delete project [JWT required]
```

### Sites
```
GET  /projects/{id}/sites  — List sites for a project [JWT required]
POST /projects/{id}/sites  — Create site with polygon [JWT required]
GET  /sites/{id}           — Get site details + geometry [JWT required]
GET  /sites/{id}/analytics — Get analytics time-series [JWT required]
```

---

## Environment Variables

### Backend (`backend/.env`)
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/darukaa
SECRET_KEY=your-long-random-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

### Frontend (`frontend/.env`)
```bash
VITE_API_URL=http://localhost:8000
VITE_MAPBOX_TOKEN=pk.your_mapbox_token_here
```

---

## Local Setup

### Prerequisites
- Python 3.11+
- Node.js 20+
- PostgreSQL 14+ with PostGIS extension
- A free Mapbox account (for the access token)

### 1. PostgreSQL + PostGIS setup

```sql
-- In psql:
CREATE DATABASE darukaa;
\c darukaa
CREATE EXTENSION postgis;
```

### 2. Backend setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Create .env from template
copy .env.example .env
# Edit .env with your DATABASE_URL and a SECRET_KEY

# Create database tables
python -m app.init_db

# Seed demo data
python -m app.seed

# Start the API server
uvicorn app.main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

### 3. Frontend setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env from template
copy .env.example .env
# Edit .env: add your Mapbox token

# Start dev server
npm run dev
```

App runs at: http://localhost:5173

### 4. Demo credentials
```
Email:    demo@darukaa.earth
Password: demo1234
```

---

## Running Tests

### Backend tests
```bash
cd backend
# Activate venv first
pytest tests/ -v
```

Tests use SQLite in-memory (no PostgreSQL needed for tests).

### Frontend lint/format
```bash
cd frontend
npm run lint          # ESLint
npm run format:check  # Prettier check
```

---

## CI/CD Pipeline

GitHub Actions runs on every push to `main` and every pull request.

### Backend job
1. Checkout code
2. Install Python dependencies
3. Run `ruff check .` (linting)
4. Run `ruff format --check .` (formatting)
5. Run `pytest tests/ -v` (tests use SQLite, no real DB needed)

### Frontend job
1. Checkout code
2. Install Node dependencies (`npm ci`)
3. Run `npm run lint` (ESLint)
4. Run `npm run format:check` (Prettier)
5. Run `npm run build` (Vite production build)

Both jobs run in parallel. CI configuration: [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

---

## Deployment

### Backend → Render.com

1. Connect GitHub repo to [render.com](https://render.com)
2. Render detects `render.yaml` and creates a web service + PostgreSQL database
3. Enable PostGIS on the database:
   - Render Dashboard → PostgreSQL → Shell
   - Run: `CREATE EXTENSION postgis;`
4. Set `SECRET_KEY` in Render environment variables
5. After deploy, run the init + seed scripts:
   - SSH into Render shell: `python -m app.init_db && python -m app.seed`

### Frontend → Vercel

1. Connect GitHub repo to [vercel.com](https://vercel.com)
2. Set root directory to `frontend/`
3. Add environment variables:
   - `VITE_API_URL` = your Render backend URL
   - `VITE_MAPBOX_TOKEN` = your Mapbox token
4. Deploy — Vercel auto-deploys on every push to `main`

---

## Design & Technical Decisions

| Decision | Reason |
|---|---|
| FastAPI over Flask/Django | FastAPI has automatic Pydantic validation, OpenAPI docs at /docs, and async support — all useful for a hackathon demo |
| Chart.js over Highcharts | Chart.js is free (MIT license). Highcharts requires a commercial license |
| SQLite for tests | Avoids PostGIS dependency in CI, keeps tests fast and simple |
| JWT in localStorage | Simpler for demo; httpOnly cookies are more secure but add complexity |
| `key=drawMode` on MapView | Forces Mapbox to fully re-initialize when switching between view/draw modes, avoiding state conflicts |
| Mock analytics data | PDF explicitly allows datasets/mocks. Real values need satellite data pipelines |
| GeoAlchemy2 | Maps Python objects to PostGIS geometry types cleanly without raw SQL for model definitions |


