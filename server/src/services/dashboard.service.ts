/**
 * Dashboard data services: prices, news, memes, and personalized AI insights.
 *
 * AI insight fallback chain:
 * 1. In-memory cache (1 h TTL, keyed by userId + preferences)
 * 2. OpenRouter API (tries multiple models)
 * 3. Stale cache if OpenRouter fails
 * 4. Static demo insight templates
 */
import axios from "axios";
import fs from "fs";
import path from "path";
import { normalizeCoinList, toCoingeckoId } from "../utils/coins";

type CoinPrice = { usd: number; usd_24h_change: number };
type GeckoPriceEntry = { usd?: number; usd_24h_change?: number };

const PRICE_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes
let cachedPrices: { data: Record<string, CoinPrice>; expiresAt: number } | null =
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

/** Always return one entry per preferred coin, keyed by the user's coin id */
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
  } catch (error: any) {
    const status = error.response?.status;
    console.error("COINGECKO ERROR:", status || error.message);

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

export const getMarketNews = (coins: string[]) => {
  return coins.map((coin) => ({
    id: `${coin}-news`,
    title: `${coin.toUpperCase()} market update`,
    summary: `Latest market sentiment and updates related to ${coin}.`,
    source: "Static fallback",
  }));
};

// Do NOT use "openrouter/free" — it often routes to thinking models with content: null
const FREE_OPENROUTER_MODELS = [
  "google/gemma-4-26b-a4b-it:free",
  "liquid/lfm-2.5-1.2b-instruct:free",
  "google/gemma-4-31b-it:free",
  "minimax/minimax-m2.5:free",
];

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour — per-user insight cache

type InsightCacheEntry = { text: string; expiresAt: number };

const insightCache = new Map<string, InsightCacheEntry>();
// Deduplicates concurrent OpenRouter calls for the same cache key.
const insightRequestsInFlight = new Map<string, Promise<string>>();

/** Cache key: userId + normalized preferences (each user gets an isolated entry). */
const buildInsightCacheKey = (
  userId: string,
  coins: string[],
  investorType: string,
  contentTypes: string[]
): string => {
  const normalizedUserId = userId.trim();
  const normalizedCoins = normalizeCoinList(coins).sort().join(",");
  const normalizedInvestorType = investorType.trim().toLowerCase();
  const normalizedContentTypes = [...contentTypes]
    .map((type) => type.trim().toLowerCase())
    .filter(Boolean)
    .sort()
    .join(",");

  return `${normalizedUserId}|${normalizedCoins}|${normalizedInvestorType}|${normalizedContentTypes}`;
};

const getCachedInsight = (cacheKey: string): string | null => {
  const entry = insightCache.get(cacheKey);
  if (!entry || entry.expiresAt <= Date.now()) {
    if (entry) {
      insightCache.delete(cacheKey);
    }
    return null;
  }
  return entry.text;
};

const setCachedInsight = (cacheKey: string, text: string): void => {
  insightCache.set(cacheKey, {
    text,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const REASONING_PATTERNS = [
  /we need to produce/i,
  /let's craft/i,
  /let's count/i,
  /must be educational/i,
  /provide factual/i,
  /under 70 words/i,
  /ensure under/i,
];

const isValidInsight = (text: string): boolean => {
  const trimmed = text.trim();

  if (trimmed.length < 20 || trimmed.length > 600) {
    return false;
  }

  // Reject "thinking model" output that leaks chain-of-thought instead of a final answer.
  return !REASONING_PATTERNS.some((pattern) => pattern.test(trimmed));
};

const extractInsightText = (message: unknown): string | null => {
  if (!message || typeof message !== "object") {
    return null;
  }

  const content = (message as { content?: unknown }).content;

  if (typeof content === "string" && content.trim().length > 0) {
    return content.trim();
  }

  if (Array.isArray(content)) {
    const textParts = content
      .filter((part) => part?.type === "text" && typeof part.text === "string")
      .map((part) => part.text.trim())
      .filter(Boolean);

    if (textParts.length > 0) {
      return textParts.join("\n").trim();
    }
  }

  return null;
};

const getDemoInsight = (
  coins: string[],
  investorType: string,
  contentTypes: string[]
): string => {
  const coinList = coins.join(", ");
  const templates: Record<string, string[]> = {
    HODLer: [
      `For a long-term view on ${coinList}, focus on network activity and adoption trends rather than short-term price swings. As a HODLer, consistent dollar-cost averaging and clear exit rules can help you stay disciplined during volatile weeks.`,
      `Your ${coinList} watchlist fits a patient strategy: review on-chain metrics monthly, keep position sizes balanced, and avoid reacting to every headline. Long-term holders often benefit most from simplicity and risk limits.`,
    ],
    Trader: [
      `For active traders watching ${coinList}, define entry/exit levels before the session and respect stop-loss rules. Volume spikes and 24h momentum can signal opportunity, but overtrading during noise is a common pitfall.`,
      `With ${coinList} on your radar, compare price action across timeframes and track correlation with major assets. A trader edge often comes from preparation, not from chasing every move.`,
    ],
    default: [
      `Today's educational snapshot for ${coinList}: compare 24h change with weekly trend, check major news catalysts, and align decisions with your ${investorType} profile. Risk management matters more than predicting every move.`,
      `For ${coinList}, a practical approach is to track liquidity, volatility, and sentiment together. Your preferred content (${contentTypes.join(", ")}) suggests balancing data with context before any decision.`,
    ],
  };

  const pool = templates[investorType] ?? templates.default;
  const index =
    (coins.join("").length + investorType.length + new Date().getDate()) %
    pool.length;

  return pool[index];
};

const fetchAIInsight = async (
  coins: string[],
  investorType: string,
  contentTypes: string[],
  demoInsight: string,
  cacheKey: string
): Promise<string> => {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();

  if (!apiKey) {
    console.log("Missing OpenRouter API key, using demo insight");
    return demoInsight;
  }

  const cached = getCachedInsight(cacheKey);
  if (cached) {
    return cached;
  }

  const preferredModel = process.env.OPENROUTER_MODEL?.trim();
  const modelsToTry = preferredModel
    ? [preferredModel, ...FREE_OPENROUTER_MODELS.filter((m) => m !== preferredModel)]
    : FREE_OPENROUTER_MODELS;

  const prompt = {
    messages: [
      {
        role: "system",
        content:
          "You are a crypto market assistant. Reply with ONLY the final insight paragraph. No planning, no bullet steps, no meta commentary, no word-count notes. Maximum 70 words. Educational only, not financial advice.",
      },
      {
        role: "user",
        content: `Daily insight for a ${investorType} interested in ${coins.join(
          ", "
        )}. Content focus: ${contentTypes.join(", ")}.`,
      },
    ],
    max_tokens: 120,
    temperature: 0.5,
  };

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer": process.env.APP_URL || "http://localhost:5173",
    "X-Title": "AI Crypto Advisor",
  };

  for (const model of modelsToTry) {
    try {
      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        { ...prompt, model },
        { headers, timeout: 25000 }
      );

      const message = response.data?.choices?.[0]?.message;
      const rawText = extractInsightText(message);

      if (rawText && isValidInsight(rawText)) {
        console.log(`OpenRouter success with model: ${model}`);
        setCachedInsight(cacheKey, rawText);
        return rawText;
      }

      const routedModel = response.data?.model;
      const hasReasoningOnly =
        !message?.content &&
        typeof message?.reasoning === "string" &&
        message.reasoning.length > 0;

      console.log(
        `OpenRouter (${model}${routedModel ? ` -> ${routedModel}` : ""}) returned invalid/empty insight` +
          (hasReasoningOnly ? " (thinking model — no content field)" : "") +
          ", trying next model"
      );
    } catch (error: any) {
      const status = error.response?.status;
      const errData = error.response?.data?.error;
      const message = errData?.message || error.message;

      console.error(`OPENROUTER ERROR (${model}):`, error.response?.data || message);

      if (status === 401) {
        console.error(
          "OpenRouter API key rejected (401). Create a new key at openrouter.ai, update .env, then restart the server (Ctrl+C, npm run dev)."
        );
        break;
      }

      if (status === 429) {
        const retrySeconds =
          errData?.metadata?.retry_after_seconds ??
          errData?.metadata?.retry_after_seconds_raw ??
          3;
        await sleep(Math.min(retrySeconds, 10) * 1000);
      }
    }
  }

  const staleCached = insightCache.get(cacheKey);
  if (staleCached) {
    // Prefer expired cache over demo text when OpenRouter is temporarily unavailable.
    console.log("OpenRouter failed, using cached AI insight");
    return staleCached.text;
  }

  console.log("OpenRouter failed, using demo insight");
  return demoInsight;
};

export const getAIInsight = async (
  userId: string,
  coins: string[],
  investorType: string,
  contentTypes: string[]
): Promise<string> => {
  const cacheKey = buildInsightCacheKey(
    userId,
    coins,
    investorType,
    contentTypes
  );
  const demoInsight = getDemoInsight(coins, investorType, contentTypes);

  const cached = getCachedInsight(cacheKey);
  if (cached) {
    return cached;
  }

  let inFlight = insightRequestsInFlight.get(cacheKey);
  if (!inFlight) {
    inFlight = fetchAIInsight(
      coins,
      investorType,
      contentTypes,
      demoInsight,
      cacheKey
    ).finally(() => {
      insightRequestsInFlight.delete(cacheKey);
    });
    insightRequestsInFlight.set(cacheKey, inFlight);
  }

  return inFlight;
};
  

export type CryptoMeme = {
  id: string;
  title: string;
  imageUrl: string;
  caption: string;
};

let cachedMemes: CryptoMeme[] | null = null;

const loadCryptoMemes = (): CryptoMeme[] => {
  if (cachedMemes) {
    return cachedMemes;
  }

  const candidates = [
    path.join(__dirname, "../data/crypto-memes.json"),
    path.join(process.cwd(), "src/data/crypto-memes.json"),
  ];

  const filePath = candidates.find((candidate) => fs.existsSync(candidate));

  if (!filePath) {
    throw new Error("crypto-memes.json not found");
  }

  const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8")) as {
    memes: CryptoMeme[];
  };

  cachedMemes = parsed.memes;
  return cachedMemes;
};

export const getCryptoMeme = (): CryptoMeme => {
  const memes = loadCryptoMemes();
  return memes[Math.floor(Math.random() * memes.length)];
};