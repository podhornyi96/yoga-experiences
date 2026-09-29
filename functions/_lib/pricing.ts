/**
 * Server-side pricing for Stripe checkout.
 * Keep in sync with src/lib/group-pricing.ts + experience catalog.
 */

export const MAT_PRICE_EUR = 5;
export const MAT_MAX = 6;
/** Default online charge for group experiences (30% deposit). */
export const DEPOSIT_RATE = 0.3;

export type GroupPriceSchedule = "coastal" | "sintra" | "cascais";

export type CheckoutCatalogEntry = {
  title: string;
  maxGuests: number;
  /** Variable schedule pricing. */
  schedule?: GroupPriceSchedule;
  /**
   * Private inventory: price depends on party size (1 = Private, 2 = Tandem).
   */
  priceByPeople?: Record<number, number>;
  /** Title override by party size (e.g. Tandem). */
  titleByPeople?: Record<number, string>;
  mats: boolean;
  /**
   * Fraction of total charged online. `1` = full pay.
   * Defaults to DEPOSIT_RATE (0.3) for group experiences.
   */
  depositRate?: number;
};

/**
 * Experiences that can be paid via Stripe checkout.
 * Cascais and Sintra are WhatsApp-only (no online deposit).
 */
export const CHECKOUT_CATALOG: Record<string, CheckoutCatalogEntry> = {
  "sunrise-yoga-lisbon": {
    title: "Sunrise Yoga",
    maxGuests: 30,
    schedule: "coastal",
    mats: true,
    /** Early sessions: full prepay (hard to confirm morning attendance). */
    depositRate: 1,
  },
  "sunset-yoga-ocean": {
    title: "Sunset Yoga by the Ocean",
    maxGuests: 8,
    schedule: "coastal",
    mats: true,
  },
  // Sintra is WhatsApp-only (no online deposit) — keep pricing helpers below.
  "private-yoga-session": {
    title: "Private Yoga Session",
    maxGuests: 2,
    priceByPeople: { 1: 45, 2: 80 },
    titleByPeople: { 1: "Private Yoga Session", 2: "Tandem Yoga" },
    mats: true,
    // Default DEPOSIT_RATE (30%) — confirm via WhatsApp before the session.
  },
};

export function coastalPriceForPeople(people: number): number {
  if (people < 1) return 0;
  if (people === 1) return 50;
  if (people === 2) return 90;
  if (people <= 5) return 100;
  return 100 + (people - 5) * 15;
}

/** Yoga in Sintra Forest: €299 for 1 person, then +€15 per extra person. */
export function sintraPriceForPeople(people: number): number {
  if (people < 1) return 0;
  return 299 + (people - 1) * 15;
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

export function depositRateForSlug(slug: string): number {
  const entry = CHECKOUT_CATALOG[slug];
  return entry?.depositRate ?? DEPOSIT_RATE;
}

export function depositCents(totalEur: number, rate = DEPOSIT_RATE): number {
  if (!Number.isFinite(totalEur) || totalEur <= 0) return 0;
  return Math.round(totalEur * 100 * rate);
}

export function depositEur(totalEur: number, rate = DEPOSIT_RATE): number {
  return depositCents(totalEur, rate) / 100;
}

export function remainingEur(totalEur: number, rate = DEPOSIT_RATE): number {
  return Math.round((totalEur - depositEur(totalEur, rate)) * 100) / 100;
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
      depositRate: number;
      /** True when the online charge covers the full booking. */
      fullPay: boolean;
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

  let sessionEur: number;
  if (entry.priceByPeople) {
    const priced = entry.priceByPeople[people];
    if (priced == null) {
      return { ok: false, error: "Unsupported party size for this session." };
    }
    sessionEur = priced;
  } else if (entry.schedule) {
    sessionEur = priceForSchedule(entry.schedule, people);
  } else {
    return { ok: false, error: "This experience cannot be paid online." };
  }

  const title = entry.titleByPeople?.[people] ?? entry.title;
  const totalEur = sessionEur + (entry.mats ? matsSubtotal(mats) : 0);
  const rate = entry.depositRate ?? DEPOSIT_RATE;
  const depEur = depositEur(totalEur, rate);
  const cents = Math.round(depEur * 100);
  const rem = Math.round((totalEur - depEur) * 100) / 100;
  if (cents < 50) {
    return { ok: false, error: "Payment amount is too small." };
  }

  return {
    ok: true,
    title,
    people,
    mats,
    totalEur,
    depositEur: depEur,
    depositCents: cents,
    remainingEur: rem,
    depositRate: rate,
    fullPay: rem <= 0 || rate >= 1,
  };
}
