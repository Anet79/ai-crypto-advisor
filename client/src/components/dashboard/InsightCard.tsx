import { Sparkles } from "lucide-react";
import CardEmptyState from "../CardEmptyState";
import FeedbackButtons from "./FeedbackButtons";

type InsightCardProps = {
  insight: string;
  onLike: () => void;
  onDislike: () => void;
};

export default function InsightCard({
  insight,
  onLike,
  onDislike,
}: InsightCardProps) {
  const hasInsight = Boolean(insight?.trim());

  return (
    <section className="dashboard-glass-card dashboard-card-fill insight-card">
      <div className="dashboard-card-header">
        <h2 className="dashboard-card-title">
          <span
            className="dashboard-card-title-icon insight-card__header-icon"
            aria-hidden
          >
            <Sparkles size={22} strokeWidth={1.75} />
          </span>
          AI Market Insight
        </h2>
        <span className="dashboard-card-badge dashboard-card-badge--purple">
          AI
        </span>
      </div>

      {hasInsight ? (
        <p className="insight-card__text">{insight}</p>
      ) : (
        <CardEmptyState message="AI insight is not available right now. Please check back later." />
      )}

      <FeedbackButtons
        variant="newsFooter"
        label="What do you think of this insight?"
        onLike={onLike}
        onDislike={onDislike}
      />
    </section>
  );
}
