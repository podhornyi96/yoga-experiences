"use client";

import { useEffect, useState } from "react";
import { ExperienceCard } from "@/components/ExperienceCard";
import { UpcomingExperienceCard } from "@/components/UpcomingExperienceCard";
import type { Experience } from "@/data/experiences";
import {
  fetchUpcomingEvents,
  type UpcomingEvent,
} from "@/lib/schedule-api";

/** Featured dated sessions above a full catalogue row (avoids a half-empty grid). */
export function ExperiencesGrid({ items }: { items: Experience[] }) {
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

  return (
    <div className="space-y-4">
      {events && events.length > 0 ? (
        <div className="space-y-3">
          {events.map((event) => (
            <UpcomingExperienceCard key={event.id} event={event} />
          ))}
        </div>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 lg:gap-4">
        {items.map((exp) => (
          <ExperienceCard key={exp.slug} experience={exp} compact />
        ))}
      </div>
    </div>
  );
}
