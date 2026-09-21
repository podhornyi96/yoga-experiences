"use client";

import Image from "next/image";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BookingCTA, WhatsAppIcon } from "@/components/BookingCTA";
import { ExperienceDetails } from "@/components/ExperienceDetails";
import { siteConfig, whatsappLink } from "@/config/site";
import type { Experience } from "@/data/experiences";
import {
  PRIVATE_INVENTORY_SLUG,
  PRIVATE_LOCATIONS,
  type PrivateLocationId,
} from "@/data/private-locations";
import { PRIVATE_FULL_PAY_POLICY_SHORT } from "@/lib/booking-policy";
import {
  MAT_PRICE_EUR,
  privateSessionEur,
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

type LocationChoice = PrivateLocationId | "custom";
type Step = "when" | "where";

function formatMoney(amount: number) {
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

function groupSlotsByMonth(slots: PublicSlot[]) {
  const groups: { key: string; label: string; slots: PublicSlot[] }[] = [];
  for (const slot of slots) {
    const key = slot.startsAt.slice(0, 7);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.slots.push(slot);
    else groups.push({ key, label: monthHeading(slot.startsAt), slots: [slot] });
  }
  return groups;
}

export function PrivateBookingPanel({
  experience,
}: {
  experience: Experience;
}) {
  const people = experience.fixedGuests === 2 ? 2 : 1;
  const [mats, setMats] = useState(0);
  const [slots, setSlots] = useState<PublicSlot[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const effectiveMats = Math.min(mats, people);
  const total = privateSessionEur(people) + effectiveMats * MAT_PRICE_EUR;
  const title = people === 2 ? "Tandem Yoga" : "Private Yoga Session";

  const summary = useMemo(() => {
    const who = people === 1 ? "1 person" : "2 people";
    if (effectiveMats === 0) return who;
    return `${who} · ${effectiveMats === 1 ? "1 mat" : `${effectiveMats} mats`}`;
  }, [people, effectiveMats]);

  const waMessageBase = useMemo(() => {
    const matSuffix =
      effectiveMats === 0
        ? " (No yoga mats)"
        : effectiveMats === 1
          ? " (1 yoga mat)"
          : ` (${effectiveMats} yoga mats)`;
    return `Hi ${siteConfig.teacher.name}! I'd like to book ${title}${matSuffix}. Total: ${formatMoney(total)}. Could you share the next available dates?`;
  }, [title, effectiveMats, total]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const pending = readPendingHold(PRIVATE_INVENTORY_SLUG);
      const data = await fetchAvailableSlots(
        PRIVATE_INVENTORY_SLUG,
        pending?.holdToken,
      );
      if (cancelled) return;
      setSlots(data?.slots ?? null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const hasSlots = Boolean(slots && slots.length > 0);

  return (
    <>
      <p className="text-2xl font-semibold text-forest">{formatMoney(total)}</p>
      <p className="mt-0.5 text-sm text-muted">{summary}</p>
      {siteConfig.paymentsEnabled ? (
        <div className="mt-2 space-y-0.5 text-sm leading-snug">
          <p className="font-medium text-forest">
            Pay today: {formatMoney(total)} (in full)
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
        </div>
      ) : null}

      <div className="mt-4">
        <div className="flex items-baseline justify-between gap-3">
          <label
            htmlFor={`${experience.slug}-mats`}
            className="text-sm font-medium text-ink"
          >
            Yoga mats
          </label>
          <span className="text-xs text-muted">€{MAT_PRICE_EUR} each</span>
        </div>
        <div className="relative mt-1">
          <select
            id={`${experience.slug}-mats`}
            value={effectiveMats}
            onChange={(e) => setMats(Number(e.target.value))}
            className="w-full appearance-none rounded-lg border border-sand-dark bg-cream px-3 py-2 pr-10 text-base font-medium text-ink outline-none transition-colors focus:border-clay focus:ring-2 focus:ring-clay/25 sm:text-sm"
          >
            {Array.from({ length: people + 1 }, (_, count) => (
              <option key={count} value={count}>
                {count === 0
                  ? "None"
                  : count === 1
                    ? "1 mat"
                    : `${count} mats`}
              </option>
            ))}
          </select>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>

      <ExperienceDetails experience={experience} />

      <div className="mt-4">
        {loading ? (
          <button
            type="button"
            disabled
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-clay/70 px-8 py-3.5 text-base font-semibold text-cream"
          >
            Checking dates…
          </button>
        ) : hasSlots ? (
          <>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-clay px-8 py-3.5 text-base font-semibold text-cream shadow-sm transition-colors hover:bg-clay-dark"
            >
              Book this session
            </button>
            <p className="mt-2 text-center text-xs text-muted">
              Pick a time and park, then pay {formatMoney(total)} in full.
            </p>
          </>
        ) : (
          <>
            <BookingCTA
              experience={experience}
              message={waMessageBase}
              size="lg"
              className="w-full"
            />
            <p className="mt-2 text-center text-xs text-muted">
              No open dates online — message to arrange a time.
            </p>
          </>
        )}
      </div>

      <p className="mt-3 text-center text-xs text-muted">
        Custom location or different date?{" "}
        <a
          href={whatsappLink(
            `Hi ${siteConfig.teacher.name}! I'd like to book ${title} at a custom location (or another time). Total from the site for a park session is ${formatMoney(total)}.`,
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-forest underline-offset-2 hover:underline"
        >
          WhatsApp
        </a>
      </p>

      {open && slots ? (
        <PrivateBookingModal
          experience={experience}
          title={title}
          slots={slots}
          people={people}
          mats={effectiveMats}
          totalEur={total}
          onClose={() => setOpen(false)}
          onSlotsChange={setSlots}
        />
      ) : null}
    </>
  );
}

function PrivateBookingModal({
  experience,
  title,
  slots,
  people,
  mats,
  totalEur,
  onClose,
  onSlotsChange,
}: {
  experience: Experience;
  title: string;
  slots: PublicSlot[];
  people: number;
  mats: number;
  totalEur: number;
  onClose: () => void;
  onSlotsChange: (slots: PublicSlot[] | null) => void;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [step, setStep] = useState<Step>("when");
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const pending = readPendingHold(PRIVATE_INVENTORY_SLUG);
    if (pending && slots.some((s) => s.id === pending.slotId)) {
      return pending.slotId;
    }
    return slots[0]?.id ?? null;
  });
  const [location, setLocation] = useState<LocationChoice | null>(
    PRIVATE_LOCATIONS[0]?.id ?? null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const selected = slots.find((s) => s.id === selectedId) ?? null;
  const monthGroups = useMemo(() => groupSlotsByMonth(slots), [slots]);
  const park = PRIVATE_LOCATIONS.find((p) => p.id === location) ?? null;
  const payments = siteConfig.paymentsEnabled;

  useEffect(() => {
    setMounted(true);
  }, []);

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

  async function refreshSlots() {
    const pending = readPendingHold(PRIVATE_INVENTORY_SLUG);
    const refreshed = await fetchAvailableSlots(
      PRIVATE_INVENTORY_SLUG,
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

  async function pay() {
    if (!selected || !location || location === "custom") return;
    setBusy(true);
    setError(null);

    const pending = readPendingHold(PRIVATE_INVENTORY_SLUG);
    const hold = await createHold(
      selected.id,
      pending?.slotId === selected.id ? pending.holdToken : null,
    );
    if (!hold.ok) {
      setError(hold.error);
      setBusy(false);
      await refreshSlots();
      setStep("when");
      return;
    }

    savePendingHold({
      holdToken: hold.data.holdToken,
      slotId: hold.data.slot.id,
      slug: PRIVATE_INVENTORY_SLUG,
      people,
      mats,
      expiresAt: hold.data.expiresAt,
      locationId: location,
    });

    if (!payments) {
      const label = formatSlotLabel(hold.data.slot.startsAt);
      const href = whatsappLink(
        `Hi ${siteConfig.teacher.name}! I'd like to book ${title} at ${park?.label ?? "a park"} on ${label} (Lisbon time). Total: ${formatMoney(totalEur)}.`,
      );
      window.open(href, "_blank", "noopener,noreferrer");
      setBusy(false);
      onClose();
      return;
    }

    const checkout = await createCheckoutSession({
      holdToken: hold.data.holdToken,
      slotId: hold.data.slot.id,
      slug: PRIVATE_INVENTORY_SLUG,
      people,
      mats,
      locationId: location,
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
    const label = selected ? formatSlotLabel(selected.startsAt) : null;
    const href = whatsappLink(
      `Hi ${siteConfig.teacher.name}! I'd like to book ${title} at a custom location${label ? ` (preferred time: ${label}, Lisbon time)` : ""}. Park price on the site is ${formatMoney(totalEur)} — happy to discuss travel/price.`,
    );
    window.open(href, "_blank", "noopener,noreferrer");
    onClose();
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
              {step === "when" ? "Choose a time" : "Choose a park"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {title} · Lisbon time
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs font-medium">
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
          {step === "when" ? (
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
          ) : (
            <div className="space-y-3">
              {selected ? (
                <p className="rounded-lg bg-sand/60 px-3 py-2 text-sm text-ink">
                  <span className="text-muted">Time · </span>
                  {formatSlotLabel(selected.startsAt)}
                </p>
              ) : null}
              <ul className="space-y-2.5">
                {PRIVATE_LOCATIONS.map((loc) => {
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
          )}
        </div>

        <div className="shrink-0 border-t border-sand px-6 pb-6 pt-4">
          {error ? (
            <p role="alert" className="mb-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          {step === "when" ? (
            <>
              <button
                type="button"
                disabled={!selected}
                onClick={() => {
                  setError(null);
                  setStep("where");
                }}
                className="inline-flex w-full items-center justify-center rounded-full bg-clay px-6 py-3.5 text-sm font-semibold text-cream shadow-sm transition-colors hover:bg-clay-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                Continue
              </button>
              <a
                href={whatsappLink(
                  `Hi ${siteConfig.teacher.name}! I'd like to book ${title}, but none of the listed times work for me.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block text-center text-sm font-medium text-forest underline-offset-2 hover:text-clay-dark hover:underline"
              >
                None of these times work?
              </a>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={!location || location === "custom" || busy}
                onClick={() => void pay()}
                className="inline-flex w-full items-center justify-center rounded-full bg-clay px-6 py-3.5 text-sm font-semibold text-cream shadow-sm transition-colors hover:bg-clay-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy
                  ? "Starting checkout…"
                  : payments
                    ? `Pay ${formatMoney(totalEur)}`
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
                Back to times
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
