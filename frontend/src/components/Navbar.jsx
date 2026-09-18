import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="navbar-brand">
        🌍 <span>Darukaa.Earth</span>
      </Link>
      <div className="navbar-right">
        {user && (
          <>
            <span className="navbar-user">👤 {user.name}</span>
            <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
