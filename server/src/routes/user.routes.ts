import { Router, Response } from "express";
import { protect, AuthRequest } from "../middleware/auth.middleware";
import { AuthServiceError, getCurrentUser } from "../services/authService";

const router = Router();

router.get("/me", protect, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const user = await getCurrentUser(userId);

    return res.json({ user });
  } catch (error) {
    if (error instanceof AuthServiceError) {
      return res.status(error.status).json({ message: error.clientMessage });
    }

    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
