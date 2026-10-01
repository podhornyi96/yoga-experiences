"use client";

import { useState } from "react";
import Link from "next/link";
import { BookingCTA } from "@/components/BookingCTA";
import { siteConfig, whatsappLink } from "@/config/site";
import {
  createCheckoutSession,
  createHold,
  formatSlotLabel,
  savePendingHold,
  type PublicEventDetail,
} from "@/lib/schedule-api";

function formatMoney(amount: number): string {
  return Number.isInteger(amount) ? `€${amount}` : `€${amount.toFixed(2)}`;
}

/** Sticky book CTA for a trainer-organised event (1 person). */
export function EventBookingPanel({ event }: { event: PublicEventDetail }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const people = 1;
  const pricePerPerson = event.pricePerPersonEur ?? 0;
  const totalEur = pricePerPerson * people;
  const payments = siteConfig.paymentsEnabled;

  const bookMessage = `Hi ${siteConfig.teacher.name}! I'd like to book ${event.title} on ${formatSlotLabel(event.startsAt)} (${event.locationLabel}).`;

  const marketingHref = event.marketingSlug
    ? `/experiences/${event.marketingSlug}/`
    : null;

  if (!event.bookable || pricePerPerson <= 0) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-sand-dark bg-cream/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:px-6">
        <div className="mx-auto max-w-3xl">
          <BookingCTA message={bookMessage} size="lg" className="w-full" />
          {marketingHref ? (
            <p className="mt-2 text-center text-xs text-muted">
              <Link href={marketingHref} className="hover:underline">
                View experience page
              </Link>
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  async function onBook() {
    setError(null);
    setBusy(true);
    const hold = await createHold(event.id, null, people);
    if (!hold.ok) {
      setBusy(false);
      setError(hold.error);
      return;
    }

    if (!payments) {
      savePendingHold({
        holdToken: hold.data.holdToken,
        slotId: event.id,
        slug: event.slug,
        people,
        mats: 0,
        expiresAt: hold.data.expiresAt,
      });
      window.location.href = whatsappLink(bookMessage);
      return;
    }

    const checkout = await createCheckoutSession({
      holdToken: hold.data.holdToken,
      slotId: event.id,
      slug: event.slug,
      people,
      mats: 0,
    });
    if (!checkout.ok) {
      setBusy(false);
      setError(checkout.error);
      return;
    }

    savePendingHold({
      holdToken: hold.data.holdToken,
      slotId: event.id,
      slug: event.slug,
      people,
      mats: 0,
      expiresAt: hold.data.expiresAt,
    });
    window.location.href = checkout.data.url;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-sand-dark bg-cream/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:px-6">
      <div className="mx-auto max-w-3xl">
        {error ? (
          <p role="alert" className="mb-2 text-center text-sm text-red-700">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          disabled={busy}
          onClick={() => void onBook()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-clay px-6 py-3.5 text-base font-semibold text-cream shadow-sm transition-colors hover:bg-clay-dark disabled:opacity-60"
        >
          {busy ? "Starting checkout…" : `Pay & book · ${formatMoney(totalEur)}`}
        </button>
      </div>
    </div>
  );
}
