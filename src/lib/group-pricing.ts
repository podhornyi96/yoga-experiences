/** Shared rates for optional yoga mats and live group / private pricing. */

export const MAT_PRICE_EUR = 5;
export const MAT_MAX = 6;

/** Default fraction charged online for deposit bookings (Sunset, Private, Tandem). */
export const DEPOSIT_RATE = 0.3;

/** Sunrise Yoga: full prepay online (early session / no-show risk). */
export const SUNRISE_DEPOSIT_RATE = 1;

/** Private / Tandem: same 30% deposit as Sunset. */
export const PRIVATE_DEPOSIT_RATE = DEPOSIT_RATE;

export type GroupPriceSchedule = "coastal" | "sintra" | "cascais";

/** Sunrise Yoga and Sunset Yoga by the Ocean. */
export function coastalPriceForPeople(people: number): number {
  if (people < 1) return 0;
  if (people === 1) return 50;
  if (people === 2) return 90;
  if (people <= 5) return 100;
  return 100 + (people - 5) * 15;
}

/** Yoga in Sintra Forest: €299 for 1–6 people, then +€40 per extra person. */
export function sintraPriceForPeople(people: number): number {
  if (people < 1) return 0;
  if (people <= 6) return 299;
  return 299 + (people - 6) * 40;
}

/** Wooden House Cascais: €120 for 1 person, then +€15 per extra person. */
export function cascaisPriceForPeople(people: number): number {
  if (people < 1) return 0;
  return 120 + (people - 1) * 15;
}

export function priceForSchedule(
  schedule: GroupPriceSchedule,
  people: number,
): number {
  if (schedule === "sintra") return sintraPriceForPeople(people);
  if (schedule === "cascais") return cascaisPriceForPeople(people);
  return coastalPriceForPeople(people);
}

export function matsSubtotal(mats: number): number {
  return Math.max(0, Math.min(mats, MAT_MAX)) * MAT_PRICE_EUR;
}

export function groupBookingTotal(people: number, mats: number): number {
  return coastalPriceForPeople(people) + matsSubtotal(mats);
}

export function privateSessionEur(people: number): number {
  if (people >= 2) return 80;
  return 45;
}

/** Online charge fraction for a catalog slug (keep in sync with functions/_lib/pricing). */
export function depositRateForSlug(slug: string): number {
  if (slug === "sunrise-yoga-lisbon") return SUNRISE_DEPOSIT_RATE;
  return DEPOSIT_RATE;
}

/** Stripe amount in the smallest currency unit (EUR cents). */
export function depositCents(
  totalEur: number,
  rate: number = DEPOSIT_RATE,
): number {
  if (!Number.isFinite(totalEur) || totalEur <= 0) return 0;
  return Math.round(totalEur * 100 * rate);
}

/** Deposit in euros for display (matches Stripe cents / 100). */
export function depositEur(
  totalEur: number,
  rate: number = DEPOSIT_RATE,
): number {
  return depositCents(totalEur, rate) / 100;
}

export function remainingEur(
  totalEur: number,
  rate: number = DEPOSIT_RATE,
): number {
  return Math.round((totalEur - depositEur(totalEur, rate)) * 100) / 100;
}
