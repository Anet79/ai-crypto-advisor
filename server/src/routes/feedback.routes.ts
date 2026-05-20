import { Router } from "express";
import {
  saveFeedback,
  getMyFeedback,
} from "../controllers/feedback.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.post("/", protect, saveFeedback);
router.get("/me", protect, getMyFeedback);

export default router;