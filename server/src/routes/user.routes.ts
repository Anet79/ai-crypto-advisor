import { Router } from "express";
import { protect, AuthRequest } from "../middleware/auth.middleware";
import { User } from "../models/User";

const router = Router();

router.get("/me", protect, async (req: AuthRequest, res) => {
  const user = await User.findById(req.userId).select("-password");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json(user);
});

export default router;