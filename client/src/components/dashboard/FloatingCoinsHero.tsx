type FloatingCoinsHeroProps = {
  compact?: boolean;
  aside?: boolean;
};

/** Decorative hero visual — CSS/SVG only, no external images */
export default function FloatingCoinsHero({
  compact = false,
  aside = false,
}: FloatingCoinsHeroProps) {
  const className = aside
    ? "floating-hero floating-hero--aside"
    : compact
      ? "floating-hero floating-hero--compact"
      : "floating-hero";

  return (
    <div className={className} aria-hidden>
      <div className="floating-hero__glow" />

      <svg
        className="floating-hero__orbit floating-hero__orbit--outer"
        viewBox="0 0 320 320"
      >
        <defs>
          <linearGradient id="orbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <circle
          cx="160"
          cy="160"
          r="148"
          fill="none"
          stroke="url(#orbitGrad)"
          strokeWidth="1"
          strokeDasharray="8 12"
          opacity="0.5"
        />
      </svg>

      <svg
        className="floating-hero__orbit floating-hero__orbit--inner"
        viewBox="0 0 260 260"
      >
        <circle
          cx="130"
          cy="130"
          r="118"
          fill="none"
          stroke="rgba(167, 139, 250, 0.35)"
          strokeWidth="1"
          opacity="0.6"
        />
      </svg>

      <div className="floating-hero__platform" />

      <div className="floating-hero__coin floating-hero__coin--main">
        <span className="floating-hero__coin-face">₿</span>
      </div>

      <div className="floating-hero__coin floating-hero__coin--eth">
        <span className="floating-hero__coin-face">Ξ</span>
      </div>
      <div className="floating-hero__coin floating-hero__coin--sol">
        <span className="floating-hero__coin-face">◎</span>
      </div>
      <div className="floating-hero__coin floating-hero__coin--ada">
        <span className="floating-hero__coin-face">₳</span>
      </div>

      <span className="floating-hero__particle floating-hero__particle--1" />
      <span className="floating-hero__particle floating-hero__particle--2" />
      <span className="floating-hero__particle floating-hero__particle--3" />
      <span className="floating-hero__particle floating-hero__particle--4" />
      <span className="floating-hero__particle floating-hero__particle--5" />
      <span className="floating-hero__particle floating-hero__particle--6" />

      <p className="floating-hero__label">Live market pulse</p>
    </div>
  );
}

