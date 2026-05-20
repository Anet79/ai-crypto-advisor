import type { PriceData } from "../types/dashboard";

const COINGECKO_ID_ALIASES: Record<string, string> = {
  btc: "bitcoin",
  eth: "ethereum",
  sol: "solana",
  doge: "dogecoin",
};

export const toCoingeckoId = (coin: string): string => {
  const normalized = coin.trim().toLowerCase();
  return COINGECKO_ID_ALIASES[normalized] ?? normalized;
};

export const getPriceForCoin = (
  prices: Record<string, PriceData>,
  coin: string
): PriceData => {
  const geckoId = toCoingeckoId(coin);
  return prices[coin] ?? prices[geckoId] ?? { usd: 0, usd_24h_change: 0 };
};
