"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Section } from "@/components/Section";
import {
  fetchUpcomingEvents,
  formatSlotLabel,
  type UpcomingEvent,
} from "@/lib/schedule-api";

export function UpcomingHomeSection() {
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
    <Section className="bg-forest">
      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-cream/70">
          Coming up
        </p>
        <h2 className="text-3xl text-cream sm:text-4xl">
          {events.length === 1 ? "Next session" : "Next sessions"}
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-cream/80">
          A dated spot you can book now — before browsing the full catalogue.
        </p>
      </div>
      <div
        className={`mt-10 grid gap-5 ${
          events.length > 1 ? "sm:grid-cols-2" : "mx-auto max-w-2xl"
        }`}
      >
        {events.map((event) => (
          <Link
            key={event.id}
            href={event.href}
            className="group flex overflow-hidden rounded-2xl bg-cream text-ink shadow-md transition-transform hover:-translate-y-0.5"
          >
            {event.image ? (
              <div className="relative hidden w-36 shrink-0 sm:block">
                <Image
                  src={event.image}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="144px"
                />
              </div>
            ) : null}
            <div className="flex flex-1 flex-col justify-center p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sage-dark">
                {formatSlotLabel(event.startsAt)}
              </p>
              <h3 className="mt-1.5 text-xl text-forest group-hover:text-clay-dark">
                {event.title}
              </h3>
              <p className="mt-1 text-sm text-muted">{event.locationLabel}</p>
              <p className="mt-3 text-sm font-semibold text-clay-dark">
                View details →
              </p>
            </div>
          </Link>
        ))}
      </div>
    </Section>
  );
}
