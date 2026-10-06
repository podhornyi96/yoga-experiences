/**
 * Daily low-inventory check for Sunrise / Sunset / Private-Tandem.
 */

import { expireHolds, isFutureStartsAt } from "./slots";
import {
  PRIVATE_INVENTORY_SLUG,
  SCHEDULED_SLUGS,
  type SlotRow,
} from "./types";

export const LOW_INVENTORY_THRESHOLD = 5;

export type InventoryCategory = {
  slug: (typeof SCHEDULED_SLUGS)[number];
  label: string;
  count: number;
};

const CATEGORY_LABELS: Record<(typeof SCHEDULED_SLUGS)[number], string> = {
  "sunrise-yoga-lisbon": "Sunrise",
  "sunset-yoga-ocean": "Sunset",
  [PRIVATE_INVENTORY_SLUG]: "Private / Tandem",
};

/** Current wall-clock hour (0–23) in Europe/Lisbon. */
export function lisbonHour(now = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Lisbon",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  return Number(parts.find((p) => p.type === "hour")?.value ?? "0");
}

/** Count future open inventory slots per scheduled slug. */
export async function countOpenInventoryByCategory(
  db: D1Database,
): Promise<InventoryCategory[]> {
  await expireHolds(db);

  const placeholders = SCHEDULED_SLUGS.map(() => "?").join(", ");
  const { results } = await db
    .prepare(
      `SELECT experience_slug, starts_at FROM slots
       WHERE kind = 'inventory'
         AND status = 'open'
         AND experience_slug IN (${placeholders})`,
    )
    .bind(...SCHEDULED_SLUGS)
    .all<Pick<SlotRow, "experience_slug" | "starts_at">>();

  const counts = Object.fromEntries(
    SCHEDULED_SLUGS.map((slug) => [slug, 0]),
  ) as Record<(typeof SCHEDULED_SLUGS)[number], number>;

  for (const row of results ?? []) {
    const slug = row.experience_slug as (typeof SCHEDULED_SLUGS)[number];
    if (!(slug in counts)) continue;
    if (!isFutureStartsAt(row.starts_at)) continue;
    counts[slug] += 1;
  }

  return SCHEDULED_SLUGS.map((slug) => ({
    slug,
    label: CATEGORY_LABELS[slug],
    count: counts[slug],
  }));
}

export function categoriesBelowThreshold(
  categories: InventoryCategory[],
  threshold = LOW_INVENTORY_THRESHOLD,
): InventoryCategory[] {
  return categories.filter((c) => c.count < threshold);
}
