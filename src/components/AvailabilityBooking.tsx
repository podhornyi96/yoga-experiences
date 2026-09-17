"use client";

import { useEffect, useId, useRef, useState } from "react";
import { BookingCTA, WhatsAppIcon } from "@/components/BookingCTA";
import { siteConfig, whatsappLink } from "@/config/site";
import type { Experience } from "@/data/experiences";
import {
  createHold,
  fetchAvailableSlots,
  formatSlotLabel,
  type PublicSlot,
} from "@/lib/schedule-api";

type Props = {
  experience: Experience;
  /** Prefill WA body without a selected date (people/mats/total already baked in). */
  bookingMessageBase: string;
  /** Extra CTA classes for primary buttons. */
  className?: string;
};

/**
 * Schedule-aware booking entry.
 * - Loads slots; if none / API down → classic Book on WhatsApp.
 * - If slots exist → Check availability → pick date → soft hold → WhatsApp.
 */
export function AvailabilityBooking({
  experience,
  bookingMessageBase,
  className = "",
}: Props) {
  const [slots, setSlots] = useState<PublicSlot[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await fetchAvailableSlots(experience.slug);
      if (cancelled) return;
      setSlots(data?.slots ?? null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [experience.slug]);

  if (loading) {
    return (
      <div className={className}>
        <button
          type="button"
          disabled
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-clay/70 px-8 py-4 text-base font-semibold text-cream"
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
        <p className="mt-3 text-center text-xs text-muted">
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
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-clay px-8 py-4 text-base font-semibold text-cream shadow-sm transition-colors hover:bg-clay-dark"
      >
        Check availability
      </button>
      <p className="mt-3 text-center text-xs text-muted">
        Pick a date, then continue on WhatsApp.
      </p>
      {open ? (
        <AvailabilityModal
          experience={experience}
          slots={slots!}
          bookingMessageBase={bookingMessageBase}
          onClose={() => setOpen(false)}
          onSlotsChange={setSlots}
        />
      ) : null}
    </div>
  );
}

function AvailabilityModal({
  experience,
  slots,
  bookingMessageBase,
  onClose,
  onSlotsChange,
}: {
  experience: Experience;
  slots: PublicSlot[];
  bookingMessageBase: string;
  onClose: () => void;
  onSlotsChange: (slots: PublicSlot[] | null) => void;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(slots[0]?.id ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const alternativeHref = whatsappLink(
    `Hi ${siteConfig.teacher.name}! I'd like to book "${experience.title}", but none of the listed dates work for me. Could we find another time?`,
  );

  async function continueOnWhatsApp() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    const result = await createHold(selected.id);
    if (!result.ok) {
      setError(result.error);
      setBusy(false);
      const refreshed = await fetchAvailableSlots(experience.slug);
      onSlotsChange(refreshed?.slots ?? []);
      if (refreshed?.slots?.length) {
        setSelectedId(refreshed.slots[0]?.id ?? null);
      }
      return;
    }

    const label = formatSlotLabel(result.data.slot.startsAt);
    const message = bookingMessageBase.replace(
      /Could you share the next available dates\?$/,
      `I'd like the slot on ${label} (Lisbon time).`,
    );
    // If base message didn't end with the dates question, append.
    const finalMessage =
      message === bookingMessageBase
        ? `${bookingMessageBase} Preferred slot: ${label} (Lisbon time).`
        : message;

    const href = whatsappLink(finalMessage);
    window.open(href, "_blank", "noopener,noreferrer");
    setBusy(false);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl border border-sand-dark bg-cream p-6 shadow-lg sm:max-w-md sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3">
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

        <ul className="mt-5 space-y-2">
          {slots.map((slot) => {
            const active = slot.id === selectedId;
            return (
              <li key={slot.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(slot.id)}
                  className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
                    active
                      ? "border-clay bg-white text-forest ring-2 ring-clay/30"
                      : "border-sand-dark bg-white/60 text-ink hover:border-clay/50"
                  }`}
                >
                  {formatSlotLabel(slot.startsAt)}
                </button>
              </li>
            );
          })}
        </ul>

        {error ? (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          disabled={!selected || busy}
          onClick={() => void continueOnWhatsApp()}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-clay px-6 py-3.5 text-sm font-semibold text-cream shadow-sm transition-colors hover:bg-clay-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          <WhatsAppIcon className="h-5 w-5" />
          {busy ? "Holding slot…" : "Continue on WhatsApp"}
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
  );
}
