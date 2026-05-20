import { useEffect } from "react";

function isExternalHref(href: string): boolean {
  if (
    href.startsWith("/") ||
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  ) {
    return false;
  }

  try {
    const url = new URL(href, window.location.origin);
    return url.origin !== window.location.origin;
  } catch {
    return false;
  }
}

/**
 * Opens external links in a new tab so the SPA route is preserved in history.
 */
export function useExternalLinkGuard(containerSelector: string) {
  useEffect(() => {
    const container = document.querySelector(containerSelector);
    if (!container) {
      return;
    }

    const handleClick = (event: Event) => {
      const anchor = (event.target as Element | null)?.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      const href = anchor.getAttribute("href");
      if (!href || !isExternalHref(href)) {
        return;
      }

      if (anchor.target === "_blank") {
        anchor.rel = "noopener noreferrer";
        return;
      }

      event.preventDefault();
      window.open(href, "_blank", "noopener,noreferrer");
    };

    container.addEventListener("click", handleClick);
    return () => container.removeEventListener("click", handleClick);
  }, [containerSelector]);
}
