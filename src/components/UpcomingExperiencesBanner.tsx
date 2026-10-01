"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  fetchUpcomingEvents,
  formatSlotLabel,
  type UpcomingEvent,
} from "@/lib/schedule-api";

/** Non-catalog banner above the experiences grid. */
export function UpcomingExperiencesBanner() {
  const [events, setEvents] = useState<UpcomingEvent[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await fetchUpcomingEvents(2);
      if (!cancelled) setEvents(list);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!events || events.length === 0) return null;

  return (
    <div className="mb-6 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sage-dark">
        Next session{events.length > 1 ? "s" : ""}
      </p>
      {events.map((event) => (
        <Link
          key={event.id}
          href={event.href}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-forest/15 bg-forest px-4 py-3 text-cream transition-colors hover:bg-forest-deep sm:px-5"
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold sm:text-base">
              {formatSlotLabel(event.startsAt)}
              <span className="mx-2 text-cream/50">·</span>
              {event.title}
            </p>
            <p className="mt-0.5 truncate text-xs text-cream/75 sm:text-sm">
              {event.locationLabel}
              {event.pricePerPersonEur != null
                ? ` · €${event.pricePerPersonEur}/person`
                : ""}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-cream px-3 py-1.5 text-xs font-semibold text-forest">
            View details
          </span>
        </Link>
      ))}
    </div>
  );
}
