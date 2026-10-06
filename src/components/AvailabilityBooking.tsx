"use client";

import Image from "next/image";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BookingCTA, WhatsAppIcon } from "@/components/BookingCTA";
import { MobileStickyCta } from "@/components/MobileStickyCta";
import { siteConfig, whatsappLink } from "@/config/site";
import type { Experience } from "@/data/experiences";
import {
  SUNRISE_INVENTORY_SLUG,
  SUNRISE_LOCATIONS,
  type SunriseLocationId,
} from "@/data/sunrise-locations";
import { DEPOSIT_POLICY_SHORT, FULL_PAY_POLICY_SHORT } from "@/lib/booking-policy";
import {
  DEPOSIT_RATE,
  depositEur as calcDepositEur,
  remainingEur as calcRemainingEur,
} from "@/lib/group-pricing";
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
  /** Fraction charged online (default 0.3 deposit). */
  depositRate?: number;
  /** Required for private inventory checkout. */
  locationId?: string | null;
};

type LocationChoice = SunriseLocationId | "custom";
type Step = "when" | "where";

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
 * - Sunrise: When → Where (spot picker + custom via WhatsApp).
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
  const pickLocation = inventorySlug === SUNRISE_INVENTORY_SLUG;
  const [slots, setSlots] = useState<PublicSlot[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const ctaRef = useRef<HTMLButtonElement>(null);
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
        <p className="mb-3 rounded-xl border border-sand-dark bg-sand/40 px-4 py-3 text-sm leading-relaxed text-ink">
          No dates listed right now. Message on WhatsApp and we&apos;ll share
          the next openings.
        </p>
        <BookingCTA
          experience={experience}
          message={bookingMessageBase}
          size="lg"
          className="w-full"
          label="Ask for dates on WhatsApp"
          stickyMobile
        />
        <p className="mt-2 text-center text-xs text-muted">
          Usually reply within a few hours.
        </p>
      </div>
    );
  }

  const slotCount = slots!.length;

  return (
    <div className={className}>
      <button
        ref={ctaRef}
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-clay px-8 py-4 text-base font-semibold text-cream shadow-sm transition-colors hover:bg-clay-dark"
      >
        Check availability
      </button>
      <MobileStickyCta anchorRef={ctaRef} hidden={open}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-clay px-8 py-4 text-base font-semibold text-cream shadow-sm transition-colors hover:bg-clay-dark"
        >
          Check availability
        </button>
      </MobileStickyCta>
      <p className="mt-2 text-center text-xs text-muted">
        {slotCount === 1
          ? "1 upcoming date"
          : `${slotCount} upcoming dates`}
        {payments
          ? fullPay
            ? ` · pay ${formatMoney(charge)} in full`
            : ` · pay ${formatMoney(charge)} today (${Math.round(depositRate * 100)}% deposit), rest later`
          : " · then continue on WhatsApp"}
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
          pickLocation={pickLocation}
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
  locationId: locationIdProp,
  pickLocation,
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
  pickLocation: boolean;
  onClose: () => void;
  onSlotsChange: (slots: PublicSlot[] | null) => void;
}) {
  const titleId = useId();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const fullPay = depositRate >= 1;
  const [step, setStep] = useState<Step>("when");
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const pending = readPendingHold(inventorySlug);
    if (pending && slots.some((s) => s.id === pending.slotId)) {
      return pending.slotId;
    }
    return slots[0]?.id ?? null;
  });
  const [location, setLocation] = useState<LocationChoice | null>(
    pickLocation ? (SUNRISE_LOCATIONS[0]?.id ?? null) : null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const charge = calcDepositEur(totalEur, depositRate);
  const remaining = calcRemainingEur(totalEur, depositRate);

  useEffect(() => {
    // Focus the title, not ✕ — avoid accidental close on open (Clarity: open → ✕).
    titleRef.current?.focus();
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
  const spot =
    pickLocation && location && location !== "custom"
      ? (SUNRISE_LOCATIONS.find((p) => p.id === location) ?? null)
      : null;
  const resolvedLocationId = pickLocation
    ? location && location !== "custom"
      ? location
      : null
    : locationIdProp;

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

  function appendLocationToMessage(base: string, label: string): string {
    const withSlot = base.replace(
      /Could you share the next available dates\?$/,
      `I'd like the slot on ${label} (Lisbon time).`,
    );
    const withDate =
      withSlot === base
        ? `${base} Preferred slot: ${label} (Lisbon time).`
        : withSlot;
    if (!spot) return withDate;
    return `${withDate} Location: ${spot.label} (${spot.placeName}).`;
  }

  async function continueOnWhatsApp() {
    if (!selected) return;
    if (pickLocation && !spot) {
      setError("Choose a location to continue.");
      return;
    }
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
    const finalMessage = appendLocationToMessage(bookingMessageBase, label);
    const href = whatsappLink(finalMessage);
    window.open(href, "_blank", "noopener,noreferrer");
    setBusy(false);
    onClose();
  }

  async function payOnline() {
    if (!selected) return;
    if (
      (inventorySlug === "private-yoga-session" || pickLocation) &&
      !resolvedLocationId
    ) {
      setError(
        pickLocation
          ? "Choose a location before paying."
          : "Choose a park location before paying.",
      );
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
      locationId: resolvedLocationId,
    });

    const checkout = await createCheckoutSession({
      holdToken: hold.data.holdToken,
      slotId: hold.data.slot.id,
      slug: inventorySlug,
      people,
      mats,
      locationId: resolvedLocationId,
    });

    if (!checkout.ok) {
      setError(checkout.error);
      setBusy(false);
      await refreshSlots();
      return;
    }

    window.location.assign(checkout.data.url);
  }

  function openCustomWhatsApp() {
    if (!selected) return;
    const label = formatSlotLabel(selected.startsAt);
    const href = whatsappLink(
      `Hi ${siteConfig.teacher.name}! I'd like to book "${experience.title}" on ${label} (Lisbon time) at a custom location. Total from the site: ${formatMoney(totalEur)}.`,
    );
    window.open(href, "_blank", "noopener,noreferrer");
  }

  if (!mounted) return null;

  const showWhere = pickLocation && step === "where";

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
            <h2
              id={titleId}
              ref={titleRef}
              tabIndex={-1}
              className="text-xl text-forest outline-none"
            >
              {showWhere ? "Choose a spot" : "Available dates"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {experience.title} · Lisbon time
              {pickLocation ? null : (
                <>
                  {" "}
                  · held for {siteConfig.scheduleHoldMinutes} min after you
                  continue
                </>
              )}
            </p>
            {pickLocation ? (
              <div className="mt-3 flex flex-col gap-1">
                <div className="flex items-center gap-2 text-xs font-medium">
                  <span
                    className={
                      step === "when" ? "text-clay-dark" : "text-muted"
                    }
                  >
                    1. When
                  </span>
                  <span className="text-sand-dark">→</span>
                  <span
                    className={
                      step === "where" ? "text-clay-dark" : "text-muted"
                    }
                  >
                    2. Where
                  </span>
                </div>
                <p className="text-xs text-muted">
                  {step === "when"
                    ? "Pick a date, then choose your sunrise spot."
                    : "Choose where you'll meet for this sunrise."}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-xs text-muted">
                Select a date below, then continue to pay.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full text-sm text-muted hover:bg-sand hover:text-ink"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {showWhere ? (
            <div className="space-y-3">
              {selected ? (
                <p className="rounded-lg bg-sand/60 px-3 py-2 text-sm text-ink">
                  <span className="text-muted">Time · </span>
                  {formatSlotLabel(selected.startsAt)}
                </p>
              ) : null}
              <ul className="space-y-2.5">
                {SUNRISE_LOCATIONS.map((loc) => {
                  const active = location === loc.id;
                  return (
                    <li key={loc.id}>
                      <button
                        type="button"
                        onClick={() => setLocation(loc.id)}
                        className={`flex w-full gap-3 overflow-hidden rounded-xl border text-left transition-colors ${
                          active
                            ? "border-clay bg-white ring-2 ring-clay/30"
                            : "border-sand-dark bg-white/60 hover:border-clay/40"
                        }`}
                      >
                        <div className="relative h-20 w-24 shrink-0 bg-sand sm:h-[5.5rem] sm:w-28">
                          <Image
                            src={loc.image}
                            alt=""
                            fill
                            sizes="112px"
                            className="object-cover"
                          />
                        </div>
                        <span className="flex min-w-0 flex-1 flex-col justify-center py-2 pr-3">
                          <span className="text-sm font-semibold text-forest">
                            {loc.label}
                          </span>
                          <span className="mt-0.5 text-xs leading-snug text-muted">
                            {loc.vibe}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
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
                            className={`min-h-12 w-full rounded-lg border px-3 py-3 text-left text-sm font-medium transition-colors ${
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
          )}
        </div>

        <div className="shrink-0 border-t border-sand px-6 pb-6 pt-4">
          {!showWhere && payments ? (
            <div className="space-y-1 text-sm">
              {fullPay ? (
                <>
                  <p className="font-medium text-forest">
                    Pay today: {formatMoney(charge)} (in full)
                  </p>
                  <p className="text-xs text-muted">
                    {FULL_PAY_POLICY_SHORT}{" "}
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
                    Pay {formatMoney(charge)} today (
                    {Math.round(depositRate * 100)}% deposit)
                  </p>
                  <p className="text-muted">
                    {formatMoney(remaining)} due later — on arrival or as
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

          {pickLocation && step === "when" ? (
            <>
              <button
                type="button"
                disabled={!selected}
                onClick={() => {
                  setError(null);
                  setStep("where");
                }}
                className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-clay px-6 py-3.5 text-sm font-semibold text-cream shadow-sm transition-colors hover:bg-clay-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                Continue
              </button>
              <a
                href={alternativeHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block text-center text-sm font-medium text-forest underline-offset-2 hover:text-clay-dark hover:underline"
              >
                None of these dates work?
              </a>
            </>
          ) : pickLocation && step === "where" ? (
            <>
              <button
                type="button"
                disabled={!spot || busy}
                onClick={() =>
                  void (payments ? payOnline() : continueOnWhatsApp())
                }
                className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-clay px-6 py-3.5 text-sm font-semibold text-cream shadow-sm transition-colors hover:bg-clay-dark disabled:cursor-not-allowed disabled:opacity-60"
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
              <button
                type="button"
                onClick={openCustomWhatsApp}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-sand-dark bg-white px-6 py-3 text-sm font-medium text-forest transition-colors hover:border-clay/50 hover:bg-cream"
              >
                <WhatsAppIcon className="h-4 w-4" />
                Custom location — WhatsApp
              </button>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep("when");
                }}
                className="mt-3 block w-full text-center text-sm font-medium text-muted underline-offset-2 hover:text-forest hover:underline"
              >
                Back to dates
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={!selected || busy}
                onClick={() =>
                  void (payments ? payOnline() : continueOnWhatsApp())
                }
                className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-clay px-6 py-3.5 text-sm font-semibold text-cream shadow-sm transition-colors hover:bg-clay-dark disabled:cursor-not-allowed disabled:opacity-60"
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
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
