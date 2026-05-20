import type { CorsOptions } from "cors";

const LOCAL_DEV_ORIGINS = ["http://localhost:5173", "http://localhost:5174"];

/** Strip trailing slashes so https://app.vercel.app/ matches the browser Origin header. */
function normalizeOrigin(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

/** CLIENT_URL supports one origin or a comma-separated list (production + previews). */
export function parseAllowedOrigins(): string[] {
  const fromClientUrl =
    process.env.CLIENT_URL?.split(",").map(normalizeOrigin).filter(Boolean) ??
    [];

  const fromClientUrls =
    process.env.CLIENT_URLS?.split(",").map(normalizeOrigin).filter(Boolean) ??
    [];

  return [...new Set([...fromClientUrl, ...fromClientUrls])];
}

const VERCEL_PREVIEW_ORIGIN =
  /^https:\/\/([a-z0-9-]+\.)*vercel\.app$/i;

export function buildCorsOptions(): CorsOptions {
  const isDevelopment = process.env.NODE_ENV !== "production";
  const allowedOrigins = new Set<string>();

  if (isDevelopment) {
    for (const origin of LOCAL_DEV_ORIGINS) {
      allowedOrigins.add(origin);
    }
  }

  for (const origin of parseAllowedOrigins()) {
    allowedOrigins.add(origin);
  }

  const allowVercelPreviews = process.env.ALLOW_VERCEL_PREVIEWS === "true";

  return {
    origin(origin, callback) {
      // Non-browser clients (health checks, server-to-server) send no Origin header.
      if (!origin) {
        callback(null, true);
        return;
      }

      const normalized = normalizeOrigin(origin);

      if (allowedOrigins.has(normalized)) {
        callback(null, true);
        return;
      }

      if (allowVercelPreviews && VERCEL_PREVIEW_ORIGIN.test(normalized)) {
        callback(null, true);
        return;
      }

      if (isDevelopment && normalized.startsWith("http://localhost:")) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };
}

export function getAllowedOriginsLabel(): string {
  const origins = parseAllowedOrigins();
  const extras: string[] = [];

  if (process.env.NODE_ENV !== "production") {
    extras.push(...LOCAL_DEV_ORIGINS);
  }

  if (process.env.ALLOW_VERCEL_PREVIEWS === "true") {
    extras.push("*.vercel.app (previews enabled)");
  }

  const combined = [...new Set([...origins, ...extras])];

  return combined.length > 0 ? combined.join(", ") : "(none configured — set CLIENT_URL on Render)";
}
