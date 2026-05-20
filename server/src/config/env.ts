/**
 * Validates required environment variables before the server accepts traffic.
 */
export const validateEnvAtStartup = (): void => {
  const jwtSecret = process.env.JWT_SECRET?.trim();

  if (!jwtSecret) {
    console.error(
      "FATAL: JWT_SECRET is not set. Add JWT_SECRET to your server .env file and restart."
    );
    process.exit(1);
  }

  const isProduction = process.env.NODE_ENV === "production";
  const clientUrl = process.env.CLIENT_URL?.trim();

  if (isProduction && !clientUrl && process.env.ALLOW_VERCEL_PREVIEWS !== "true") {
    console.warn(
      "WARNING: CLIENT_URL is not set in production. Browsers on Vercel will be blocked by CORS until you add your frontend URL to Render env vars."
    );
  }
};
