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

export const normalizeCoinList = (coins: string[]): string[] =>
  [...new Set(coins.map(toCoingeckoId))];
