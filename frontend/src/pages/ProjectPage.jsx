import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import MapView from "../components/MapView";
import SiteList from "../components/SiteList";
import AddSiteModal from "../components/AddSiteModal";
import { projectsApi, sitesApi } from "../services/api";

/**
 * ProjectPage
 * ===========
 * Shows a project's details, an interactive map with all sites,
 * and a sidebar list of sites.
 *
 * The key interaction here is:
 * 1. User clicks "Add Site" → map enters draw mode
 * 2. User draws a polygon → AddSiteModal appears
 * 3. User names the site → saved to backend via POST /projects/{id}/sites
 * 4. New site polygon appears on the map
 */
export default function ProjectPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [drawMode, setDrawMode] = useState(false);
  const [drawnGeometry, setDrawnGeometry] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [projRes, sitesRes] = await Promise.all([
          projectsApi.get(projectId),
          sitesApi.list(projectId),
        ]);
        setProject(projRes.data);
        setSites(sitesRes.data);
      } catch {
        setError("Failed to load project. It may not exist or you don't have access.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId]);

  function handlePolygonDrawn(geometry) {
    // User finished drawing — show the name/description modal
    setDrawnGeometry(geometry);
  }

  async function handleSaveSite({ name, description, geometry }) {
    const res = await sitesApi.create(projectId, name, description, geometry);
    // Add the new site to state so the map and list update immediately
    setSites((prev) => [...prev, res.data]);
    setDrawnGeometry(null);
    setDrawMode(false);
  }

  function handleSiteClick(site) {
    navigate(`/sites/${site.id}`);
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="loading">
          <div className="spinner" /> Loading project...
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="page-container">
          <div className="alert alert-error" style={{ marginTop: "24px" }}>
            {error}
          </div>
          <Link to="/dashboard" className="btn btn-secondary" style={{ marginTop: "12px" }}>
            ← Back to Dashboard
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="page-container">
        <Link to="/dashboard" className="back-link">
          ← Dashboard
        </Link>

        <div className="page-header">
          <div>
            <h1>{project.name}</h1>
            {project.description && <p>{project.description}</p>}
          </div>
          <button
            id="add-site-btn"
            className={`btn ${drawMode ? "btn-secondary" : "btn-primary"}`}
            onClick={() => {
              setDrawMode((d) => !d);
              setDrawnGeometry(null);
            }}
          >
            {drawMode ? "✕ Cancel Drawing" : "+ Add Site"}
          </button>
        </div>

        {drawMode && !drawnGeometry && (
          <div className="alert alert-success">
            🖊 Draw mode active. Use the polygon tool on the map to define a site boundary.
          </div>
        )}

        <div className="project-layout">
          {/* Map */}
          <div>
            <MapView
              key={drawMode ? "draw" : "view"} // Remount map when switching modes
              sites={sites}
              drawMode={drawMode}
              onPolygonDrawn={handlePolygonDrawn}
              onSiteClick={handleSiteClick}
            />
          </div>

          {/* Site list sidebar */}
          <div className="card">
            <div className="section-heading">
              Sites
              <span className="badge">{sites.length}</span>
            </div>
            <SiteList sites={sites} />
          </div>
        </div>
      </div>

      {/* Modal appears after polygon is drawn */}
      {drawnGeometry && (
        <AddSiteModal
          geometry={drawnGeometry}
          onSave={handleSaveSite}
          onCancel={() => {
            setDrawnGeometry(null);
            setDrawMode(false);
          }}
        />
      )}
    </>
  );
}
