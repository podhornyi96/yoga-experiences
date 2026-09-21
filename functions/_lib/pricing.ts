/**
 * Server-side pricing for Stripe checkout.
 * Keep in sync with src/lib/group-pricing.ts + experience catalog.
 */

export const MAT_PRICE_EUR = 5;
export const MAT_MAX = 6;
/** Default online charge for group experiences (30% deposit). */
export const DEPOSIT_RATE = 0.3;

export type GroupPriceSchedule = "coastal" | "sintra";

export type CheckoutCatalogEntry = {
  title: string;
  maxGuests: number;
  /** Variable schedule pricing, or fixed session price (Cascais). */
  schedule?: GroupPriceSchedule;
  fixedSessionEur?: number;
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

/** Experiences that can be paid via Stripe checkout. */
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
  "private-yoga-session": {
    title: "Private Yoga Session",
    maxGuests: 2,
    priceByPeople: { 1: 45, 2: 80 },
    titleByPeople: { 1: "Private Yoga Session", 2: "Tandem Yoga" },
    mats: true,
    depositRate: 1,
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
  } else if (entry.fixedSessionEur != null) {
    sessionEur = entry.fixedSessionEur;
  } else {
    sessionEur = priceForSchedule(entry.schedule!, people);
  }

  const title = entry.titleByPeople?.[people] ?? entry.title;
  const totalEur = sessionEur + (entry.mats ? matsSubtotal(mats) : 0);
  const rate = entry.depositRate ?? DEPOSIT_RATE;
  const cents = depositCents(totalEur, rate);
  if (cents < 50) {
    return { ok: false, error: "Payment amount is too small." };
  }

  return {
    ok: true,
    title,
    people,
    mats,
    totalEur,
    depositEur: depositEur(totalEur, rate),
    depositCents: cents,
    remainingEur: remainingEur(totalEur, rate),
    depositRate: rate,
    fullPay: rate >= 1 || remainingEur(totalEur, rate) <= 0,
  };
}
