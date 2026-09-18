import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import ProjectCard from "../components/ProjectCard";
import { projectsApi } from "../services/api";

export default function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  async function loadProjects() {
    try {
      const res = await projectsApi.list();
      setProjects(res.data);
    } catch {
      setError("Failed to load projects.");
    } finally {
      setLoading(false);
    }
  }

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    loadProjects();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function handleCreateProject(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await projectsApi.create(newName.trim(), newDesc.trim());
      setProjects((prev) => [res.data, ...prev]);
      setShowCreateModal(false);
      setNewName("");
      setNewDesc("");
      // Navigate to the new project page
      navigate(`/projects/${res.data.id}`);
    } catch {
      setError("Failed to create project.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1>Projects</h1>
            <p>Manage your carbon and biodiversity monitoring projects</p>
          </div>
          <button
            id="create-project-btn"
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            + New Project
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="loading">
            <div className="spinner" /> Loading projects...
          </div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <h3>No projects yet</h3>
            <p>Create your first project to start monitoring geographical sites.</p>
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              + Create Project
            </button>
          </div>
        ) : (
          <div className="project-grid">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>New Project</h2>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label htmlFor="proj-name">Project Name *</label>
                <input
                  id="proj-name"
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Amazon Reforestation"
                  autoFocus
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="proj-desc">Description (optional)</label>
                <textarea
                  id="proj-desc"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="What is this project monitoring?"
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
