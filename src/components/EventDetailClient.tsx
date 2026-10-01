"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { WhatsAppIcon } from "@/components/BookingCTA";
import { Container } from "@/components/Container";
import { EventBookingPanel } from "@/components/EventBookingPanel";
import { ExperienceGallery } from "@/components/ExperienceGallery";
import { MapPinIcon } from "@/components/icons";
import { siteConfig, whatsappLink } from "@/config/site";
import {
  fetchEventDetail,
  formatSlotLabel,
  type PublicEventDetail,
} from "@/lib/schedule-api";

function durationLabel(minutes: number): string {
  if (minutes % 60 === 0) {
    const h = minutes / 60;
    return h === 1 ? "1 hour" : `${h} hours`;
  }
  if (minutes > 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  }
  return `${minutes} min`;
}

function AccessDirectionsModal({
  title,
  directions,
  mapsUrl,
  onClose,
}: {
  title: string;
  directions: string[];
  mapsUrl: string | null;
  onClose: () => void;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-4 sm:items-center"
      role="presentation"
      onMouseDown={(ev) => {
        if (ev.target === ev.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md overflow-hidden rounded-2xl bg-cream shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-sand-dark px-5 py-4">
          <div>
            <h2 id={titleId} className="text-xl text-forest">
              How to get inside?
            </h2>
            <p className="mt-1 text-sm text-muted">{title}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-full border border-sand-dark px-3 py-1 text-sm text-ink hover:bg-sand"
          >
            Close
          </button>
        </div>
        <div className="space-y-4 px-5 py-5 text-sm leading-relaxed text-ink">
          {directions.map((step, i) => (
            <p key={step} className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-forest text-xs font-semibold text-cream">
                {i + 1}
              </span>
              <span>{step}</span>
            </p>
          ))}
          {mapsUrl ? (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex font-semibold text-clay-dark hover:underline"
            >
              Open in Google Maps
            </a>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function EventDetailClient({ slotId }: { slotId: string }) {
  const [event, setEvent] = useState<PublicEventDetail | null | undefined>(
    undefined,
  );
  const [directionsOpen, setDirectionsOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await fetchEventDetail(slotId);
      if (!cancelled) setEvent(data);
    })();
    return () => {
      cancelled = true;
    };
  }, [slotId]);

  if (event === undefined) {
    return (
      <Container className="py-16">
        <p className="text-muted">Loading session…</p>
      </Container>
    );
  }

  if (!event) {
    return (
      <Container className="py-16 text-center">
        <h1 className="text-3xl text-forest">Session not found</h1>
        <p className="mt-2 text-muted">
          This date may have been cancelled or already booked.
        </p>
        <Link
          href="/experiences/"
          className="mt-6 inline-flex rounded-full bg-clay px-6 py-3 text-sm font-semibold text-cream hover:bg-clay-dark"
        >
          Browse experiences
        </Link>
      </Container>
    );
  }

  const priceLabel =
    event.pricePerPersonEur != null
      ? `€${event.pricePerPersonEur} per person`
      : "See booking";

  const askMessage = `Hi ${siteConfig.teacher.name}! I have a question about ${event.title} on ${formatSlotLabel(event.startsAt)}.`;
  const accessDirections = event.accessDirections ?? [];

  return (
    <>
      <Container className="pb-36 pt-8 sm:pb-32 sm:pt-12">
        <nav className="text-sm text-muted">
          <Link href="/" className="hover:text-clay-dark">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/experiences/" className="hover:text-clay-dark">
            Experiences
          </Link>
          <span className="mx-2">/</span>
          <span className="text-ink">{event.title}</span>
        </nav>

        <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            {event.images.length > 0 ? (
              <ExperienceGallery images={event.images} title={event.title} />
            ) : null}
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-sage-dark">
              Scheduled session
            </p>
            {event.seatsRemaining != null &&
            event.seatsRemaining > 0 &&
            event.seatsRemaining <= 3 ? (
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-sm bg-red-600 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white shadow-sm">
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 rounded-full bg-white/90"
                />
                Last spots left
              </p>
            ) : null}
            <h1 className="mt-2 text-3xl text-forest sm:text-4xl">
              {event.title}
            </h1>
            <p className="mt-3 text-lg font-medium text-ink">
              {formatSlotLabel(event.startsAt)}
            </p>
            <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted">
              <MapPinIcon className="h-4 w-4 shrink-0" />
              {event.locationUrl ? (
                <a
                  href={event.locationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-clay-dark hover:underline"
                >
                  {event.locationLabel}
                </a>
              ) : (
                event.locationLabel
              )}
              {accessDirections.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setDirectionsOpen(true)}
                  className="ml-1 font-semibold text-clay-dark hover:underline"
                >
                  How to get inside?
                </button>
              ) : null}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              {event.description}
            </p>

            <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-sand/60 px-3 py-2.5">
                <dt className="text-muted">Duration</dt>
                <dd className="mt-0.5 font-medium text-ink">
                  {durationLabel(event.durationMinutes)}
                </dd>
              </div>
              <div className="rounded-xl bg-sand/60 px-3 py-2.5">
                <dt className="text-muted">Price</dt>
                <dd className="mt-0.5 font-medium text-ink">{priceLabel}</dd>
              </div>
              <div className="rounded-xl bg-sand/60 px-3 py-2.5">
                <dt className="text-muted">Status</dt>
                <dd
                  className={`mt-0.5 font-medium capitalize ${
                    event.status === "open"
                      ? "text-emerald-700"
                      : "text-ink"
                  }`}
                >
                  {event.status}
                </dd>
              </div>
            </dl>

            {event.includes.length > 0 ? (
              <ul className="mt-5 space-y-1.5 text-sm text-muted">
                {event.includes.map((item) => (
                  <li key={item}>· {item}</li>
                ))}
              </ul>
            ) : null}

            <a
              href={whatsappLink(askMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-forest px-5 py-2.5 text-sm font-semibold text-forest transition-colors hover:bg-forest hover:text-cream"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Ask questions
            </a>
          </div>
        </div>
      </Container>

      <EventBookingPanel event={event} />

      {directionsOpen ? (
        <AccessDirectionsModal
          title={event.locationLabel}
          directions={accessDirections}
          mapsUrl={event.locationUrl}
          onClose={() => setDirectionsOpen(false)}
        />
      ) : null}
    </>
  );
}
