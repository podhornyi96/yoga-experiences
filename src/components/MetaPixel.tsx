"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { isLocalHostname, isValidPixelId, trackPixelEvent } from "@/lib/pixel";
import { useConsent } from "@/lib/use-consent";

/**
 * Loads the Meta Pixel once consent is given and tracks SPA navigations.
 * WhatsApp booking clicks are reported as the standard Contact event.
 * Never injects on localhost so local testing does not pollute Events Manager.
 */
export function MetaPixel({ pixelId }: { pixelId: string }) {
  const pathname = usePathname();
  const { analyticsAllowed } = useConsent();
  const isFirstPageView = useRef(true);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!analyticsAllowed) {
      setEnabled(false);
      return;
    }
    if (!isValidPixelId(pixelId)) return;
    if (isLocalHostname(window.location.hostname)) return;
    setEnabled(true);
  }, [pixelId, analyticsAllowed]);

  useEffect(() => {
    if (!enabled) return;
    if (isFirstPageView.current) {
      // The inline snippet already fires PageView on first load.
      isFirstPageView.current = false;
      return;
    }
    trackPixelEvent("PageView");
  }, [pathname, enabled]);

  useEffect(() => {
    if (!enabled) return;

    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest("a");
      if (!link?.href.includes("wa.me")) return;
      trackPixelEvent("Contact");
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${pixelId}');
        fbq('track', 'PageView');
      `}
    </Script>
  );
}
