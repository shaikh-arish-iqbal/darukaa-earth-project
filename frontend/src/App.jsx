import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ProjectPage from "./pages/ProjectPage";
import SitePage from "./pages/SitePage";

/**
 * ProtectedRoute
 * Redirects to /login if the user is not authenticated.
 * Shows a loading state while we check the stored token.
 */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" /> Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes — require authentication */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:projectId"
          element={
            <ProtectedRoute>
              <ProjectPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sites/:siteId"
          element={
            <ProtectedRoute>
              <SitePage />
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
