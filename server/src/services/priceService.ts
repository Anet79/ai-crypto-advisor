import axios from "axios";
import { normalizeCoinList, toCoingeckoId } from "../utils/coins";

type CoinPrice = { usd: number; usd_24h_change: number };
type GeckoPriceEntry = { usd?: number; usd_24h_change?: number };

const PRICE_CACHE_TTL_MS = 2 * 60 * 1000;
let cachedPrices: { data: Record<string, GeckoPriceEntry>; expiresAt: number } | null =
  null;

const buildEmptyPrices = (coins: string[]): Record<string, CoinPrice> =>
  Object.fromEntries(
    coins.map((coin) => [coin, { usd: 0, usd_24h_change: 0 }])
  );

const pickPrice = (
  data: Record<string, GeckoPriceEntry>,
  coin: string
): CoinPrice => {
  const geckoId = toCoingeckoId(coin);
  const entry = data[geckoId] ?? data[coin];

  if (!entry || typeof entry.usd !== "number") {
    return { usd: 0, usd_24h_change: 0 };
  }

  return {
    usd: entry.usd,
    usd_24h_change: entry.usd_24h_change ?? 0,
  };
};

const normalizePricesForCoins = (
  coins: string[],
  data: Record<string, GeckoPriceEntry>
): Record<string, CoinPrice> =>
  Object.fromEntries(coins.map((coin) => [coin, pickPrice(data, coin)]));

const hasAllPrices = (
  coins: string[],
  prices: Record<string, CoinPrice>
): boolean => coins.every((coin) => (prices[coin]?.usd ?? 0) > 0);

export const getCoinPrices = async (
  coins: string[]
): Promise<Record<string, CoinPrice>> => {
  if (coins.length === 0) {
    return {};
  }

  if (cachedPrices && cachedPrices.expiresAt > Date.now()) {
    const fromCache = normalizePricesForCoins(coins, cachedPrices.data);
    if (hasAllPrices(coins, fromCache)) {
      return fromCache;
    }
  }

  const geckoIds = normalizeCoinList(coins);

  try {
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price",
      {
        params: {
          ids: geckoIds.join(","),
          vs_currencies: "usd",
          include_24hr_change: true,
        },
        timeout: 15000,
      }
    );

    cachedPrices = {
      data: { ...cachedPrices?.data, ...response.data },
      expiresAt: Date.now() + PRICE_CACHE_TTL_MS,
    };

    return normalizePricesForCoins(coins, response.data);
  } catch (error: unknown) {
    const axiosError = error as { response?: { status?: number }; message?: string };
    const status = axiosError.response?.status;
    console.error("COINGECKO ERROR:", status || axiosError.message);

    if (cachedPrices) {
      console.log("Using cached CoinGecko prices after API error");
      const fromCache = normalizePricesForCoins(coins, cachedPrices.data);
      if (Object.values(fromCache).some((p) => p.usd > 0)) {
        return fromCache;
      }
    }

    console.log("CoinGecko unavailable — returning placeholder prices");
    return buildEmptyPrices(coins);
  }
};
