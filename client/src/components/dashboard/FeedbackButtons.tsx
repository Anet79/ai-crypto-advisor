import { ThumbsDown, ThumbsUp } from "lucide-react";

type FeedbackButtonsProps = {
  onLike: () => void;
  onDislike: () => void;
  label?: string;
  variant?: "default" | "newsInline" | "newsFooter";
};

const NEWS_ICON_SIZE = 16;
const NEWS_ICON_SIZE_LG = 18;

export default function FeedbackButtons({
  onLike,
  onDislike,
  label = "What do you think?",
  variant = "default",
}: FeedbackButtonsProps) {
  if (variant === "newsInline") {
    return (
      <div className="feedback-news-inline" role="group" aria-label="Rate this article">
        <button
          type="button"
          className="feedback-news-btn feedback-news-btn--like"
          onClick={onLike}
          aria-label="Like"
        >
          <ThumbsUp size={NEWS_ICON_SIZE} strokeWidth={2} aria-hidden />
        </button>
        <button
          type="button"
          className="feedback-news-btn feedback-news-btn--dislike"
          onClick={onDislike}
          aria-label="Dislike"
        >
          <ThumbsDown size={NEWS_ICON_SIZE} strokeWidth={2} aria-hidden />
        </button>
      </div>
    );
  }

  if (variant === "newsFooter") {
    return (
      <div className="feedback-news-footer">
        <span className="feedback-news-footer__label">{label}</span>
        <div className="feedback-news-footer__actions" role="group" aria-label="Rate this section">
          <button
            type="button"
            className="feedback-news-btn feedback-news-btn--like feedback-news-btn--lg"
            onClick={onLike}
            aria-label="Like"
          >
            <ThumbsUp size={NEWS_ICON_SIZE_LG} strokeWidth={2} aria-hidden />
          </button>
          <button
            type="button"
            className="feedback-news-btn feedback-news-btn--dislike feedback-news-btn--lg"
            onClick={onDislike}
            aria-label="Dislike"
          >
            <ThumbsDown size={NEWS_ICON_SIZE_LG} strokeWidth={2} aria-hidden />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-buttons">
      <span className="feedback-buttons__label">{label}</span>
      <button
        type="button"
        className="feedback-btn feedback-btn--like"
        onClick={onLike}
      >
        <ThumbsUp size={16} strokeWidth={2} aria-hidden />
        Like
      </button>
      <button
        type="button"
        className="feedback-btn feedback-btn--dislike"
        onClick={onDislike}
      >
        <ThumbsDown size={16} strokeWidth={2} aria-hidden />
        Dislike
      </button>
    </div>
  );
}

