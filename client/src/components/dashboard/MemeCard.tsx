import { useState } from "react";
import { Laugh } from "lucide-react";
import type { MemeItem } from "../../types/dashboard";
import CardEmptyState from "../CardEmptyState";
import FeedbackButtons from "./FeedbackButtons";

type MemeCardProps = {
  meme: MemeItem;
  onLike: () => void;
  onDislike: () => void;
};

export default function MemeCard({ meme, onLike, onDislike }: MemeCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(meme.imageUrl) && !imageFailed;
  const hasMemeContent = showImage || Boolean(meme.caption?.trim());

  return (
    <section className="dashboard-glass-card meme-card">
      <div className="dashboard-card-header">
        <h2 className="dashboard-card-title">
          <span
            className="dashboard-card-title-icon meme-card__header-icon"
            aria-hidden
          >
            <Laugh size={22} strokeWidth={1.75} />
          </span>
          Crypto Meme of the Day
        </h2>
        <span className="dashboard-card-badge dashboard-card-badge--pink">
          Fun
        </span>
      </div>

      {!hasMemeContent ? (
        <CardEmptyState message="No meme available right now. Refresh the dashboard for a new one." />
      ) : (
      <div className="meme-card__box">
        {showImage ? (
          <div className="meme-card__media">
            <img
              className="meme-card__image"
              src={meme.imageUrl}
              alt={meme.title}
              loading="lazy"
              onError={() => setImageFailed(true)}
            />
          </div>
        ) : (
          <div className="meme-card__media meme-card__media--fallback">
            <span className="meme-card__fallback" aria-hidden>
              🚀
            </span>
          </div>
        )}

        <p className="meme-card__title">{meme.title}</p>
        <p className="meme-card__quote">&ldquo;{meme.caption}&rdquo;</p>
      </div>
      )}

      <FeedbackButtons
        variant="newsFooter"
        label="What do you think of this meme?"
        onLike={onLike}
        onDislike={onDislike}
      />
    </section>
  );
}
