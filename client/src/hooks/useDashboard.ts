/**
 * Dashboard data hook. Only fetches when `enabled` is true (after route guards pass).
 * Missing preferences trigger a redirect instead of showing a dashboard error.
 */
import { useCallback, useEffect, useState } from "react";
import { isAxiosError } from "axios";
import {
  getDashboard,
  sendDashboardFeedback,
} from "../services/dashboardService";
import type {
  DashboardData,
  FeedbackTarget,
  FeedbackValue,
} from "../types/dashboard";
import { isMissingPreferencesError } from "../utils/onboardingAccess";

function getLoadErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string") {
      return message;
    }
  }

  return "Failed to load dashboard. Please try again.";
}

type UseDashboardOptions = {
  enabled?: boolean;
  onMissingPreferences?: () => void;
};

export function useDashboard({
  enabled = false,
  onMissingPreferences,
}: UseDashboardOptions = {}) {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const handleLoadError = useCallback(
    (err: unknown) => {
      if (isMissingPreferencesError(err)) {
        onMissingPreferences?.();
        return;
      }

      setError(getLoadErrorMessage(err));
    },
    [onMissingPreferences]
  );

  const loadDashboard = useCallback(async () => {
    if (!enabled) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await getDashboard();
      setDashboard(data);
    } catch (err) {
      handleLoadError(err);
    } finally {
      setLoading(false);
    }
  }, [enabled, handleLoadError]);

  const sendFeedback = async (
    target: FeedbackTarget,
    value: FeedbackValue,
    itemId?: string
  ) => {
    try {
      await sendDashboardFeedback(target, value, itemId);
      setFeedbackMessage("Feedback saved. Thank you!");
    } catch {
      setFeedbackMessage("Could not save feedback");
    } finally {
      setTimeout(() => setFeedbackMessage(""), 2000);
    }
  };

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;

    getDashboard()
      .then((data) => {
        if (!cancelled) {
          setDashboard(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          handleLoadError(err);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, handleLoadError]);

  return {
    dashboard,
    loading: enabled && loading,
    error: enabled ? error : null,
    feedbackMessage,
    loadDashboard,
    sendFeedback,
  };
}
