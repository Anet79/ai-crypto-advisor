/**
 * Backward-compatible re-exports. Prefer importing from dedicated service modules.
 */
export { getCoinPrices } from "./priceService";
export { getMarketNews } from "./newsService";
export { getCryptoMeme, type CryptoMeme } from "./memeService";
export { getAIInsight } from "./aiInsightService";
