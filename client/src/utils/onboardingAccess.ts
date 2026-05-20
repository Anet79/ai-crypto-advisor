import { isAxiosError } from "axios";
import type { User } from "../context/auth-context";

export function hasCompletedOnboarding(
  user: Pick<User, "hasCompletedOnboarding"> | null | undefined
): boolean {
  return user?.hasCompletedOnboarding === true;
}

export function needsOnboarding(
  user: Pick<User, "hasCompletedOnboarding"> | null | undefined
): boolean {
  return !hasCompletedOnboarding(user);
}

export function canAccessDashboard({
  isAuthenticated,
  isAccessReady,
  user,
  hasPreferences,
}: {
  isAuthenticated: boolean;
  isAccessReady: boolean;
  user: Pick<User, "hasCompletedOnboarding"> | null | undefined;
  hasPreferences: boolean;
}): boolean {
  return (
    isAuthenticated &&
    isAccessReady &&
    hasCompletedOnboarding(user) &&
    hasPreferences
  );
}

export function isMissingPreferencesError(error: unknown): boolean {
  if (!isAxiosError(error)) {
    return false;
  }

  if (error.response?.status !== 404) {
    return false;
  }

  const message = error.response.data?.message;
  return (
    message === "User preferences not found" ||
    message === "Preferences not found"
  );
}
