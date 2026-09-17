export type SlotStatus = "open" | "held" | "booked" | "cancelled" | "blocked";

export interface SlotRow {
  id: string;
  experience_slug: string;
  starts_at: string;
  day: string;
  status: SlotStatus;
  hold_token: string | null;
  hold_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Env {
  DB: D1Database;
  ADMIN_PASSWORD?: string;
  ADMIN_SESSION_SECRET?: string;
  /** Soft-hold length in minutes. Defaults to 20. */
  SCHEDULE_HOLD_MINUTES?: string;
}

/** Group experiences that support a public schedule in v1. */
export const SCHEDULED_SLUGS = [
  "sunrise-yoga-lisbon",
  "sunset-yoga-ocean",
  "yoga-cascais-wooden-house",
  "yoga-sintra-forest",
] as const;

export type ScheduledSlug = (typeof SCHEDULED_SLUGS)[number];

export function isScheduledSlug(slug: string): slug is ScheduledSlug {
  return (SCHEDULED_SLUGS as readonly string[]).includes(slug);
}

export const DEFAULT_HOLD_MINUTES = 20;
export const TIMEZONE = "Europe/Lisbon";
