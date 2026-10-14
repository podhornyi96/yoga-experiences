"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchGiftSession,
  formatGiftExpiry,
  type GiftSession,
} from "@/lib/gifts";

export function GiftSuccessClient() {
  const [session, setSession] = useState<GiftSession | null>(null);
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get("session_id") ?? "";
    let cancelled = false;
    let attempts = 0;

    if (!sessionId) {
      const timer = window.setTimeout(() => {
        if (!cancelled) setGaveUp(true);
      }, 0);
      return () => {
        cancelled = true;
        window.clearTimeout(timer);
      };
    }

    async function poll() {
      attempts += 1;
      const result = await fetchGiftSession(sessionId);
      if (cancelled) return;
      if (result?.ready) {
        setSession(result);
        return;
      }
      if (attempts >= 12) {
        setGaveUp(true);
        return;
      }
      window.setTimeout(() => void poll(), 2000);
    }

    void poll();
    return () => {
      cancelled = true;
    };
  }, []);

  if (session?.ready) {
    const { gift } = session;
    const who = gift.people === 1 ? "1 person" : "2 people";
    const params = new URLSearchParams({ gift: gift.code });
    return (
      <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-sand-dark bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-muted">Certificate</p>
        <p className="mt-2 font-mono text-3xl tracking-[0.14em] text-forest">
          {gift.displayCode}
        </p>
        <p className="mt-4 text-ink">
          {gift.title} · {who}
        </p>
        <p className="mt-1 text-sm text-muted">
          For {gift.recipientName}. Valid until {formatGiftExpiry(gift.expiresAt)}.
        </p>
        <p className="mt-4 text-sm text-muted">
          {gift.deliverOn
            ? `We'll email ${gift.recipientName} on ${gift.deliverOn}. A copy is in your inbox now.`
            : gift.recipientEmail
              ? "A copy is on its way to you and to the recipient."
              : "A copy is in your inbox. Forward it whenever you're ready."}
        </p>
        <p className="mt-6">
          <Link
            href={`${gift.pagePath}?${params}`}
            className="font-medium text-forest underline-offset-2 hover:underline"
          >
            Preview the booking page
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-8 max-w-xl text-center text-sm text-ink">
      <p>
        {gaveUp
          ? "Payment received. If the code isn't on this page yet, it will be in your email."
          : "Payment received. Preparing your certificate…"}
      </p>
    </div>
  );
}
