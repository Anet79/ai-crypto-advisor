/**
 * Aggregates dashboard payload for an authenticated user.
 * Requires saved preferences — returns 404 otherwise.
 */
import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { Preference } from "../models/Preference";
import { getAIInsight } from "../services/aiInsightService";
import { getCryptoMeme } from "../services/memeService";
import { getMarketNews } from "../services/newsService";
import { getCoinPrices } from "../services/priceService";

export const getDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const preferences = await Preference.findOne({ userId: req.userId });

    if (!preferences) {
      return res.status(404).json({
        message: "User preferences not found",
      });
    }

    const prices = await getCoinPrices(preferences.coins);
    const news = getMarketNews(preferences.coins);
    const insight = await getAIInsight(
      String(req.userId),
      preferences.coins,
      preferences.investorType,
      preferences.contentTypes
    );
    const meme = getCryptoMeme();

    return res.json({
      preferences,
      prices,
      news,
      insight,
      meme,
    });
  } catch (error) {
    console.error("DASHBOARD ERROR:", error);

    return res.status(500).json({
      message: "Failed to load dashboard",
    });
  }
};
