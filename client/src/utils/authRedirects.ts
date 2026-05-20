import type { User } from "../context/auth-context";
import { hasCompletedOnboarding } from "./onboardingAccess";

export function getAuthenticatedHomePath(
  completed: boolean | undefined,
  preferencesReady = false
): "/dashboard" | "/onboarding" {
  return completed && preferencesReady ? "/dashboard" : "/onboarding";
}

export function getAuthenticatedHomePathForUser(
  user: Pick<User, "hasCompletedOnboarding"> | null | undefined,
  hasPreferences = false
): "/dashboard" | "/onboarding" {
  return getAuthenticatedHomePath(
    hasCompletedOnboarding(user),
    hasPreferences
  );
}
