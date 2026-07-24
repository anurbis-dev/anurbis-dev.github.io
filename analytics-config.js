/**
 * Public analytics IDs for pixis.ink (safe to commit — same values appear in page HTML).
 *
 * Activate:
 * 1. Umami Cloud (https://cloud.umami.is) → Add website domain `pixis.ink`
 *    → paste Website ID below into umamiWebsiteId
 * 2. Optional Microsoft Clarity (https://clarity.microsoft.com) → New project
 *    → paste Project ID into clarityId
 *
 * Until IDs are non-empty, analytics.js is a no-op (no third-party scripts load).
 */
window.PIXIS_ANALYTICS = {
  umamiWebsiteId: "997ff877-adf0-4531-b6c3-d9e0e8bf42e3",
  umamiSrc: "https://cloud.umami.is/script.js",
  /** Restrict auto pageviews to production host (avoids noise from localhost previews). */
  umamiDomains: "pixis.ink,www.pixis.ink",
  clarityId: "xrjaug9ur9",
};
