import { useEffect, useState } from "react";

/**
 * Browsers can restore a frozen SPA snapshot from the back-forward cache (bfcache).
 * Remounting the router clears stale route-level React state after bfcache restore.
 * Session revalidation is handled in AuthContext (pageshow / visibilitychange).
 */
export function useBfcacheRecovery(): number {
  const [recoveryKey, setRecoveryKey] = useState(0);

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setRecoveryKey((current) => current + 1);
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  return recoveryKey;
}
