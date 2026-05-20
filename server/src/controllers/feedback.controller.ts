import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { Feedback } from "../models/Feedback";

export const saveFeedback = async (req: AuthRequest, res: Response) => {
  try {
    const { section, itemId, value } = req.body;

    if (!section || !value) {
      return res.status(400).json({
        message: "section and value are required",
      });
    }

    if (!["news", "prices", "insight", "meme"].includes(section)) {
      return res.status(400).json({
        message: "Invalid section",
      });
    }

    if (!["like", "dislike"].includes(value)) {
      return res.status(400).json({
        message: "Invalid feedback value",
      });
    }

    const feedback = await Feedback.create({
      userId: req.userId,
      section,
      itemId,
      value,
    });

    return res.status(201).json({
      message: "Feedback saved successfully",
      feedback,
    });
  } catch (error) {
    console.error("SAVE FEEDBACK ERROR:", error);

    return res.status(500).json({
      message: "Failed to save feedback",
    });
  }
};

export const getMyFeedback = async (req: AuthRequest, res: Response) => {
  try {
    const feedback = await Feedback.find({ userId: req.userId }).sort({
      createdAt: -1,
    });

    return res.json(feedback);
  } catch (error) {
    console.error("GET FEEDBACK ERROR:", error);

    return res.status(500).json({
      message: "Failed to get feedback",
    });
  }
};