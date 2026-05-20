/**
 * Route guard for authenticated pages (/onboarding, /dashboard).
 * Redirects based on `canAccessDashboard` — not just the onboarding flag alone.
 */
import { Navigate, Outlet, useLocation } from "react-router-dom";import { useAuth } from "../hooks/useAuth";

export default function ProtectedRoute() {
  const { isAuthenticated, canAccessDashboard, isAccessReady } = useAuth();
  const location = useLocation();

  if (!isAccessReady) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (canAccessDashboard && location.pathname === "/onboarding") {
    return <Navigate to="/dashboard" replace />;
  }

  if (!canAccessDashboard && location.pathname === "/dashboard") {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
