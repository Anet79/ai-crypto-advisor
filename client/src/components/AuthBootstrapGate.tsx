import type { ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";
import { AUTH_BOOTSTRAP_LOADING } from "../constants/authLoadingCopy";
import AuthLoadingScreen from "./AuthLoadingScreen";

type AuthBootstrapGateProps = {
  children: ReactNode;
};

/**
 * Blocks the route tree until auth bootstrap and preferences validation finish.
 * Prevents stale bfcache state from rendering protected pages too early.
 */
export default function AuthBootstrapGate({ children }: AuthBootstrapGateProps) {
  const {
    isAccessReady,
    isRevalidating,
    isLoading,
    sessionError,
    token,
    retrySessionRestore,
  } = useAuth();

  if (!isAccessReady) {
    return (
      <AuthLoadingScreen
        title={
          isRevalidating
            ? "Refreshing your session"
            : AUTH_BOOTSTRAP_LOADING.title
        }
        subtitle={
          isRevalidating
            ? "Verifying your account and preferences"
            : isLoading
              ? AUTH_BOOTSTRAP_LOADING.subtitle
              : "Checking your preferences"
        }
      />
    );
  }

  if (sessionError && token) {
    return (
      <AuthLoadingScreen
        variant="error"
        title="Session verification failed"
        subtitle={sessionError}
        onRetry={retrySessionRestore}
        retryLabel="Retry"
      />
    );
  }

  return <>{children}</>;
}
