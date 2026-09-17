"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BookingCTA } from "@/components/BookingCTA";
import { siteConfig } from "@/config/site";
import {
  clearPendingHold,
  createCheckoutSession,
  createHold,
  readPendingHold,
  savePendingHold,
} from "@/lib/schedule-api";

function CancelActionsInner() {
  const searchParams = useSearchParams();
  const slugParam = searchParams.get("slug")?.trim() ?? "";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<ReturnType<typeof readPendingHold>>(
    null,
  );

  useEffect(() => {
    setPending(readPendingHold(slugParam || undefined) ?? readPendingHold());
  }, [slugParam]);

  const experienceHref = pending?.slug
    ? `/experiences/${pending.slug}/`
    : slugParam
      ? `/experiences/${slugParam}/`
      : "/experiences/";

  async function resumeCheckout() {
    const hold = pending ?? readPendingHold(slugParam || undefined);
    if (!hold) {
      setError("Your hold expired. Pick the date again on the experience page.");
      return;
    }
    setBusy(true);
    setError(null);

    const renewed = await createHold(hold.slotId, hold.holdToken);
    if (!renewed.ok) {
      clearPendingHold();
      setPending(null);
      setError(renewed.error);
      setBusy(false);
      return;
    }

    const next = {
      holdToken: renewed.data.holdToken,
      slotId: renewed.data.slot.id,
      slug: hold.slug,
      people: hold.people,
      mats: hold.mats,
      expiresAt: renewed.data.expiresAt,
    };
    savePendingHold(next);
    setPending(next);

    const checkout = await createCheckoutSession({
      holdToken: next.holdToken,
      slotId: next.slotId,
      slug: next.slug,
      people: next.people,
      mats: next.mats,
    });

    if (!checkout.ok) {
      setError(checkout.error);
      setBusy(false);
      return;
    }

    window.location.assign(checkout.data.url);
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
      {pending ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void resumeCheckout()}
          className="inline-flex items-center justify-center rounded-full bg-clay px-6 py-3 text-sm font-semibold text-cream shadow-sm transition-colors hover:bg-clay-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Resuming checkout…" : "Resume payment"}
        </button>
      ) : null}
      <Link
        href={experienceHref}
        className="inline-flex items-center justify-center rounded-full border border-sand-dark bg-white px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-clay/50"
      >
        {pending ? "Back to experience" : "Try again"}
      </Link>
      <BookingCTA
        variant="secondary"
        label="Message on WhatsApp"
        message={`Hi ${siteConfig.teacher.name}! I started a booking but didn't finish the deposit. Can we find a date?`}
      />
      {error ? (
        <p role="alert" className="basis-full text-center text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function BookingCancelActions() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center">
          <Link
            href="/experiences/"
            className="inline-flex items-center justify-center rounded-full bg-clay px-6 py-3 text-sm font-semibold text-cream"
          >
            Try again
          </Link>
        </div>
      }
    >
      <CancelActionsInner />
    </Suspense>
  );
}
