import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { generateToken } from "../utils/token";
import { toAuthUser, type AuthUser } from "../utils/toAuthUser";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export class AuthServiceError extends Error {
  status: number;
  clientMessage: string;

  constructor(status: number, clientMessage: string) {
    super(clientMessage);
    this.status = status;
    this.clientMessage = clientMessage;
  }
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ token: string; user: AuthUser }> {
  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const password = input.password;

  if (!name || !email || !password) {
    throw new AuthServiceError(400, "Name, email and password are required");
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new AuthServiceError(409, "User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  const token = generateToken(String(user._id));

  return { token, user: toAuthUser(user) };
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<{ token: string; user: AuthUser }> {
  const email = normalizeEmail(input.email);
  const password = input.password;

  if (!email || !password) {
    throw new AuthServiceError(400, "Email and password are required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new AuthServiceError(401, "Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new AuthServiceError(401, "Invalid email or password");
  }

  const token = generateToken(String(user._id));

  return { token, user: toAuthUser(user) };
}

export async function getCurrentUser(userId: string): Promise<AuthUser> {
  const user = await User.findById(userId).select("-password");

  if (!user) {
    throw new AuthServiceError(401, "Not authorized");
  }

  return toAuthUser(user);
}
