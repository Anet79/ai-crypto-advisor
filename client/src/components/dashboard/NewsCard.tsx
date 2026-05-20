import { Newspaper } from "lucide-react";
import CardEmptyState from "../CardEmptyState";
import FeedbackButtons from "./FeedbackButtons";
import type { NewsItem } from "../../types/dashboard";

type NewsCardProps = {
  news: NewsItem[];
  onLike: (id: string) => void;
  onDislike: (id: string) => void;
  onSectionLike: () => void;
  onSectionDislike: () => void;
};

export default function NewsCard({
  news,
  onLike,
  onDislike,
  onSectionLike,
  onSectionDislike,
}: NewsCardProps) {
  return (
    <section className="dashboard-glass-card news-card">
      <div className="dashboard-card-header">
        <h2 className="dashboard-card-title">
          <span className="dashboard-card-title-icon news-card__header-icon" aria-hidden>
            <Newspaper size={22} strokeWidth={1.75} />
          </span>
          Top Crypto News
        </h2>
        <span className="dashboard-card-badge dashboard-card-badge--cyan">
          Today
        </span>
      </div>

      {news.length === 0 ? (
        <CardEmptyState message="No news available right now. Check back soon for market updates." />
      ) : (
      <div className="news-list">
        {news.map((item, index) => (
          <article key={item.id} className="news-item">
            <div className="news-item__title-row">
              <span className="news-item__dot" aria-hidden />
              <h3 className="news-item__title">{item.title}</h3>
            </div>

            <div className="news-item__meta-row">
              <p className="news-item__meta">
                <span>{item.source}</span>
                <span className="news-item__meta-dot" aria-hidden />
                <span>Market feed</span>
                {index === 0 && (
                  <>
                    <span className="news-item__meta-dot" aria-hidden />
                    <span>Latest</span>
                  </>
                )}
              </p>

              <FeedbackButtons
                variant="newsInline"
                onLike={() => onLike(item.id)}
                onDislike={() => onDislike(item.id)}
              />
            </div>
          </article>
        ))}
      </div>
      )}

      <FeedbackButtons
        variant="newsFooter"
        label="What do you think?"
        onLike={onSectionLike}
        onDislike={onSectionDislike}
      />
    </section>
  );
}
