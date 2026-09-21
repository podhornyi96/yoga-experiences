/**
 * Teacher capacity: overlapping published slots are OK until hold/booking.
 * After hold or booking, conflicting open/held offers are blocked using
 * session duration + post-session travel buffer.
 */

import type { SlotRow } from "./types";

/** Minutes of practice for each scheduled experience. */
export const SESSION_DURATION_MIN: Record<string, number> = {
  "sunrise-yoga-lisbon": 60,
  "sunset-yoga-ocean": 60,
  "yoga-cascais-wooden-house": 120,
  "yoga-sintra-forest": 150,
  "private-yoga-session": 75,
};

export const DEFAULT_SESSION_DURATION_MIN = 75;

/** Travel / recovery buffer after session end before the next booking. */
export const POST_SESSION_BUFFER_MIN = 75;

export function sessionDurationMin(slug: string): number {
  return SESSION_DURATION_MIN[slug] ?? DEFAULT_SESSION_DURATION_MIN;
}

/** Parse `YYYY-MM-DDTHH:mm` into minutes since an arbitrary epoch (sortable). */
export function startsAtToMinutes(startsAt: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(startsAt);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const hh = Number(m[4]);
  const mm = Number(m[5]);
  if (
    !Number.isFinite(y) ||
    !Number.isFinite(mo) ||
    !Number.isFinite(d) ||
    !Number.isFinite(hh) ||
    !Number.isFinite(mm)
  ) {
    return null;
  }
  // UTC calendar math is fine — we only compare Lisbon wall times as abstract clocks.
  return Date.UTC(y, mo - 1, d, hh, mm) / 60_000;
}

export function busyWindow(slot: {
  experience_slug: string;
  starts_at: string;
}): { startMin: number; endMin: number } | null {
  const startMin = startsAtToMinutes(slot.starts_at);
  if (startMin == null) return null;
  const duration = sessionDurationMin(slot.experience_slug);
  const endMin = startMin + duration + POST_SESSION_BUFFER_MIN;
  return { startMin, endMin };
}

export function windowsOverlap(
  a: { startMin: number; endMin: number },
  b: { startMin: number; endMin: number },
): boolean {
  return a.startMin < b.endMin && b.startMin < a.endMin;
}

export function slotsConflict(a: SlotRow, b: SlotRow): boolean {
  if (a.id === b.id) return false;
  const wa = busyWindow(a);
  const wb = busyWindow(b);
  if (!wa || !wb) return false;
  return windowsOverlap(wa, wb);
}

/** Booked or held slots occupy the teacher's calendar. */
export function isBusyStatus(status: string): boolean {
  return status === "booked" || status === "held";
}
