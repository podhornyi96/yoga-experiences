/**
 * GET  /api/admin/bookings/:id
 * PATCH /api/admin/bookings/:id
 *   Body: { action: 'mark_paid' | 'cancel' | 'refund' }
 */

import {
  getBookingById,
  publicBooking,
} from "../../../_lib/bookings";
import { isAdminAuthenticated } from "../../../_lib/auth";
import { error, json, readJson } from "../../../_lib/http";
import {
  getSlotById,
  nowIso,
  unblockSiblingSlotsOnDay,
} from "../../../_lib/slots";
import type { Env } from "../../../_lib/types";

async function requireAdmin(
  request: Request,
  env: Env,
): Promise<Response | null> {
  if (!(await isAdminAuthenticated(request, env))) {
    return error("Unauthorized.", 401);
  }
  if (!env.DB) return error("Schedule database is not configured.", 503);
  return null;
}

type Ctx = EventContext<Env, "id", Record<string, unknown>>;

export const onRequestGet: PagesFunction<Env, "id"> = async (context) => {
  const { request, env, params } = context as Ctx;
  const denied = await requireAdmin(request, env);
  if (denied) return denied;

  const id = String(params.id ?? "").trim();
  if (!id) return error("Booking id is required.", 400);

  const row = await getBookingById(env.DB, id);
  if (!row) return error("Booking not found.", 404);

  const slot = await getSlotById(env.DB, row.slot_id);
  return json({
    booking: publicBooking(row),
    slot: slot
      ? {
          id: slot.id,
          status: slot.status,
          day: slot.day,
          startsAt: slot.starts_at,
          experienceSlug: slot.experience_slug,
        }
      : null,
  });
};

export const onRequestPatch: PagesFunction<Env, "id"> = async (context) => {
  const { request, env, params } = context as Ctx;
  const denied = await requireAdmin(request, env);
  if (denied) return denied;

  const id = String(params.id ?? "").trim();
  if (!id) return error("Booking id is required.", 400);

  const body = await readJson<{
    action?: "mark_paid" | "cancel" | "refund";
  }>(request);
  const action = body?.action;
  if (!action) return error("action is required.");

  const booking = await getBookingById(env.DB, id);
  if (!booking) return error("Booking not found.", 404);

  const ts = nowIso();

  if (action === "mark_paid") {
    if (booking.payment_status !== "deposit_paid") {
      return error("Only deposit_paid bookings can be marked paid in full.", 409);
    }
    await env.DB.prepare(
      `UPDATE bookings
       SET payment_status = 'paid_in_full',
           remaining_eur = 0,
           paid_in_full_at = ?,
           updated_at = ?
       WHERE id = ?`,
    )
      .bind(ts, ts, id)
      .run();
  } else if (action === "cancel" || action === "refund") {
    if (
      booking.payment_status !== "deposit_paid" &&
      booking.payment_status !== "paid_in_full"
    ) {
      return error("Booking is already closed.", 409);
    }
    const next = action === "refund" ? "refunded" : "cancelled";
    await env.DB.prepare(
      `UPDATE bookings
       SET payment_status = ?,
           updated_at = ?
       WHERE id = ?`,
    )
      .bind(next, ts, id)
      .run();

    // Free the day if this was the active booking on a booked slot
    // and no other active bookings remain on that slot.
    const slot = await getSlotById(env.DB, booking.slot_id);
    if (slot?.status === "booked") {
      const { results } = await env.DB.prepare(
        `SELECT id FROM bookings
         WHERE slot_id = ?
           AND id != ?
           AND payment_status IN ('deposit_paid', 'paid_in_full')
         LIMIT 1`,
      )
        .bind(booking.slot_id, id)
        .all();
      if (!(results && results.length)) {
        await env.DB.prepare(
          `UPDATE slots
           SET status = 'open',
               hold_token = NULL,
               hold_expires_at = NULL,
               updated_at = ?
           WHERE id = ?`,
        )
          .bind(ts, booking.slot_id)
          .run();
        await unblockSiblingSlotsOnDay(env.DB, slot.day, ts);
      }
    }
  } else {
    return error("Unknown action.", 400);
  }

  const updated = await getBookingById(env.DB, id);
  return json({ booking: updated ? publicBooking(updated) : null });
};
