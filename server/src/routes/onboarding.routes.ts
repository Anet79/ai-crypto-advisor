import { Router } from "express";
import {
  saveOnboarding,
  getMyPreferences,
} from "../controllers/onboarding.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.post("/", protect, saveOnboarding);
router.get("/me", protect, getMyPreferences);

export default router;