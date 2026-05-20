import { useState } from "react";
import { Coins } from "lucide-react";
import CardEmptyState from "../CardEmptyState";
import FeedbackButtons from "./FeedbackButtons";
import type { PriceData } from "../../types/dashboard";
import { getPriceForCoin } from "../../utils/coins";

type PricesCardProps = {
  preferredCoins: string[];
  prices: Record<string, PriceData>;
  onLike: () => void;
  onDislike: () => void;
};

type CoinMeta = {
  label: string;
  imageUrl: string;
};

const COIN_META: Record<string, CoinMeta> = {
  bitcoin: {
    label: "Bitcoin",
    imageUrl:
      "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
  },
  ethereum: {
    label: "Ethereum",
    imageUrl:
      "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  },
  solana: {
    label: "Solana",
    imageUrl:
      "https://assets.coingecko.com/coins/images/4128/small/solana.png",
  },
  dogecoin: {
    label: "Dogecoin",
    imageUrl:
      "https://assets.coingecko.com/coins/images/5/small/dogecoin.png",
  },
};

const SPARKLINE_UP = "2,22 10,16 18,18 26,10 34,12 42,6 46,8";
const SPARKLINE_DOWN = "2,8 10,14 18,12 26,20 34,16 42,24 46,20";

function getCoinMeta(coin: string): CoinMeta {
  const key = coin.toLowerCase();
  if (COIN_META[key]) {
    return COIN_META[key];
  }

  const label = coin.charAt(0).toUpperCase() + coin.slice(1);
  return { label, imageUrl: "" };
}

function CoinAvatar({ label, imageUrl }: { label: string; imageUrl: string }) {
  const [failed, setFailed] = useState(!imageUrl);

  if (failed) {
    return (
      <span className="prices-table__coin-fallback" aria-hidden>
        {label.charAt(0)}
      </span>
    );
  }

  return (
    <img
      className="prices-table__coin-img"
      src={imageUrl}
      alt=""
      width={34}
      height={34}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

function PriceSparkline({ isUp }: { isUp: boolean }) {
  const stroke = isUp ? "#4ade80" : "#f87171";

  return (
    <svg className="prices-sparkline" viewBox="0 0 48 28" aria-hidden>
      <polyline
        points={isUp ? SPARKLINE_UP : SPARKLINE_DOWN}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function PricesCard({
  preferredCoins,
  prices,
  onLike,
  onDislike,
}: PricesCardProps) {
  return (
    <section className="dashboard-glass-card dashboard-card-fill prices-card">
      <div className="dashboard-card-header">
        <h2 className="dashboard-card-title">
          <span
            className="dashboard-card-title-icon prices-card__header-icon"
            aria-hidden
          >
            <Coins size={22} strokeWidth={1.75} />
          </span>
          Your Coins
        </h2>
        <span className="dashboard-card-badge dashboard-card-badge--purple">
          Live
        </span>
      </div>

      {preferredCoins.length === 0 ? (
        <CardEmptyState message="No coins selected yet. Update your preferences to track prices here." />
      ) : (
      <div className="prices-table">
        <div className="prices-table__head" role="row">
          <span className="prices-table__head-cell">Coin</span>
          <span className="prices-table__head-cell">Price</span>
          <span className="prices-table__head-cell">24h</span>
          <span className="prices-table__head-cell prices-table__head-cell--trend">
            Trend
          </span>
        </div>

        {preferredCoins.map((coin) => {
          const data = getPriceForCoin(prices, coin);
          const hasPrice = data.usd > 0;
          const isUp = data.usd_24h_change >= 0;
          const meta = getCoinMeta(coin);

          return (
            <div key={coin} className="prices-table__row" role="row">
              <div className="prices-table__coin">
                <CoinAvatar label={meta.label} imageUrl={meta.imageUrl} />
                <span className="prices-table__name">{meta.label}</span>
              </div>

              <span className="prices-table__price">
                {hasPrice ? `$${data.usd.toLocaleString()}` : "—"}
              </span>

              <span
                className={
                  isUp ? "prices-table__change--up" : "prices-table__change--down"
                }
              >
                {hasPrice
                  ? `${isUp ? "+" : ""}${data.usd_24h_change.toFixed(2)}%`
                  : "—"}
              </span>

              {hasPrice ? <PriceSparkline isUp={isUp} /> : <span aria-hidden>—</span>}
            </div>
          );
        })}
      </div>
      )}

      <FeedbackButtons
        variant="newsFooter"
        label="What do you think?"
        onLike={onLike}
        onDislike={onDislike}
      />
    </section>
  );
}


