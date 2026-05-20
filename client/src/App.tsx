import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage.tsx";
import SignupPage from "./pages/SignupPage.tsx";
import OnboardingPage from "./pages/OnboardingPage.tsx";
import DashboardPage from "./pages/DashboardPage.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import PublicRoute from "./components/PublicRoute.tsx";
import AuthBootstrapGate from "./components/AuthBootstrapGate.tsx";
import { useAuth } from "./hooks/useAuth";
import { useBfcacheRecovery } from "./hooks/useBfcacheRecovery";
import { getAuthenticatedHomePathForUser } from "./utils/authRedirects";

function RootRedirect() {
  const { isAuthenticated, user, hasPreferences } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Navigate
      to={getAuthenticatedHomePathForUser(user, hasPreferences)}
      replace
    />
  );
}

function App() {
  const bfcacheRecoveryKey = useBfcacheRecovery();

  return (
    <BrowserRouter key={bfcacheRecoveryKey}>
      <AuthBootstrapGate>
        <Routes>
          <Route path="/" element={<RootRedirect />} />

          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <SignupPage />
              </PublicRoute>
            }
          />

          <Route element={<ProtectedRoute />}>
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthBootstrapGate>
    </BrowserRouter>
  );
}

export default App;
