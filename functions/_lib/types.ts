export type SlotStatus = "open" | "held" | "booked" | "cancelled" | "blocked";

/** Inventory = instant-book offers; event = trainer-organised dated session. */
export type SlotKind = "inventory" | "event";

export interface SlotRow {
  id: string;
  experience_slug: string;
  starts_at: string;
  day: string;
  status: SlotStatus;
  hold_token: string | null;
  hold_expires_at: string | null;
  /** Optional override (€ per person for fixed-price event templates). */
  price_eur: number | null;
  /** Optional override; null → template / SESSION_DURATION_MIN. */
  duration_minutes: number | null;
  kind: SlotKind;
  /** Confirmed + reserved seats for multi-book events. */
  seats_taken: number;
  created_at: string;
  updated_at: string;
}

export interface Env {
  DB: D1Database;
  ADMIN_PASSWORD?: string;
  ADMIN_SESSION_SECRET?: string;
  /** Soft-hold length in minutes. Defaults to 20. */
  SCHEDULE_HOLD_MINUTES?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  /** Canonical site origin for Checkout success/cancel URLs (no trailing slash). */
  SITE_URL?: string;
}

/**
 * Instant-book inventory (Schedule admin).
 * Private / Tandem share slug `private-yoga-session`.
 */
export const SCHEDULED_SLUGS = [
  "sunrise-yoga-lisbon",
  "sunset-yoga-ocean",
  "private-yoga-session",
] as const;

/**
 * Trainer-organised events (Events admin) — public `/events/?id=`.
 */
export const EVENT_SLUGS = [
  "yoga-studio-saldanha",
  "yoga-cascais-wooden-house",
  "yoga-sintra-forest",
] as const;

/** Single inventory slug for Private (€45) and Tandem (€80). */
export const PRIVATE_INVENTORY_SLUG = "private-yoga-session" as const;

export type ScheduledSlug = (typeof SCHEDULED_SLUGS)[number];
export type EventSlug = (typeof EVENT_SLUGS)[number];

export function isScheduledSlug(slug: string): slug is ScheduledSlug {
  return (SCHEDULED_SLUGS as readonly string[]).includes(slug);
}

export function isEventSlug(slug: string): slug is EventSlug {
  return (EVENT_SLUGS as readonly string[]).includes(slug);
}

/** Any slug that can appear on a slot row (inventory or event). */
export function isBookableSlug(slug: string): boolean {
  return isScheduledSlug(slug) || isEventSlug(slug);
}

export const DEFAULT_HOLD_MINUTES = 20;
export const TIMEZONE = "Europe/Lisbon";
