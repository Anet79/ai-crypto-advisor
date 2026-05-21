import axios from "axios";
import { normalizeCoinList } from "../utils/coins";

const FREE_OPENROUTER_MODELS = [
  "google/gemma-4-26b-a4b-it:free",
  "liquid/lfm-2.5-1.2b-instruct:free",
  "google/gemma-4-31b-it:free",
  "minimax/minimax-m2.5:free",
];

const CACHE_TTL_MS = 60 * 60 * 1000;

type InsightCacheEntry = { text: string; expiresAt: number };

const insightCache = new Map<string, InsightCacheEntry>();
const insightRequestsInFlight = new Map<string, Promise<string>>();

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
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { status?: number; data?: { error?: { message?: string; metadata?: Record<string, number> } } };
        message?: string;
      };
      const status = axiosError.response?.status;
      const errData = axiosError.response?.data?.error;
      const message = errData?.message || axiosError.message;

      console.error(`OPENROUTER ERROR (${model}):`, axiosError.response?.data || message);

      if (status === 401) {
        console.error(
          "OpenRouter API key rejected (401). Create a new key at openrouter.ai, update .env, then restart the server."
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
