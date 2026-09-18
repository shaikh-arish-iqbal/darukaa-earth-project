import { useState } from "react";

/**
 * AddSiteModal
 * ============
 * A modal that appears after the user draws a polygon on the map.
 * Collects the site name and description, then calls onSave with
 * the form data + the drawn geometry.
 *
 * Props:
 *   geometry   — GeoJSON geometry from Mapbox Draw (passed from MapView)
 *   onSave     — called with { name, description, geometry }
 *   onCancel   — called when user clicks Cancel
 */
export default function AddSiteModal({ geometry, onSave, onCancel }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Site name is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({ name: name.trim(), description: description.trim(), geometry });
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save site.");
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Add New Site</h2>
        <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginBottom: "16px" }}>
          Polygon drawn. Enter a name for this site.
        </p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="site-name">Site Name *</label>
            <input
              id="site-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Northern Sector"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="site-desc">Description (optional)</label>
            <textarea
              id="site-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this site..."
            />
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save Site"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
