import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";
import {
  primeAuthSessionCache,
  resetAuthSessionCache,
  restoreAuthSession,
} from "../services/authBootstrap";
import { checkPreferencesExist } from "../services/preferencesService";
import {
  reconcileUserWithPreferences,
  validateSessionFromApi,
} from "../services/sessionValidation";
import {
  registerAuthLogoutHandler,
  setAuthBootstrapRunning,
} from "../services/authSession";
import { canAccessDashboard as computeCanAccessDashboard } from "../utils/onboardingAccess";
import { AuthContext, type PreferencesState, type User } from "./auth-context";

function normalizeUser(raw: Record<string, unknown>): User {
  return {
    id: String(raw.id ?? raw._id ?? ""),
    name: String(raw.name ?? ""),
    email: String(raw.email ?? ""),
    hasCompletedOnboarding: Boolean(raw.hasCompletedOnboarding),
  };
}

function readStoredToken() {
  const token = localStorage.getItem("token");
  return token?.trim() || null;
}

function shouldRecoverFromBfcache(event: PageTransitionEvent) {
  return event.persisted;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(readStoredToken);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [preferencesState, setPreferencesState] =
    useState<PreferencesState>("idle");
  const [hasPreferences, setHasPreferences] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const revalidateRequestId = useRef(0);
  const skipVisibilityRevalidate = useRef(true);
  const revalidateSessionRef = useRef<(() => Promise<void>) | null>(null);

  const isAuthenticated = Boolean(user && token);
  const isPreferencesLoading =
    isAuthenticated && preferencesState === "loading";
  const isAccessReady =
    !isLoading &&
    !isRevalidating &&
    (!isAuthenticated || preferencesState === "ready");
  const canAccessDashboard = computeCanAccessDashboard({
    isAuthenticated,
    isAccessReady,
    user,
    hasPreferences,
  });

  const applyValidatedSession = useCallback(
    (validatedUser: User | null, preferencesExist: boolean) => {
      const storedToken = readStoredToken();

      if (validatedUser && storedToken) {
        setUser(validatedUser);
        setToken(storedToken);
        setHasPreferences(preferencesExist);
        setSessionError(null);
        return;
      }

      setUser(null);
      setToken(null);
      setHasPreferences(false);
      setSessionError(null);
    },
    []
  );

  const loadPreferencesForUser = useCallback(
    async (currentUser: User | null, requestId?: number) => {
      if (!currentUser || !readStoredToken()) {
        if (requestId === undefined || requestId === revalidateRequestId.current) {
          setHasPreferences(false);
          setPreferencesState("ready");
        }
        return;
      }

      setPreferencesState("loading");

      try {
        const preferencesExist = await checkPreferencesExist();

        if (requestId !== undefined && requestId !== revalidateRequestId.current) {
          return;
        }

        const reconciledUser = reconcileUserWithPreferences(
          currentUser,
          preferencesExist
        );

        applyValidatedSession(reconciledUser, preferencesExist);
      } catch {
        if (requestId === undefined || requestId === revalidateRequestId.current) {
          setHasPreferences(false);
          applyValidatedSession(
            reconcileUserWithPreferences(currentUser, false),
            false
          );
        }
      } finally {
        if (requestId === undefined || requestId === revalidateRequestId.current) {
          setPreferencesState("ready");
        }
      }
    },
    [applyValidatedSession]
  );

  const logout = useCallback(() => {
    resetAuthSessionCache();
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setHasPreferences(false);
    setPreferencesState("ready");
    setSessionError(null);
  }, []);

  const login = useCallback(
    (newToken: string, loggedInUser: User) => {
      const normalizedUser = normalizeUser(
        loggedInUser as unknown as Record<string, unknown>
      );
      const trimmedToken = newToken.trim();

      resetAuthSessionCache();
      localStorage.setItem("token", trimmedToken);
      primeAuthSessionCache(normalizedUser);
      setToken(trimmedToken);
      setUser(normalizedUser);
      setSessionError(null);
      void loadPreferencesForUser(normalizedUser);
    },
    [loadPreferencesForUser]
  );

  const signup = useCallback(
    (newToken: string, signedUpUser: User) => {
      login(newToken, signedUpUser);
    },
    [login]
  );

  const updateUser = useCallback((patch: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : null));
  }, []);

  const markPreferencesSaved = useCallback(() => {
    setHasPreferences(true);
    setPreferencesState("ready");
    updateUser({ hasCompletedOnboarding: true });
  }, [updateUser]);

  const runBootstrap = useCallback(async () => {
    const startedAt = Date.now();
    const MIN_LOADING_MS = 400;

    setIsLoading(true);
    setSessionError(null);
    setAuthBootstrapRunning(true);

    const storedToken = readStoredToken();

    if (!storedToken) {
      applyValidatedSession(null, false);
      setPreferencesState("ready");
      setAuthBootstrapRunning(false);
      setIsLoading(false);
      return;
    }

    try {
      const restoredUser = await restoreAuthSession();

      if (restoredUser) {
        setToken(storedToken);
        setUser(restoredUser);
        setSessionError(null);
        await loadPreferencesForUser(restoredUser);
      } else {
        applyValidatedSession(null, false);
        setPreferencesState("ready");
      }
    } catch {
      const tokenAfterError = readStoredToken();

      if (tokenAfterError) {
        setToken(tokenAfterError);
        setUser(null);
        setHasPreferences(false);
        setPreferencesState("ready");
        setSessionError(
          "Could not verify your session. Check that the server is running and try again."
        );
      } else {
        applyValidatedSession(null, false);
        setPreferencesState("ready");
      }
    } finally {
      const elapsed = Date.now() - startedAt;
      const remaining = MIN_LOADING_MS - elapsed;

      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }

      setAuthBootstrapRunning(false);
      setIsLoading(false);
    }
  }, [applyValidatedSession, loadPreferencesForUser]);

  const retrySessionRestore = useCallback(async () => {
    resetAuthSessionCache();
    await runBootstrap();
  }, [runBootstrap]);

  const revalidateSession = useCallback(async () => {
    const requestId = ++revalidateRequestId.current;
    const storedToken = readStoredToken();

    if (!storedToken) {
      applyValidatedSession(null, false);
      setPreferencesState("ready");
      setIsRevalidating(false);
      return;
    }

    flushSync(() => {
      setIsRevalidating(true);
      setPreferencesState("loading");
    });

    try {
      const { user: validatedUser, hasPreferences: preferencesExist } =
        await validateSessionFromApi();

      if (requestId !== revalidateRequestId.current) {
        return;
      }

      applyValidatedSession(validatedUser, preferencesExist);
    } catch {
      if (requestId !== revalidateRequestId.current) {
        return;
      }

      setHasPreferences(false);
      setUser((currentUser) =>
        currentUser
          ? reconcileUserWithPreferences(currentUser, false)
          : null
      );
    } finally {
      if (requestId === revalidateRequestId.current) {
        setPreferencesState("ready");
        setIsRevalidating(false);
      }
    }
  }, [applyValidatedSession]);

  const bootstrapStarted = useRef(false);

  useEffect(() => {
    revalidateSessionRef.current = revalidateSession;
  }, [revalidateSession]);

  useEffect(() => {
    registerAuthLogoutHandler(logout);
  }, [logout]);

  useEffect(() => {
    if (bootstrapStarted.current) {
      return;
    }
    bootstrapStarted.current = true;
    void runBootstrap();
  }, [runBootstrap]);

  useEffect(() => {
    skipVisibilityRevalidate.current = false;
  }, []);

  useLayoutEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (!shouldRecoverFromBfcache(event)) {
        return;
      }

      void revalidateSessionRef.current?.();
    };

    const handleVisibilityChange = () => {
      if (skipVisibilityRevalidate.current) {
        return;
      }

      if (document.visibilityState !== "visible") {
        return;
      }

      void revalidateSessionRef.current?.();
    };

    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isRevalidating,
        isPreferencesLoading,
        isAccessReady,
        hasPreferences,
        canAccessDashboard,
        sessionError,
        isAuthenticated,
        login,
        signup,
        logout,
        updateUser,
        markPreferencesSaved,
        retrySessionRestore,
        revalidateSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
