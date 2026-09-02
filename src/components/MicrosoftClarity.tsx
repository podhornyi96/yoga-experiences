"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { isValidClarityId } from "@/lib/clarity";
import { isLocalHostname } from "@/lib/pixel";
import { useConsent } from "@/lib/use-consent";

/**
 * Loads Microsoft Clarity once analytics consent is given.
 * Never injects on localhost so local testing does not pollute the project.
 */
export function MicrosoftClarity({ projectId }: { projectId: string }) {
  const { analyticsAllowed } = useConsent();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!analyticsAllowed) {
      setEnabled(false);
      return;
    }
    if (!isValidClarityId(projectId)) return;
    if (isLocalHostname(window.location.hostname)) return;
    setEnabled(true);
  }, [projectId, analyticsAllowed]);

  if (!enabled) return null;

  return (
    <Script id="microsoft-clarity" strategy="afterInteractive">
      {`
        (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "${projectId}");
      `}
    </Script>
  );
}
