import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { AuthRequest } from "../middleware/auth.middleware";

/** Issues a 7-day JWT containing only the user id (verified by protect middleware). */
const generateToken = (userId: string) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" }
  );
};

export const signup = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = generateToken(String(user._id));

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        hasCompletedOnboarding: user.hasCompletedOnboarding,
      },
    });
  } catch (error) {
    console.error(error);
  
    return res.status(500).json({
      message: "Signup failed",
      error,
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = generateToken(String(user._id));

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        hasCompletedOnboarding: user.hasCompletedOnboarding,
      },
    });
  } catch (error) {
    console.error(error);
  
    return res.status(500).json({
      message: "Login failed",
      error,
    });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Not authorized",
      });
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        hasCompletedOnboarding: user.hasCompletedOnboarding,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to get current user",
    });
  }
};