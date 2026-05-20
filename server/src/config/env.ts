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
};
