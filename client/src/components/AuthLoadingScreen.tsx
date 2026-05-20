import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { AUTH_BOOTSTRAP_LOADING } from "../constants/authLoadingCopy";

type AuthLoadingScreenProps = {
  title?: string;
  subtitle?: string;
  onRetry?: () => void;
  retryLabel?: string;
  variant?: "loading" | "error";
};

export default function AuthLoadingScreen({
  title = AUTH_BOOTSTRAP_LOADING.title,
  subtitle = AUTH_BOOTSTRAP_LOADING.subtitle,
  onRetry,
  retryLabel = "Try again",
  variant = onRetry ? "error" : "loading",
}: AuthLoadingScreenProps) {
  const isLoading = variant === "loading";

  return (
    <div className="app-page auth-page">
      <div className="auth-page__inner">
        <div className="auth-brand">
          <span className="auth-brand__icon" aria-hidden>
            ₿
          </span>
          <span>AI Crypto Advisor</span>
        </div>

        <div
          className="app-glass-card auth-loading-card"
          role={isLoading ? "status" : "alert"}
          aria-live="polite"
          aria-busy={isLoading}
        >
          {isLoading ? (
            <Loader2
              className="auth-loading-card__icon auth-loading-card__icon--spin"
              size={40}
              strokeWidth={1.75}
              aria-hidden
            />
          ) : (
            <AlertCircle
              className="auth-loading-card__icon auth-loading-card__icon--error"
              size={40}
              strokeWidth={1.75}
              aria-hidden
            />
          )}

          <h1 className="auth-title">{title}</h1>
          <p className="auth-subtitle">{subtitle}</p>

          {isLoading && (
            <div className="auth-loading-dots" aria-hidden>
              <span />
              <span />
              <span />
            </div>
          )}

          {onRetry && (
            <button
              type="button"
              className="auth-btn auth-btn--secondary auth-loading-card__retry"
              onClick={onRetry}
            >
              <RefreshCw size={18} strokeWidth={2} aria-hidden />
              <span>{retryLabel}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
