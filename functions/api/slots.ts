import { error, json } from "../_lib/http";
import { slotsConflict } from "../_lib/capacity";
import {
  expireHolds,
  isFutureStartsAt,
  listBusySlotsOnDay,
  nowIso,
  publicSlot,
} from "../_lib/slots";
import { isScheduledSlug, type Env, type SlotRow } from "../_lib/types";

/**
 * GET /api/slots?slug=<experience-slug>&holdToken=<optional>
 * Returns available (open + future) slots that do not conflict with any
 * booked/held session (session duration + post buffer). Soft holds hide
 * conflicting siblings while active.
 *
 * Optional holdToken: also include the caller's still-valid held slot so they
 * can resume checkout after backing out of Stripe.
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  if (!env.DB) {
    return error("Schedule database is not configured.", 503);
  }

  const url = new URL(request.url);
  const slug = url.searchParams.get("slug")?.trim() ?? "";
  const holdToken = url.searchParams.get("holdToken")?.trim() ?? "";
  if (!slug || !isScheduledSlug(slug)) {
    return error("Unknown or unsupported experience slug.", 400);
  }

  await expireHolds(env.DB);

  const { results } = await env.DB.prepare(
    `SELECT s.* FROM slots s
     WHERE s.experience_slug = ?
       AND (
         s.status = 'open'
         OR (
           s.status = 'held'
           AND ? != ''
           AND s.hold_token = ?
           AND s.hold_expires_at IS NOT NULL
           AND s.hold_expires_at >= ?
         )
       )
     ORDER BY s.starts_at ASC`,
  )
    .bind(slug, holdToken, holdToken, nowIso())
    .all<SlotRow>();

  const candidates = (results ?? []).filter((row) =>
    isFutureStartsAt(row.starts_at),
  );

  const byDay = new Map<string, SlotRow[]>();
  for (const row of candidates) {
    const list = byDay.get(row.day) ?? [];
    list.push(row);
    byDay.set(row.day, list);
  }

  const slots = [];
  for (const [day, daySlots] of byDay) {
    const busy = await listBusySlotsOnDay(env.DB, day);
    for (const row of daySlots) {
      const ownHold =
        row.status === "held" &&
        holdToken !== "" &&
        row.hold_token === holdToken;
      const conflicts = busy.some(
        (b) => b.id !== row.id && slotsConflict(row, b),
      );
      if (conflicts && !ownHold) continue;
      slots.push(publicSlot(row));
    }
  }

  slots.sort((a, b) => (a.startsAt < b.startsAt ? -1 : 1));

  return json({ slots, holdMinutes: Number(env.SCHEDULE_HOLD_MINUTES) || 20 });
};
