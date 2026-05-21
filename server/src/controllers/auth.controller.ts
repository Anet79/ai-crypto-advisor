import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  AuthServiceError,
  getCurrentUser,
  loginUser,
  registerUser,
} from "../services/authService";

function handleAuthError(res: Response, error: unknown, fallbackMessage: string) {
  if (error instanceof AuthServiceError) {
    return res.status(error.status).json({ message: error.clientMessage });
  }

  console.error(error);
  return res.status(500).json({ message: fallbackMessage });
}

export const signup = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    const result = await registerUser({ name, email, password });

    return res.status(201).json(result);
  } catch (error) {
    return handleAuthError(res, error, "Server error");
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await loginUser({ email, password });

    return res.json(result);
  } catch (error) {
    return handleAuthError(res, error, "Server error");
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const user = await getCurrentUser(userId);

    return res.json({ user });
  } catch (error) {
    return handleAuthError(res, error, "Server error");
  }
};
