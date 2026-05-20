import { createContext } from "react";

export type User = {
  id: string;
  name: string;
  email: string;
  hasCompletedOnboarding: boolean;
};

export type PreferencesState = "idle" | "loading" | "ready";

export type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isRevalidating: boolean;
  isPreferencesLoading: boolean;
  isAccessReady: boolean;
  hasPreferences: boolean;
  canAccessDashboard: boolean;
  sessionError: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  signup: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (patch: Partial<User>) => void;
  markPreferencesSaved: () => void;
  retrySessionRestore: () => Promise<void>;
  revalidateSession: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
