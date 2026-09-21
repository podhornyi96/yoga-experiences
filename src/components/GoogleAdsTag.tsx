"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { isLocalHostname } from "@/lib/pixel";
import {
  isBookingSuccessPath,
  isValidGoogleAdsId,
  isValidGoogleAdsLabel,
  trackGoogleAdsPageView,
  trackGoogleAdsPurchase,
  updateGoogleAdsConsent,
} from "@/lib/google-ads";
import { useConsent } from "@/lib/use-consent";

/**
 * Syncs cookie-banner choice into Google Consent Mode and tracks SPA
 * navigations. The tag itself is in GoogleAdsSnippet (initial HTML).
 */
export function GoogleAdsTag({
  conversionId,
  purchaseLabel,
}: {
  conversionId: string;
  purchaseLabel: string;
}) {
  const pathname = usePathname();
  const { analyticsAllowed, consent, ready } = useConsent();
  const isFirstPageView = useRef(true);
  const purchaseKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!isValidGoogleAdsId(conversionId)) return;
    if (isLocalHostname(window.location.hostname)) return;
    if (consent === null) return;
    updateGoogleAdsConsent(consent.analytics);
  }, [ready, consent, conversionId]);

  useEffect(() => {
    if (!ready) return;
    if (!isValidGoogleAdsId(conversionId)) return;
    if (isLocalHostname(window.location.hostname)) return;
    if (isFirstPageView.current) {
      isFirstPageView.current = false;
      return;
    }
    trackGoogleAdsPageView(conversionId, pathname);
  }, [pathname, ready, conversionId]);

  useEffect(() => {
    if (!analyticsAllowed) return;
    if (!isValidGoogleAdsLabel(purchaseLabel)) return;
    if (!isBookingSuccessPath(pathname)) return;
    if (isLocalHostname(window.location.hostname)) return;

    const sessionId =
      new URLSearchParams(window.location.search).get("session_id") ?? "";
    const dedupeKey = sessionId || pathname;
    if (purchaseKeyRef.current === dedupeKey) return;

    const fire = () => {
      if (!window.gtag) return false;
      if (purchaseKeyRef.current === dedupeKey) return true;
      purchaseKeyRef.current = dedupeKey;
      trackGoogleAdsPurchase({
        conversionId,
        conversionLabel: purchaseLabel,
        transactionId: sessionId || undefined,
      });
      return true;
    };

    if (fire()) return undefined;

    const timer = window.setInterval(() => {
      if (fire()) window.clearInterval(timer);
    }, 250);
    const timeout = window.setTimeout(() => window.clearInterval(timer), 8000);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(timeout);
    };
  }, [analyticsAllowed, pathname, conversionId, purchaseLabel]);

  return null;
}
