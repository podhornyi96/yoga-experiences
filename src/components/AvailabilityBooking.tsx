"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BookingCTA, WhatsAppIcon } from "@/components/BookingCTA";
import { siteConfig, whatsappLink } from "@/config/site";
import type { Experience } from "@/data/experiences";
import { DEPOSIT_POLICY_SHORT } from "@/lib/booking-policy";
import {
  DEPOSIT_RATE,
  depositEur as calcDepositEur,
  remainingEur as calcRemainingEur,
} from "@/lib/group-pricing";
import { PRIVATE_FULL_PAY_POLICY_SHORT } from "@/lib/booking-policy";
import {
  createCheckoutSession,
  createHold,
  fetchAvailableSlots,
  formatSlotLabel,
  readPendingHold,
  savePendingHold,
  type PublicSlot,
} from "@/lib/schedule-api";

type Props = {
  experience: Experience;
  /** Prefill WA body without a selected date (people/mats/total already baked in). */
  bookingMessageBase: string;
  people: number;
  mats: number;
  /** Booking total in EUR (session + mats). */
  totalEur: number;
  /** Extra CTA classes for primary buttons. */
  className?: string;
  /**
   * Slot inventory slug (defaults to experience.slug).
   * Private + Tandem both use private-yoga-session.
   */
  scheduleSlug?: string;
  /** Fraction charged online (default group deposit 0.3; private = 1). */
  depositRate?: number;
  /** Required for private inventory checkout. */
  locationId?: string | null;
};

function formatMoney(amount: number): string {
  return Number.isInteger(amount) ? `€${amount}` : `€${amount.toFixed(2)}`;
}

function monthHeading(startsAt: string): string {
  const [datePart] = startsAt.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  if (!y || !m || !d) return datePart.slice(0, 7);
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d, 12)));
}

function groupSlotsByMonth(slots: PublicSlot[]): {
  key: string;
  label: string;
  slots: PublicSlot[];
}[] {
  const groups: {
    key: string;
    label: string;
    slots: PublicSlot[];
  }[] = [];
  for (const slot of slots) {
    const key = slot.startsAt.slice(0, 7);
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.slots.push(slot);
    } else {
      groups.push({ key, label: monthHeading(slot.startsAt), slots: [slot] });
    }
  }
  return groups;
}

/**
 * Schedule-aware booking entry.
 * - Loads slots; if none / API down → classic Book on WhatsApp.
 * - If slots exist + paymentsEnabled → soft hold → Stripe deposit checkout.
 * - If slots exist + payments off → soft hold → WhatsApp.
 */
export function AvailabilityBooking({
  experience,
  bookingMessageBase,
  people,
  mats,
  totalEur,
  className = "",
  scheduleSlug,
  depositRate = DEPOSIT_RATE,
  locationId = null,
}: Props) {
  const inventorySlug = scheduleSlug ?? experience.slug;
  const [slots, setSlots] = useState<PublicSlot[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const payments = siteConfig.paymentsEnabled;
  const fullPay = depositRate >= 1;
  const charge = calcDepositEur(totalEur, depositRate);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const pending = readPendingHold(inventorySlug);
      const data = await fetchAvailableSlots(
        inventorySlug,
        pending?.holdToken,
      );
      if (cancelled) return;
      setSlots(data?.slots ?? null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [inventorySlug]);

  if (loading) {
    return (
      <div className={className}>
        <button
          type="button"
          disabled
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-clay/70 px-8 py-3.5 text-base font-semibold text-cream"
        >
          Checking dates…
        </button>
      </div>
    );
  }

  const hasSlots = Boolean(slots && slots.length > 0);

  if (!hasSlots) {
    return (
      <div className={className}>
        <BookingCTA
          experience={experience}
          message={bookingMessageBase}
          size="lg"
          className="w-full"
        />
        <p className="mt-2 text-center text-xs text-muted">
          You&apos;ll be redirected to WhatsApp to confirm a date.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-clay px-8 py-3.5 text-base font-semibold text-cream shadow-sm transition-colors hover:bg-clay-dark"
      >
        Check availability
      </button>
      <p className="mt-2 text-center text-xs text-muted">
        {payments
          ? fullPay
            ? `Pick a date, then pay ${formatMoney(charge)} in full.`
            : `Pick a date, then pay a ${formatMoney(charge)} deposit (${Math.round(depositRate * 100)}%).`
          : "Pick a date, then continue on WhatsApp."}
      </p>
      {open ? (
        <AvailabilityModal
          experience={experience}
          inventorySlug={inventorySlug}
          slots={slots!}
          bookingMessageBase={bookingMessageBase}
          people={people}
          mats={mats}
          totalEur={totalEur}
          payments={payments}
          depositRate={depositRate}
          locationId={locationId}
          onClose={() => setOpen(false)}
          onSlotsChange={setSlots}
        />
      ) : null}
    </div>
  );
}

function AvailabilityModal({
  experience,
  inventorySlug,
  slots,
  bookingMessageBase,
  people,
  mats,
  totalEur,
  payments,
  depositRate,
  locationId,
  onClose,
  onSlotsChange,
}: {
  experience: Experience;
  inventorySlug: string;
  slots: PublicSlot[];
  bookingMessageBase: string;
  people: number;
  mats: number;
  totalEur: number;
  payments: boolean;
  depositRate: number;
  locationId: string | null;
  onClose: () => void;
  onSlotsChange: (slots: PublicSlot[] | null) => void;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const fullPay = depositRate >= 1;
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const pending = readPendingHold(inventorySlug);
    if (pending && slots.some((s) => s.id === pending.slotId)) {
      return pending.slotId;
    }
    return slots[0]?.id ?? null;
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const charge = calcDepositEur(totalEur, depositRate);
  const remaining = calcRemainingEur(totalEur, depositRate);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const selected = slots.find((s) => s.id === selectedId) ?? null;
  const monthGroups = useMemo(() => groupSlotsByMonth(slots), [slots]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const alternativeHref = whatsappLink(
    `Hi ${siteConfig.teacher.name}! I'd like to book "${experience.title}", but none of the listed dates work for me. Could we find another time?`,
  );

  async function refreshSlots() {
    const pending = readPendingHold(inventorySlug);
    const refreshed = await fetchAvailableSlots(
      inventorySlug,
      pending?.holdToken,
    );
    onSlotsChange(refreshed?.slots ?? []);
    if (refreshed?.slots?.length) {
      const preferred =
        pending && refreshed.slots.some((s) => s.id === pending.slotId)
          ? pending.slotId
          : refreshed.slots[0]?.id;
      setSelectedId(preferred ?? null);
    }
  }

  async function continueOnWhatsApp() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    const pending = readPendingHold(inventorySlug);
    const result = await createHold(
      selected.id,
      pending?.slotId === selected.id ? pending.holdToken : null,
    );
    if (!result.ok) {
      setError(result.error);
      setBusy(false);
      await refreshSlots();
      return;
    }

    const label = formatSlotLabel(result.data.slot.startsAt);
    const message = bookingMessageBase.replace(
      /Could you share the next available dates\?$/,
      `I'd like the slot on ${label} (Lisbon time).`,
    );
    const finalMessage =
      message === bookingMessageBase
        ? `${bookingMessageBase} Preferred slot: ${label} (Lisbon time).`
        : message;

    const href = whatsappLink(finalMessage);
    window.open(href, "_blank", "noopener,noreferrer");
    setBusy(false);
    onClose();
  }

  async function payOnline() {
    if (!selected) return;
    if (inventorySlug === "private-yoga-session" && !locationId) {
      setError("Choose a park location before paying.");
      return;
    }
    setBusy(true);
    setError(null);

    const pending = readPendingHold(inventorySlug);
    const hold = await createHold(
      selected.id,
      pending?.slotId === selected.id ? pending.holdToken : null,
    );
    if (!hold.ok) {
      setError(hold.error);
      setBusy(false);
      await refreshSlots();
      return;
    }

    savePendingHold({
      holdToken: hold.data.holdToken,
      slotId: hold.data.slot.id,
      slug: inventorySlug,
      people,
      mats,
      expiresAt: hold.data.expiresAt,
      locationId,
    });

    const checkout = await createCheckoutSession({
      holdToken: hold.data.holdToken,
      slotId: hold.data.slot.id,
      slug: inventorySlug,
      people,
      mats,
      locationId,
    });

    if (!checkout.ok) {
      setError(checkout.error);
      setBusy(false);
      await refreshSlots();
      return;
    }

    window.location.assign(checkout.data.url);
  }

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[90vh] w-full flex-col rounded-t-2xl border border-sand-dark bg-cream shadow-lg sm:max-w-md sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-sand px-6 pb-4 pt-6">
          <div>
            <h2 id={titleId} className="text-xl text-forest">
              Available dates
            </h2>
            <p className="mt-1 text-sm text-muted">
              {experience.title} · Lisbon time · held for{" "}
              {siteConfig.scheduleHoldMinutes} min after you continue
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-full px-2 py-1 text-sm text-muted hover:bg-sand hover:text-ink"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-5">
            {monthGroups.map((group) => (
              <section key={group.key}>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {group.label}
                </h3>
                <ul className="mt-2 space-y-1.5">
                  {group.slots.map((slot) => {
                    const active = slot.id === selectedId;
                    const yours = slot.status === "held";
                    return (
                      <li key={slot.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(slot.id)}
                          className={`w-full rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors ${
                            active
                              ? "border-clay bg-white text-forest ring-2 ring-clay/30"
                              : "border-sand-dark bg-white/60 text-ink hover:border-clay/50"
                          }`}
                        >
                          <span className="flex items-baseline justify-between gap-2">
                            <span>{formatSlotLabel(slot.startsAt)}</span>
                            {yours ? (
                              <span className="shrink-0 text-xs font-normal text-clay-dark">
                                Your hold
                              </span>
                            ) : null}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        </div>

        <div className="shrink-0 border-t border-sand px-6 pb-6 pt-4">
          {payments ? (
            <div className="space-y-1 text-sm">
              {fullPay ? (
                <>
                  <p className="font-medium text-forest">
                    Pay today: {formatMoney(charge)} (in full)
                  </p>
                  <p className="text-xs text-muted">
                    {PRIVATE_FULL_PAY_POLICY_SHORT}{" "}
                    <a
                      href="/terms/"
                      className="font-medium text-forest underline-offset-2 hover:underline"
                    >
                      Terms
                    </a>
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium text-forest">
                    Deposit today: {formatMoney(charge)} (
                    {Math.round(depositRate * 100)}%)
                  </p>
                  <p className="text-muted">
                    Due later: {formatMoney(remaining)} — paid on arrival or as
                    agreed
                  </p>
                  <p className="text-xs text-muted">
                    {DEPOSIT_POLICY_SHORT}{" "}
                    <a
                      href="/terms/"
                      className="font-medium text-forest underline-offset-2 hover:underline"
                    >
                      Terms
                    </a>
                  </p>
                </>
              )}
            </div>
          ) : null}

          {error ? (
            <p role="alert" className="mt-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            disabled={!selected || busy}
            onClick={() =>
              void (payments ? payOnline() : continueOnWhatsApp())
            }
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-clay px-6 py-3.5 text-sm font-semibold text-cream shadow-sm transition-colors hover:bg-clay-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {payments ? null : <WhatsAppIcon className="h-5 w-5" />}
            {busy
              ? payments
                ? "Starting checkout…"
                : "Holding slot…"
              : payments
                ? fullPay
                  ? `Pay ${formatMoney(charge)}`
                  : `Pay ${formatMoney(charge)} deposit`
                : "Continue on WhatsApp"}
          </button>

          <a
            href={alternativeHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block text-center text-sm font-medium text-forest underline-offset-2 hover:text-clay-dark hover:underline"
          >
            None of these dates work?
          </a>
        </div>
      </div>
    </div>,
    document.body,
  );
}
