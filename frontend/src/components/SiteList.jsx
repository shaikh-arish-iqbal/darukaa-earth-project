import { Link } from "react-router-dom";

export default function SiteList({ sites }) {
  if (sites.length === 0) {
    return (
      <div className="empty-state">
        <h3>No sites yet</h3>
        <p>Draw a polygon on the map to add your first site.</p>
      </div>
    );
  }

  return (
    <ul className="site-list">
      {sites.map((site) => (
        <li key={site.id}>
          <Link to={`/sites/${site.id}`} className="site-item">
            <div>
              <div className="site-item-name">📍 {site.name}</div>
              {site.description && <div className="site-item-meta">{site.description}</div>}
            </div>
            <span style={{ color: "var(--color-text-muted)", fontSize: "18px" }}>›</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
