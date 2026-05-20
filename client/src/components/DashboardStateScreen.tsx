import { AlertCircle, Loader2, RefreshCw } from "lucide-react";

type DashboardStateScreenProps = {
  variant: "loading" | "error" | "empty";
  title: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
};

export default function DashboardStateScreen({
  variant,
  title,
  message,
  onRetry,
  retryLabel = "Retry",
}: DashboardStateScreenProps) {
  const isLoading = variant === "loading";

  return (
    <div className="app-page dashboard-state-page">
      <div className="dashboard-shell dashboard-state">
        <div
          className="app-glass-card dashboard-state-card"
          role={isLoading ? "status" : "alert"}
          aria-live="polite"
          aria-busy={isLoading}
        >
          {isLoading ? (
            <Loader2
              className="dashboard-state-card__icon dashboard-state-card__icon--spin"
              size={40}
              strokeWidth={1.75}
              aria-hidden
            />
          ) : (
            <AlertCircle
              className={`dashboard-state-card__icon dashboard-state-card__icon--${variant}`}
              size={40}
              strokeWidth={1.75}
              aria-hidden
            />
          )}

          <h1 className="dashboard-state-card__title">{title}</h1>
          <p className="dashboard-state-card__message">{message}</p>

          {isLoading && (
            <div className="dashboard-state-skeleton" aria-hidden>
              <div className="dashboard-state-skeleton__row dashboard-state-skeleton__row--wide" />
              <div className="dashboard-state-skeleton__row" />
              <div className="dashboard-state-skeleton__row dashboard-state-skeleton__row--short" />
            </div>
          )}

          {onRetry && !isLoading && (
            <button
              type="button"
              className="auth-btn auth-btn--primary dashboard-state-card__retry"
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
