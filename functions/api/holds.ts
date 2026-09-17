import { error, json, readJson } from "../_lib/http";
import {
  dayHasBookedSlot,
  expireHolds,
  getSlotById,
  holdMinutes,
  isFutureStartsAt,
  nowIso,
  publicSlot,
} from "../_lib/slots";
import type { Env } from "../_lib/types";

/**
 * POST /api/holds
 * Soft-hold an open slot for SCHEDULE_HOLD_MINUTES (default 20).
 * Body: { slotId: string }
 *
 * Soft hold does NOT close other experiences on the same day — only Mark booked does.
 * Returns holdToken for the WhatsApp message today and for future Stripe checkout.
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  if (!env.DB) {
    return error("Schedule database is not configured.", 503);
  }

  const body = await readJson<{ slotId?: string }>(request);
  const slotId = body?.slotId?.trim();
  if (!slotId) return error("slotId is required.");

  await expireHolds(env.DB);

  const slot = await getSlotById(env.DB, slotId);
  if (!slot || slot.status === "cancelled" || slot.status === "blocked") {
    return error("Slot not found.", 404);
  }
  if (!isFutureStartsAt(slot.starts_at)) {
    return error("This slot is in the past.", 409);
  }
  if (slot.status === "booked") {
    return error("This slot is already booked.", 409);
  }
  if (slot.status === "held") {
    return error("This slot is temporarily held by someone else. Try again shortly.", 409);
  }
  if (slot.status !== "open") {
    return error("Slot is not available.", 409);
  }

  const dayBooked = await dayHasBookedSlot(env.DB, slot.day);
  if (dayBooked) {
    return error("This day is no longer available.", 409);
  }

  const minutes = holdMinutes(env);
  const holdToken = crypto.randomUUID();
  const heldAt = nowIso();
  const holdExpiresAt = new Date(Date.now() + minutes * 60_000).toISOString();

  const result = await env.DB.prepare(
    `UPDATE slots
     SET status = 'held',
         hold_token = ?,
         hold_expires_at = ?,
         updated_at = ?
     WHERE id = ?
       AND status = 'open'`,
  )
    .bind(holdToken, holdExpiresAt, heldAt, slotId)
    .run();

  if (!result.meta.changes) {
    return error("This slot was just taken. Pick another date.", 409);
  }

  const updated = await getSlotById(env.DB, slotId);
  if (!updated) return error("Slot not found after hold.", 500);

  return json({
    holdToken,
    expiresAt: holdExpiresAt,
    holdMinutes: minutes,
    slot: publicSlot(updated),
    // Future Stripe: POST /api/checkout { holdToken, slug, people, mats }
  });
};
