import { error, json, readJson } from "../_lib/http";
import { reserveEventSeats } from "../_lib/event-capacity";
import {
  blockConflictingSlots,
  expireHolds,
  findConflictingBusySlot,
  getSlotById,
  holdMinutes,
  isFutureStartsAt,
  nowIso,
  publicSlot,
} from "../_lib/slots";
import type { Env } from "../_lib/types";

/**
 * POST /api/holds
 * Soft-hold an open inventory slot, OR reserve a seat on a multi-book event.
 * Body: { slotId: string, holdToken?: string, people?: number }
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  if (!env.DB) {
    return error("Schedule database is not configured.", 503);
  }

  const body = await readJson<{
    slotId?: string;
    holdToken?: string;
    people?: number;
  }>(request);
  const slotId = body?.slotId?.trim();
  const existingToken = body?.holdToken?.trim() ?? "";
  const people = Math.max(1, Math.floor(Number(body?.people) || 1));
  if (!slotId) return error("slotId is required.");

  await expireHolds(env.DB);

  const slot = await getSlotById(env.DB, slotId);
  if (!slot || slot.status === "cancelled" || slot.status === "blocked") {
    return error("Slot not found.", 404);
  }
  if (!isFutureStartsAt(slot.starts_at)) {
    return error("This slot is in the past.", 409);
  }

  const minutes = holdMinutes(env);

  // —— Events: soft seat reservation (slot stays open for other guests) ——
  if (slot.kind === "event") {
    if (slot.status === "booked") {
      // May still have seats if status flipped early; reserveEventSeats checks seats_taken.
      // If truly full, claim fails.
    }
    const reserved = await reserveEventSeats(
      env.DB,
      slot,
      people,
      minutes,
      existingToken || undefined,
    );
    if (!reserved.ok) return error(reserved.error, 409);

    const updated = await getSlotById(env.DB, slotId);
    return json({
      holdToken: reserved.holdToken,
      expiresAt: reserved.expiresAt,
      holdMinutes: minutes,
      slot: updated ? publicSlot(updated) : publicSlot(slot),
    });
  }

  // —— Inventory: exclusive soft-hold (existing behaviour) ——
  if (slot.status === "booked") {
    return error("This slot is already booked.", 409);
  }

  const heldAt = nowIso();
  const holdExpiresAt = new Date(Date.now() + minutes * 60_000).toISOString();

  if (
    slot.status === "held" &&
    existingToken &&
    slot.hold_token === existingToken
  ) {
    await env.DB.prepare(
      `UPDATE slots
       SET hold_expires_at = ?,
           updated_at = ?
       WHERE id = ?
         AND status = 'held'
         AND hold_token = ?`,
    )
      .bind(holdExpiresAt, heldAt, slotId, existingToken)
      .run();

    const updated = await getSlotById(env.DB, slotId);
    if (!updated) return error("Slot not found after hold.", 500);

    await blockConflictingSlots(env.DB, updated, heldAt);

    return json({
      holdToken: existingToken,
      expiresAt: holdExpiresAt,
      holdMinutes: minutes,
      slot: publicSlot(updated),
    });
  }

  if (slot.status === "held") {
    return error(
      "This slot is temporarily held by someone else. Try again shortly.",
      409,
    );
  }
  if (slot.status !== "open") {
    return error("Slot is not available.", 409);
  }

  const conflict = await findConflictingBusySlot(env.DB, slot);
  if (conflict) {
    return error("This time is no longer available.", 409);
  }

  const holdToken = crypto.randomUUID();

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

  await blockConflictingSlots(env.DB, updated, heldAt);

  return json({
    holdToken,
    expiresAt: holdExpiresAt,
    holdMinutes: minutes,
    slot: publicSlot(updated),
  });
};
