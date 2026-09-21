import Script from "next/script";
import { CONSENT_STORAGE_KEY, CONSENT_VERSION } from "@/lib/consent";
import { isValidGoogleAdsId } from "@/lib/google-ads";

/**
 * Google Ads tag in the initial HTML so Google's scanner can find it.
 * Cookies stay denied until the visitor accepts (Consent Mode).
 * Must live in the root layout: beforeInteractive is ignored elsewhere.
 */
export function GoogleAdsSnippet({ conversionId }: { conversionId: string }) {
  if (!isValidGoogleAdsId(conversionId)) return null;

  return (
    <>
      <Script id="google-ads-consent" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent', 'default', {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: 'denied',
            wait_for_update: 500
          });
          try {
            var stored = JSON.parse(localStorage.getItem('${CONSENT_STORAGE_KEY}') || 'null');
            if (stored && stored.v === ${CONSENT_VERSION} && stored.analytics === true) {
              gtag('consent', 'update', {
                ad_storage: 'granted',
                ad_user_data: 'granted',
                ad_personalization: 'granted',
                analytics_storage: 'granted'
              });
            }
          } catch (e) {}
          gtag('js', new Date());
          gtag('config', '${conversionId}');
        `}
      </Script>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${conversionId}`}
        strategy="beforeInteractive"
      />
    </>
  );
}
