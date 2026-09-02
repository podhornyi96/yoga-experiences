"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useConsent } from "@/lib/use-consent";

export function CookieBanner() {
  const { bannerVisible, accept, decline } = useConsent();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!bannerVisible) return;
    dialogRef.current?.focus();
  }, [bannerVisible]);

  if (!bannerVisible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-forest/20 backdrop-blur-[4px]" aria-hidden />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-banner-title"
        aria-describedby="cookie-banner-copy"
        tabIndex={-1}
        className="pointer-events-auto absolute inset-x-0 bottom-0 outline-none"
      >
        <div className="mx-auto w-full max-w-6xl px-5 pb-5 sm:px-8 sm:pb-8">
          <div className="rounded-2xl border border-sand-dark bg-cream p-5 shadow-xl sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
              <div className="max-w-xl">
                <p
                  id="cookie-banner-title"
                  className="font-display text-xl text-forest"
                >
                  Cookies
                </p>
                <p
                  id="cookie-banner-copy"
                  className="mt-2 text-sm leading-relaxed text-muted"
                >
                  We use cookies to understand how people use the site and to
                  improve the experience. Some visits may be recorded in
                  anonymised form. You can change this anytime.{" "}
                  <Link
                    href="/privacy/"
                    className="font-medium text-forest underline decoration-sand-dark underline-offset-2 hover:text-clay-dark"
                  >
                    Privacy policy
                  </Link>
                </p>
              </div>
              <div className="flex w-full gap-3 sm:w-auto sm:shrink-0">
                <button
                  type="button"
                  onClick={decline}
                  className="flex-1 rounded-full border border-forest/25 px-6 py-3 text-sm font-medium text-forest transition-colors hover:border-forest hover:bg-white sm:flex-none"
                >
                  Decline
                </button>
                <button
                  type="button"
                  onClick={accept}
                  className="flex-1 rounded-full bg-clay px-6 py-3 text-sm font-medium text-cream transition-colors hover:bg-clay-dark sm:flex-none"
                >
                  Accept
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
