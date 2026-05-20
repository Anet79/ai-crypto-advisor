/**
 * Combines /auth/me with a preferences existence check.
 * Keeps the onboarding flag aligned with whether a Preference document exists.
 */
import type { User } from "../context/auth-context";
import { refreshAuthSession } from "./authBootstrap";
import { checkPreferencesExist } from "./preferencesService";

export type ValidatedSession = {
  user: User | null;
  hasPreferences: boolean;
};

export function reconcileUserWithPreferences(
  user: User,
  hasPreferences: boolean
): User {
  // DB flag and Preference document can drift — reconcile on every validation.
  if (hasPreferences && !user.hasCompletedOnboarding) {
    return { ...user, hasCompletedOnboarding: true };
  }

  if (!hasPreferences && user.hasCompletedOnboarding) {
    return { ...user, hasCompletedOnboarding: false };
  }

  return user;
}

export async function validateSessionFromApi(): Promise<ValidatedSession> {
  const user = await refreshAuthSession();

  if (!user) {
    return { user: null, hasPreferences: false };
  }

  const hasPreferences = await checkPreferencesExist();

  return {
    user: reconcileUserWithPreferences(user, hasPreferences),
    hasPreferences,
  };
}
