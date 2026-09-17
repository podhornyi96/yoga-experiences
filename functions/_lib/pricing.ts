/**
 * Server-side pricing for Stripe checkout.
 * Keep in sync with src/lib/group-pricing.ts + experience catalog.
 */

export const MAT_PRICE_EUR = 5;
export const MAT_MAX = 6;
export const DEPOSIT_RATE = 0.3;

export type GroupPriceSchedule = "coastal" | "sintra";

export type CheckoutCatalogEntry = {
  title: string;
  maxGuests: number;
  /** Variable schedule pricing, or fixed session price (Cascais). */
  schedule?: GroupPriceSchedule;
  fixedSessionEur?: number;
  mats: boolean;
};

/** Scheduled group experiences that can be paid via deposit checkout. */
export const CHECKOUT_CATALOG: Record<string, CheckoutCatalogEntry> = {
  "sunrise-yoga-lisbon": {
    title: "Sunrise Yoga",
    maxGuests: 30,
    schedule: "coastal",
    mats: true,
  },
  "sunset-yoga-ocean": {
    title: "Sunset Yoga by the Ocean",
    maxGuests: 8,
    schedule: "coastal",
    mats: true,
  },
  "yoga-cascais-wooden-house": {
    title: "Wooden House Yoga in Cascais",
    maxGuests: 6,
    fixedSessionEur: 180,
    mats: false,
  },
  "yoga-sintra-forest": {
    title: "Yoga in Sintra Forest",
    maxGuests: 20,
    schedule: "sintra",
    mats: false,
  },
};

export function coastalPriceForPeople(people: number): number {
  if (people < 1) return 0;
  if (people === 1) return 50;
  if (people === 2) return 90;
  if (people <= 5) return 100;
  return 100 + (people - 5) * 15;
}

export function sintraPriceForPeople(people: number): number {
  if (people < 1) return 0;
  if (people <= 6) return 299;
  return 299 + (people - 6) * 40;
}

export function priceForSchedule(
  schedule: GroupPriceSchedule,
  people: number,
): number {
  return schedule === "sintra"
    ? sintraPriceForPeople(people)
    : coastalPriceForPeople(people);
}

export function matsSubtotal(mats: number): number {
  return Math.max(0, Math.min(mats, MAT_MAX)) * MAT_PRICE_EUR;
}

export function depositCents(totalEur: number): number {
  if (!Number.isFinite(totalEur) || totalEur <= 0) return 0;
  return Math.round(totalEur * 100 * DEPOSIT_RATE);
}

export function depositEur(totalEur: number): number {
  return depositCents(totalEur) / 100;
}

export function remainingEur(totalEur: number): number {
  return Math.round((totalEur - depositEur(totalEur)) * 100) / 100;
}

export type QuoteResult =
  | {
      ok: true;
      title: string;
      people: number;
      mats: number;
      totalEur: number;
      depositEur: number;
      depositCents: number;
      remainingEur: number;
    }
  | { ok: false; error: string };

export function quoteCheckout(input: {
  slug: string;
  people: number;
  mats: number;
}): QuoteResult {
  const entry = CHECKOUT_CATALOG[input.slug];
  if (!entry) {
    return { ok: false, error: "This experience cannot be paid online." };
  }

  const people = Math.floor(input.people);
  if (!Number.isFinite(people) || people < 1 || people > entry.maxGuests) {
    return {
      ok: false,
      error: `People must be between 1 and ${entry.maxGuests}.`,
    };
  }

  let mats = Math.floor(input.mats);
  if (!Number.isFinite(mats) || mats < 0) mats = 0;
  if (!entry.mats) mats = 0;
  if (mats > MAT_MAX) {
    return { ok: false, error: `Maximum ${MAT_MAX} yoga mats.` };
  }
  if (mats > people) {
    return { ok: false, error: "You can't request more mats than people." };
  }

  const sessionEur =
    entry.fixedSessionEur != null
      ? entry.fixedSessionEur
      : priceForSchedule(entry.schedule!, people);
  const totalEur = sessionEur + (entry.mats ? matsSubtotal(mats) : 0);
  const cents = depositCents(totalEur);
  if (cents < 50) {
    return { ok: false, error: "Deposit amount is too small." };
  }

  return {
    ok: true,
    title: entry.title,
    people,
    mats,
    totalEur,
    depositEur: depositEur(totalEur),
    depositCents: cents,
    remainingEur: remainingEur(totalEur),
  };
}
