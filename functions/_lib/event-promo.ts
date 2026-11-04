/**
 * Early bird pricing for trainer-organised events.
 * Promo is active when price + end date + max bookings are set,
 * Lisbon calendar day is on/before promo_ends_on, and seats remain.
 */

import { lisbonWallClock } from "./booking-lead-time";
import { nowIso } from "./slots";
import type { SlotRow } from "./types";

function regularPricePerPerson(
  templatePricePerPerson: number,
  slotPriceEur: number | null,
): number {
  if (
    slotPriceEur != null &&
    Number.isFinite(slotPriceEur) &&
    slotPriceEur > 0
  ) {
    return slotPriceEur;
  }
  return templatePricePerPerson;
}

export type NormalizedEventPromo = {
  promoPriceEur: number;
  promoEndsOn: string;
  promoMaxBookings: number;
};

export type PublicEventPromo = {
  /** Guest will be charged the promo price (offer live, or hold already claimed promo). */
  active: boolean;
  regularPricePerPersonEur: number;
  /** Price to charge / display as the current offer. */
  pricePerPersonEur: number;
  promoPriceEur: number | null;
  promoEndsOn: string | null;
};

function lisbonToday(now = new Date()): string {
  return lisbonWallClock(now).slice(0, 10);
}

export function normalizeEventPromoInput(input: {
  promoPriceEur?: number | null;
  promoEndsOn?: string | null;
  promoMaxBookings?: number | null;
}):
  | { ok: true; promo: NormalizedEventPromo | null }
  | { ok: false; error: string } {
  const hasPrice = input.promoPriceEur != null;
  const endsRaw = input.promoEndsOn?.trim() || null;
  const hasEnds = Boolean(endsRaw);
  const hasMax = input.promoMaxBookings != null;

  if (!hasPrice && !hasEnds && !hasMax) {
    return { ok: true, promo: null };
  }

  if (!hasPrice || !hasEnds || !hasMax) {
    return {
      ok: false,
      error:
        "Early bird requires promo price, end date, and max bookings together.",
    };
  }

  const promoPriceEur = Number(input.promoPriceEur);
  if (!Number.isFinite(promoPriceEur) || promoPriceEur <= 0) {
    return { ok: false, error: "Promo price must be a positive number (€)." };
  }

  if (!endsRaw || !/^\d{4}-\d{2}-\d{2}$/.test(endsRaw)) {
    return { ok: false, error: "Promo end date must be YYYY-MM-DD." };
  }

  const promoMaxBookings = Math.floor(Number(input.promoMaxBookings));
  if (!Number.isFinite(promoMaxBookings) || promoMaxBookings < 1) {
    return {
      ok: false,
      error: "Promo max bookings must be an integer ≥ 1.",
    };
  }

  return {
    ok: true,
    promo: {
      promoPriceEur: Math.round(promoPriceEur * 100) / 100,
      promoEndsOn: endsRaw,
      promoMaxBookings,
    },
  };
}

/** Config present (not necessarily still sellable). */
export function slotHasPromoConfig(slot: SlotRow): boolean {
  return (
    slot.promo_price_eur != null &&
    Number.isFinite(slot.promo_price_eur) &&
    slot.promo_price_eur > 0 &&
    typeof slot.promo_ends_on === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(slot.promo_ends_on) &&
    slot.promo_max_bookings != null &&
    Number.isFinite(slot.promo_max_bookings) &&
    slot.promo_max_bookings >= 1
  );
}

export function promoDateActive(slot: SlotRow, now = new Date()): boolean {
  if (!slotHasPromoConfig(slot) || !slot.promo_ends_on) return false;
  return lisbonToday(now) <= slot.promo_ends_on;
}

export function promoSpotsLeft(slot: SlotRow): number {
  if (!slotHasPromoConfig(slot) || slot.promo_max_bookings == null) return 0;
  const taken = Math.max(0, Number(slot.promo_seats_taken) || 0);
  return Math.max(0, slot.promo_max_bookings - taken);
}

/** Date ok and at least one early-bird seat still free. */
export function isPromoOfferActive(slot: SlotRow, now = new Date()): boolean {
  return promoDateActive(slot, now) && promoSpotsLeft(slot) > 0;
}

export function resolveEventPricing(
  slot: SlotRow,
  templatePricePerPerson: number,
  options: { honorPromoHold?: boolean } = {},
  now = new Date(),
): PublicEventPromo {
  const regularPricePerPersonEur = regularPricePerPerson(
    templatePricePerPerson,
    slot.price_eur,
  );

  const configured = slotHasPromoConfig(slot);
  const dateOk = configured ? promoDateActive(slot, now) : false;
  const offerLive = dateOk && promoSpotsLeft(slot) > 0;
  const active = Boolean(options.honorPromoHold) || offerLive;

  const promoPriceEur = configured ? Number(slot.promo_price_eur) : null;
  const charge =
    active && promoPriceEur != null && promoPriceEur > 0
      ? promoPriceEur
      : regularPricePerPersonEur;

  return {
    active: active && promoPriceEur != null,
    regularPricePerPersonEur,
    pricePerPersonEur: charge,
    promoPriceEur: configured ? promoPriceEur : null,
    promoEndsOn: configured ? slot.promo_ends_on : null,
  };
}

/**
 * Atomically claim early-bird seats for a new soft hold.
 * Returns whether the reservation should be marked promo=1.
 */
export async function tryClaimPromoSeats(
  db: D1Database,
  slot: SlotRow,
  people: number,
  now = new Date(),
): Promise<boolean> {
  if (!promoDateActive(slot, now) || slot.promo_max_bookings == null) {
    return false;
  }
  const seats = Math.max(1, Math.floor(people));
  const ts = nowIso();
  const claim = await db
    .prepare(
      `UPDATE slots
       SET promo_seats_taken = promo_seats_taken + ?,
           updated_at = ?
       WHERE id = ?
         AND kind = 'event'
         AND promo_price_eur IS NOT NULL
         AND promo_ends_on IS NOT NULL
         AND promo_max_bookings IS NOT NULL
         AND promo_seats_taken + ? <= promo_max_bookings`,
    )
    .bind(seats, ts, slot.id, seats)
    .run();

  return Boolean(claim.meta.changes);
}

export async function releasePromoSeats(
  db: D1Database,
  slotId: string,
  people: number,
): Promise<void> {
  const seats = Math.max(1, Math.floor(people));
  const ts = nowIso();
  await db
    .prepare(
      `UPDATE slots
       SET promo_seats_taken = CASE
         WHEN promo_seats_taken > ? THEN promo_seats_taken - ?
         ELSE 0
       END,
           updated_at = ?
       WHERE id = ? AND kind = 'event'`,
    )
    .bind(seats, seats, ts, slotId)
    .run();
}
