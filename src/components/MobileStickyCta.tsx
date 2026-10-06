"use client";

import {
  useEffect,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

/**
 * Fixed bottom CTA on mobile while the in-page anchor is off-screen.
 * Sets `data-mobile-sticky-cta` on body so WhatsAppFloat can yield space.
 */
export function MobileStickyCta({
  anchorRef,
  hidden = false,
  children,
}: {
  anchorRef: RefObject<HTMLElement | null>;
  /** e.g. hide while a booking modal is open */
  hidden?: boolean;
  children: ReactNode;
}) {
  const [offscreen, setOffscreen] = useState(false);

  useEffect(() => {
    const el = anchorRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setOffscreen(!entry.isIntersecting);
      },
      { threshold: 0.35, rootMargin: "0px 0px -5% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [anchorRef]);

  const active = !hidden && offscreen;

  useEffect(() => {
    if (!active) {
      delete document.body.dataset.mobileStickyCta;
      return;
    }
    document.body.dataset.mobileStickyCta = "1";
    return () => {
      delete document.body.dataset.mobileStickyCta;
    };
  }, [active]);

  if (!active) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-sand-dark bg-cream/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
      <div className="mx-auto max-w-lg">{children}</div>
    </div>
  );
}
