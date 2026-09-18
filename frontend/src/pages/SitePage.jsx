import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import MapView from "../components/MapView";
import AnalyticsChart from "../components/AnalyticsChart";
import { sitesApi } from "../services/api";

/**
 * SitePage
 * ========
 * Shows detailed information about a single site:
 * - Name, description, project link
 * - Small map showing the site's polygon
 * - Analytics chart (carbon, NDVI, biodiversity over time)
 */
export default function SitePage() {
  const { siteId } = useParams();

  const [site, setSite] = useState(null);
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [siteRes, analyticsRes] = await Promise.all([
          sitesApi.get(siteId),
          sitesApi.getAnalytics(siteId),
        ]);
        setSite(siteRes.data);
        setAnalytics(analyticsRes.data.records || []);
      } catch {
        setError("Failed to load site details.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [siteId]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="loading">
          <div className="spinner" /> Loading site...
        </div>
      </>
    );
  }

  if (error || !site) {
    return (
      <>
        <Navbar />
        <div className="page-container">
          <div className="alert alert-error" style={{ marginTop: "24px" }}>
            {error || "Site not found."}
          </div>
        </div>
      </>
    );
  }

  const createdDate = new Date(site.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <Navbar />
      <div className="page-container">
        <Link to={`/projects/${site.project_id}`} className="back-link">
          ← Back to Project
        </Link>

        <div className="page-header">
          <div>
            <h1>📍 {site.name}</h1>
            {site.description && <p>{site.description}</p>}
          </div>
        </div>

        {/* Site metadata */}
        <div className="card" style={{ marginBottom: "24px" }}>
          <div className="site-detail-grid">
            <div className="detail-field">
              <label>Site Name</label>
              <p>{site.name}</p>
            </div>
            <div className="detail-field">
              <label>Created</label>
              <p>{createdDate}</p>
            </div>
            <div className="detail-field">
              <label>Project ID</label>
              <p style={{ fontFamily: "monospace", fontSize: "12px" }}>
                <Link to={`/projects/${site.project_id}`}>{site.project_id}</Link>
              </p>
            </div>
            <div className="detail-field">
              <label>Geometry Type</label>
              <p>{site.geometry?.type || "Polygon"}</p>
            </div>
          </div>
        </div>

        {/* Map showing just this site */}
        <div className="card" style={{ marginBottom: "24px" }}>
          <div className="section-heading">Site Location</div>
          <MapView sites={[site]} drawMode={false} />
        </div>

        {/* Analytics chart */}
        <div className="card">
          <div className="section-heading">Performance Over Time</div>
          {analytics.length > 0 ? (
            <AnalyticsChart records={analytics} />
          ) : (
            <div className="empty-state">
              <p>No analytics data available for this site yet.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
