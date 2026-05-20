import axios from "axios";
import { api } from "./api";
import type { User } from "../context/auth-context";

function normalizeUser(raw: Record<string, unknown>): User {
  return {
    id: String(raw.id ?? raw._id ?? ""),
    name: String(raw.name ?? ""),
    email: String(raw.email ?? ""),
    hasCompletedOnboarding: Boolean(raw.hasCompletedOnboarding),
  };
}

function isInvalidSessionStatus(status: number | undefined) {
  return status === 401 || status === 403 || status === 404;
}

function getStoredToken() {
  const token = localStorage.getItem("token");
  return token?.trim() || null;
}

async function fetchMeOnce(): Promise<User> {
  const response = await api.get("/auth/me");

  if (!response.data?.user) {
    throw new Error("Missing user in /auth/me response");
  }

  return normalizeUser(response.data.user as Record<string, unknown>);
}

async function fetchMeWithRetry(): Promise<User> {
  try {
    return await fetchMeOnce();
  } catch (error) {
    const isNetworkError = axios.isAxiosError(error) && !error.response;

    if (!isNetworkError) {
      throw error;
    }

    return fetchMeOnce();
  }
}

type SessionCache =
  | { status: "idle" }
  | { status: "loading"; promise: Promise<User | null> }
  | { status: "ready"; user: User | null };

let sessionCache: SessionCache = { status: "idle" };

export function resetAuthSessionCache() {
  sessionCache = { status: "idle" };
}

export function primeAuthSessionCache(user: User | null) {
  sessionCache = { status: "ready", user };
}

async function resolveSessionFromApi(): Promise<User | null> {
  const token = getStoredToken();

  if (!token) {
    return null;
  }

  try {
    return await fetchMeWithRetry();
  } catch (error) {
    if (
      axios.isAxiosError(error) &&
      isInvalidSessionStatus(error.response?.status)
    ) {
      localStorage.removeItem("token");
      return null;
    }

    if (
      error instanceof Error &&
      error.message === "Missing user in /auth/me response"
    ) {
      localStorage.removeItem("token");
      return null;
    }

    throw error;
  }
}

/**
 * Restores session once per page load (cached).
 * Survives React StrictMode remounts — the second mount reads the cached result.
 */
export function restoreAuthSession(): Promise<User | null> {
  const token = getStoredToken();

  if (!token) {
    sessionCache = { status: "ready", user: null };
    return Promise.resolve(null);
  }

  if (sessionCache.status === "ready") {
    return Promise.resolve(sessionCache.user);
  }

  if (sessionCache.status === "loading") {
    return sessionCache.promise;
  }

  const promise = resolveSessionFromApi()
    .then((user) => {
      sessionCache = { status: "ready", user };
      return user;
    })
    .catch((error) => {
      sessionCache = { status: "idle" };
      throw error;
    });

  sessionCache = { status: "loading", promise };
  return promise;
}

/**
 * Always fetches the current user from the API and refreshes the session cache.
 * Used after login/signup and when returning from bfcache or browser back navigation.
 */
export async function refreshAuthSession(): Promise<User | null> {
  resetAuthSessionCache();

  try {
    const user = await resolveSessionFromApi();
    sessionCache = { status: "ready", user };
    return user;
  } catch {
    sessionCache = { status: "idle" };
    throw new Error("Failed to refresh auth session");
  }
}
