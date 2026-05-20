/**
 * Shared axios client for the API.
 *
 * Request interceptor: attaches JWT from localStorage as Bearer token.
 * Response interceptor: logs out on 401 for protected routes (skipped during bootstrap).
 */
import axios from "axios";
import { getIsAuthBootstrapRunning, runAuthLogout } from "./authSession";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")?.trim();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

function shouldLogoutOn401(url: string | undefined) {
  if (!url) return false;

  // Session restore handles its own 401/403/404 — avoid double logout during bootstrap
  if (url.includes("/auth/me")) {
    return false;
  }

  const isPublicAuthRequest =
    url.includes("/auth/login") || url.includes("/auth/signup");

  return !isPublicAuthRequest;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url as string | undefined;

    if (
      status === 401 &&
      shouldLogoutOn401(requestUrl) &&
      !getIsAuthBootstrapRunning()
    ) {
      runAuthLogout();
    }

    return Promise.reject(error);
  }
);
