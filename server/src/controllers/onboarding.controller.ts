import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { Preference } from "../models/Preference";
import { User } from "../models/User";
import { normalizeCoinList } from "../utils/coins";

export const saveOnboarding = async (req: AuthRequest, res: Response) => {
  try {
    const { coins, investorType, contentTypes } = req.body;

    if (!coins || !investorType || !contentTypes) {
      return res.status(400).json({
        message: "coins, investorType and contentTypes are required",
      });
    }

    const preference = await Preference.findOneAndUpdate(
      { userId: req.userId },
      {
        userId: req.userId,
        coins: normalizeCoinList(coins),
        investorType,
        contentTypes,
      },
      {
        new: true,
        upsert: true,
      }
    );

    await User.findByIdAndUpdate(req.userId, {
      hasCompletedOnboarding: true,
    });

    return res.status(200).json({
      message: "Onboarding saved successfully",
      preference,
    });
  } catch (error) {
    console.error("SAVE ONBOARDING ERROR:", error);

    return res.status(500).json({
      message: "Failed to save onboarding",
    });
  }
};

export const getMyPreferences = async (req: AuthRequest, res: Response) => {
  try {
    const preference = await Preference.findOne({ userId: req.userId });

    if (!preference) {
      return res.status(404).json({
        message: "Preferences not found",
      });
    }

    return res.json(preference);
  } catch (error) {
    console.error("GET PREFERENCES ERROR:", error);

    return res.status(500).json({
      message: "Failed to get preferences",
    });
  }
};