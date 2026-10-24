import Image from "next/image";
import Link from "next/link";
import { EventCountdown } from "@/components/EventCountdown";
import { ClockIcon, MapPinIcon } from "@/components/icons";
import {
  formatSlotLabel,
  type UpcomingEvent,
} from "@/lib/schedule-api";

function formatDuration(minutes: number): string {
  if (minutes % 60 === 0) return `${minutes / 60} h`;
  if (minutes > 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h} h ${m} min`;
  }
  return `${minutes} min`;
}

/** Featured dated session — wider + inverted so it reads above the catalogue. */
export function UpcomingExperienceCard({
  event,
}: {
  event: UpcomingEvent;
}) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl bg-forest text-cream shadow-md transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-lg sm:flex-row">
      {event.image ? (
        <div className="relative aspect-[2.2/1] shrink-0 overflow-hidden sm:aspect-auto sm:w-[32%] sm:max-w-xs sm:min-h-[8.25rem] lg:w-[26%]">
          <span className="absolute left-3 top-3 z-10 rounded-md bg-clay px-2.5 py-1 text-[11px] font-semibold tracking-wide text-cream shadow-sm">
            Next session
          </span>
          <Link href={event.href} className="absolute inset-0 block" tabIndex={-1}>
            <Image
              src={event.image}
              alt={event.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              sizes="(max-width: 640px) 100vw, 280px"
            />
          </Link>
        </div>
      ) : (
        <div className="relative flex aspect-[2.2/1] shrink-0 items-end bg-forest-deep p-3 sm:aspect-auto sm:w-[32%] sm:max-w-xs sm:min-h-[8.25rem] lg:w-[26%]">
          <span className="rounded-md bg-clay px-2.5 py-1 text-[11px] font-semibold tracking-wide text-cream">
            Next session
          </span>
        </div>
      )}
      <div className="flex flex-1 flex-col justify-center p-3 sm:px-5 sm:py-3">
        <p className="flex min-w-0 items-center gap-1.5 truncate text-xs font-semibold uppercase tracking-[0.14em] text-cream/70">
          <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{event.locationLabel}</span>
        </p>
        <h3 className="mt-0.5 text-lg text-cream sm:text-xl">
          <Link href={event.href} className="hover:text-sand">
            {event.title}
          </Link>
        </h3>
        <p className="mt-1 text-sm font-medium leading-snug text-cream">
          {formatSlotLabel(event.startsAt)}
          <EventCountdown
            startsAt={event.startsAt}
            className="font-medium text-sand"
          />
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-cream/75">
          {event.durationMinutes > 0 ? (
            <span className="inline-flex items-center gap-1">
              <ClockIcon className="h-3.5 w-3.5 shrink-0" />
              {formatDuration(event.durationMinutes)}
            </span>
          ) : null}
          <span>Open group · join this date</span>
        </p>
        <div className="mt-2.5 flex items-center justify-between gap-3 border-t border-cream/15 pt-2 sm:mt-3">
          <div className="min-w-0">
            {event.pricePerPersonEur != null ? (
              <span className="font-semibold text-cream">
                €{event.pricePerPersonEur}
                <span className="text-sm font-normal text-cream/70">
                  {" "}
                  / person
                </span>
              </span>
            ) : null}
          </div>
          <Link
            href={event.href}
            className="shrink-0 rounded-full bg-cream px-3 py-1 text-xs font-semibold text-forest transition-colors hover:bg-sand"
          >
            View details →
          </Link>
        </div>
      </div>
    </article>
  );
}
