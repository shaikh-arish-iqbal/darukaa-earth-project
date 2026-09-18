import { Link } from "react-router-dom";

export default function ProjectCard({ project }) {
  const createdDate = new Date(project.created_at).toLocaleDateString();

  return (
    <Link to={`/projects/${project.id}`} className="project-card">
      <h3>{project.name}</h3>
      <p>{project.description || "No description"}</p>
      <div className="project-card-meta">
        <span className="badge">🗺 {project.site_count} site{project.site_count !== 1 ? "s" : ""}</span>
        <span>Created {createdDate}</span>
      </div>
    </Link>
  );
}
