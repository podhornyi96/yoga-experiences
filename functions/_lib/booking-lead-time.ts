/**
 * Public booking cutoffs (Lisbon wall time).
 * Admin create / manual booking paths do not use these.
 */

import type { SlotKind } from "./types";
import { TIMEZONE } from "./types";

/** Sunrise / Sunset / Private–Tandem inventory. */
export const INVENTORY_LEAD_HOURS = 12;

/** Trainer-organised events. */
export const EVENT_LEAD_HOURS = 3;

export function leadHoursForKind(kind: SlotKind): number {
  return kind === "event" ? EVENT_LEAD_HOURS : INVENTORY_LEAD_HOURS;
}

/** Lisbon wall clock `YYYY-MM-DDTHH:mm` for an instant. */
export function lisbonWallClock(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/**
 * Earliest starts_at still bookable online: now + leadHours, in Lisbon wall time.
 */
export function earliestBookableStartsAt(
  leadHours: number,
  now = new Date(),
): string {
  const threshold = new Date(now.getTime() + leadHours * 3_600_000);
  return lisbonWallClock(threshold);
}

/** True when starts_at is at least `leadHours` away (Lisbon). */
export function meetsLeadTime(
  startsAt: string,
  leadHours: number,
  now = new Date(),
): boolean {
  return startsAt >= earliestBookableStartsAt(leadHours, now);
}

export function meetsLeadTimeForKind(
  startsAt: string,
  kind: SlotKind,
  now = new Date(),
): boolean {
  return meetsLeadTime(startsAt, leadHoursForKind(kind), now);
}

export function leadTimeClosedMessage(kind: SlotKind): string {
  const hours = leadHoursForKind(kind);
  if (kind === "event") {
    return `Online booking closes ${hours} hours before the event.`;
  }
  return `Online booking closes ${hours} hours before the session.`;
}
