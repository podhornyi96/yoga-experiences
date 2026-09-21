import { isLocalHostname } from "@/lib/pixel";

export type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

/** Google Ads conversion IDs look like AW-1234567890. */
export function isValidGoogleAdsId(id: string): boolean {
  return /^AW-\d+$/.test(id);
}

/** Conversion labels are the suffix after AW-id/ in send_to. */
export function isValidGoogleAdsLabel(label: string): boolean {
  return /^[A-Za-z0-9_-]+$/.test(label);
}

export function isBookingSuccessPath(pathname: string): boolean {
  return pathname.replace(/\/$/, "") === "/booking/success";
}

export function trackGoogleAdsPageView(conversionId: string, pathname: string) {
  if (typeof window === "undefined" || !window.gtag) return;
  if (isLocalHostname(window.location.hostname)) return;
  if (!isValidGoogleAdsId(conversionId)) return;
  window.gtag("event", "page_view", {
    send_to: conversionId,
    page_path: pathname,
  });
}

const CONSENT_DENIED = {
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  analytics_storage: "denied",
} as const;

const CONSENT_GRANTED = {
  ad_storage: "granted",
  ad_user_data: "granted",
  ad_personalization: "granted",
  analytics_storage: "granted",
} as const;

export function updateGoogleAdsConsent(granted: boolean) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("consent", "update", granted ? CONSENT_GRANTED : CONSENT_DENIED);
}

export function trackGoogleAdsPurchase(options: {
  conversionId: string;
  conversionLabel: string;
  transactionId?: string;
  value?: number;
  currency?: string;
}) {
  if (typeof window === "undefined" || !window.gtag) return;
  if (isLocalHostname(window.location.hostname)) return;
  if (!isValidGoogleAdsId(options.conversionId)) return;
  if (!isValidGoogleAdsLabel(options.conversionLabel)) return;

  const payload: Record<string, unknown> = {
    send_to: `${options.conversionId}/${options.conversionLabel}`,
    currency: options.currency ?? "EUR",
  };
  if (typeof options.value === "number" && Number.isFinite(options.value)) {
    payload.value = options.value;
  }
  if (options.transactionId) {
    payload.transaction_id = options.transactionId;
  }

  window.gtag("event", "conversion", payload);
}
