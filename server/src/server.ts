import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import onboardingRoutes from "./routes/onboarding.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import feedbackRoutes from "./routes/feedback.routes";
import { validateEnvAtStartup } from "./config/env";

dotenv.config();
validateEnvAtStartup();

const isDevelopment = process.env.NODE_ENV !== "production";

const allowedOrigins = new Set<string>();

if (isDevelopment) {
  allowedOrigins.add("http://localhost:5173");
  allowedOrigins.add("http://localhost:5174");
}

const clientUrl = process.env.CLIENT_URL?.trim();
if (clientUrl) {
  allowedOrigins.add(clientUrl);
}

const corsOrigins = [...allowedOrigins];

const app = express();

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
);
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/feedback", feedbackRoutes);


app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

const PORT = process.env.PORT || 5000;
connectDB();
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(
    `CORS allowed origins: ${
      corsOrigins.length > 0 ? corsOrigins.join(", ") : "(none configured)"
    }`
  );
});
