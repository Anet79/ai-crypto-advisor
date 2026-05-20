import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useDashboard } from "../hooks/useDashboard";
import { getPreferredCoins, normalizeMeme } from "../utils/dashboard";
import DashboardStateScreen from "../components/DashboardStateScreen";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import PricesCard from "../components/dashboard/PricesCard";
import NewsCard from "../components/dashboard/NewsCard";
import InsightCard from "../components/dashboard/InsightCard";
import MemeCard from "../components/dashboard/MemeCard";
import "../styles/dashboard.css";

type DashboardContentProps = {
  userName: string;
  onLogout: () => void;
  onMissingPreferences: () => void;
};

function DashboardContent({
  userName,
  onLogout,
  onMissingPreferences,
}: DashboardContentProps) {
  const {
    dashboard,
    loading,
    error,
    feedbackMessage,
    loadDashboard,
    sendFeedback,
  } = useDashboard({
    enabled: true,
    onMissingPreferences,
  });

  if (loading) {
    return (
      <DashboardStateScreen
        variant="loading"
        title="Loading your dashboard"
        message="Fetching live prices, market news, and your personalized AI insight."
      />
    );
  }

  if (error) {
    return (
      <DashboardStateScreen
        variant="error"
        title="We couldn't load your dashboard"
        message={error}
        onRetry={loadDashboard}
        retryLabel="Retry"
      />
    );
  }

  if (!dashboard) {
    return (
      <DashboardStateScreen
        variant="empty"
        title="No dashboard data yet"
        message="Something went wrong while preparing your feed. Please try again."
        onRetry={loadDashboard}
        retryLabel="Retry"
      />
    );
  }

  return (
    <div className="app-page">
      <div className="dashboard-shell">
        <div className="dashboard-main">
          <div className="dashboard-top-row">
            <DashboardHeader userName={userName} />
            <button
              type="button"
              className="dashboard-logout-btn"
              onClick={onLogout}
            >
              <LogOut size={18} strokeWidth={2} aria-hidden />
              <span>Logout</span>
            </button>
          </div>

          {feedbackMessage && (
            <div className="dashboard-feedback-toast" role="status">
              {feedbackMessage}
            </div>
          )}

          <main className="dashboard-cards-grid">
            <div className="dashboard-cards-grid__prices">
              <PricesCard
                preferredCoins={getPreferredCoins(dashboard)}
                prices={dashboard.prices}
                onLike={() => sendFeedback("prices", "like")}
                onDislike={() => sendFeedback("prices", "dislike")}
              />
            </div>

            <div className="dashboard-cards-grid__news">
              <NewsCard
                news={dashboard.news}
                onLike={(id) => sendFeedback("news", "like", id)}
                onDislike={(id) => sendFeedback("news", "dislike", id)}
                onSectionLike={() => sendFeedback("news", "like")}
                onSectionDislike={() => sendFeedback("news", "dislike")}
              />
            </div>

            <div className="dashboard-cards-grid__insight">
              <InsightCard
                insight={dashboard.insight}
                onLike={() => sendFeedback("insight", "like")}
                onDislike={() => sendFeedback("insight", "dislike")}
              />
            </div>

            <div className="dashboard-cards-grid__meme">
              <MemeCard
                meme={normalizeMeme(dashboard.meme)}
                onLike={() => sendFeedback("meme", "like")}
                onDislike={() => sendFeedback("meme", "dislike")}
              />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const {
    user,
    logout,
    canAccessDashboard,
    isAccessReady,
    revalidateSession,
  } = useAuth();

  const redirectToOnboarding = useCallback(() => {
    void revalidateSession().finally(() => {
      navigate("/onboarding", { replace: true });
    });
  }, [navigate, revalidateSession]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!isAccessReady || !canAccessDashboard) {
    return (
      <DashboardStateScreen
        variant="loading"
        title="Loading your dashboard"
        message="Verifying your account and preferences."
      />
    );
  }

  return (
    <DashboardContent
      userName={user?.name ?? "AI Crypto Advisor"}
      onLogout={handleLogout}
      onMissingPreferences={redirectToOnboarding}
    />
  );
}
