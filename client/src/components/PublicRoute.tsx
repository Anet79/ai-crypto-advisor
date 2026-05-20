import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getAuthenticatedHomePathForUser } from "../utils/authRedirects";

type PublicRouteProps = {
  children: ReactNode;
};
export default function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, user, hasPreferences } = useAuth();

  if (isAuthenticated) {
    return (
      <Navigate
        to={getAuthenticatedHomePathForUser(user, hasPreferences)}
        replace
      />
    );
  }

  return <>{children}</>;
}
