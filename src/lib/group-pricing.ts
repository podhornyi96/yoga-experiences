/** Shared rates for optional yoga mats and live group pricing. */

export const MAT_PRICE_EUR = 5;
export const MAT_MAX = 6;

export type GroupPriceSchedule = "coastal" | "sintra";

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

export function groupBookingTotal(people: number, mats: number): number {
  return coastalPriceForPeople(people) + matsSubtotal(mats);
}
