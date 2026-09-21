"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { isValidCfWebAnalyticsToken } from "@/lib/cloudflare-web-analytics";
import { isLocalHostname } from "@/lib/pixel";

/**
 * Cookieless Cloudflare Web Analytics. Loads without cookie consent.
 * `spa: true` records client-side route changes in the Next.js app.
 * Never injects on localhost so local testing does not pollute the dashboard.
 */
export function CloudflareWebAnalytics({ token }: { token: string }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!isValidCfWebAnalyticsToken(token)) return;
    if (isLocalHostname(window.location.hostname)) return;
    setEnabled(true);
  }, [token]);

  if (!enabled) return null;

  const beacon = JSON.stringify({ token, spa: true });

  return (
    <Script
      defer
      src="https://static.cloudflareinsights.com/beacon.min.js"
      data-cf-beacon={beacon}
      strategy="afterInteractive"
    />
  );
}
