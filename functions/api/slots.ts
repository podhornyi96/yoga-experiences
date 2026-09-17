import { error, json } from "../_lib/http";
import {
  expireHolds,
  isFutureStartsAt,
  nowIso,
  publicSlot,
} from "../_lib/slots";
import { isScheduledSlug, type Env, type SlotRow } from "../_lib/types";

/**
 * GET /api/slots?slug=<experience-slug>&holdToken=<optional>
 * Returns available (open + future) slots. Days with any booked session are
 * excluded (siblings are also marked blocked on book). Soft holds do not
 * hide other experiences on the same day.
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
       AND NOT EXISTS (
         SELECT 1 FROM slots b
         WHERE b.day = s.day
           AND b.status = 'booked'
       )
     ORDER BY s.starts_at ASC`,
  )
    .bind(slug, holdToken, holdToken, nowIso())
    .all<SlotRow>();

  const slots = (results ?? [])
    .filter((row) => isFutureStartsAt(row.starts_at))
    .map(publicSlot);

  return json({ slots, holdMinutes: Number(env.SCHEDULE_HOLD_MINUTES) || 20 });
};
