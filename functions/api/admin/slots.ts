import { isAdminAuthenticated } from "../../_lib/auth";
import { cancelActiveBookingsForSlot } from "../../_lib/bookings";
import { error, json, readJson } from "../../_lib/http";
import {
  adminSlot,
  blockConflictingSlots,
  createOpenSlot,
  expireHolds,
  findConflictingBusySlot,
  getSlotById,
  nowIso,
  recomputeBlockedSlotsOnDay,
} from "../../_lib/slots";
import {
  isScheduledSlug,
  type Env,
  type SlotRow,
  type SlotStatus,
} from "../../_lib/types";

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

/**
 * GET /api/admin/slots?slug=optional
 * Lists non-cancelled slots for admin (includes blocked siblings).
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const denied = await requireAdmin(request, env);
  if (denied) return denied;

  await expireHolds(env.DB);

  const url = new URL(request.url);
  const slug = url.searchParams.get("slug")?.trim();

  let rows: SlotRow[];
  if (slug) {
    if (!isScheduledSlug(slug)) return error("Unknown experience slug.", 400);
    const { results } = await env.DB.prepare(
      `SELECT * FROM slots
       WHERE experience_slug = ?
         AND status != 'cancelled'
       ORDER BY starts_at ASC`,
    )
      .bind(slug)
      .all<SlotRow>();
    rows = results ?? [];
  } else {
    const { results } = await env.DB.prepare(
      `SELECT * FROM slots
       WHERE status != 'cancelled'
       ORDER BY starts_at ASC`,
    ).all<SlotRow>();
    rows = results ?? [];
  }

  return json({ slots: rows.map(adminSlot) });
};

/**
 * POST /api/admin/slots
 * Body: { experienceSlug, date: YYYY-MM-DD, time: HH:mm }
 *
 * Multiple overlapping *offers* may share a day. Rejected only when the new
 * window conflicts with an existing booked/held session (+ buffer).
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const denied = await requireAdmin(request, env);
  if (denied) return denied;

  const body = await readJson<{
    experienceSlug?: string;
    date?: string;
    time?: string;
  }>(request);

  const experienceSlug = body?.experienceSlug?.trim() ?? "";
  if (!isScheduledSlug(experienceSlug)) {
    return error("Unsupported experience slug.", 400);
  }

  const result = await createOpenSlot(
    env.DB,
    experienceSlug,
    body?.date ?? "",
    body?.time ?? "",
  );
  if (!result.ok) {
    if (result.reason === "Invalid date or time.") {
      return error("Provide date as YYYY-MM-DD and time as HH:mm.");
    }
    if (result.reason === "Insert failed.") {
      return error(result.reason, 500);
    }
    return error(result.reason, 409);
  }

  return json({ slot: adminSlot(result.slot) }, { status: 201 });
};

/**
 * PATCH /api/admin/slots
 * Body: { id, action: 'book' | 'release' | 'cancel' }
 *
 * Marking booked blocks conflicting open/held slots (session + buffer).
 * Releasing/cancelling recomputes blocked siblings for that day.
 */
export const onRequestPatch: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const denied = await requireAdmin(request, env);
  if (denied) return denied;

  await expireHolds(env.DB);

  const body = await readJson<{
    id?: string;
    action?: "book" | "release" | "cancel";
  }>(request);

  const id = body?.id?.trim();
  const action = body?.action;
  if (!id || !action) return error("id and action are required.");

  const slot = await getSlotById(env.DB, id);
  if (!slot || slot.status === "cancelled") {
    return error("Slot not found.", 404);
  }

  const ts = nowIso();
  let nextStatus: SlotStatus = slot.status;

  if (action === "book") {
    if (slot.status !== "open" && slot.status !== "held") {
      return error("Only open or held slots can be marked booked.", 409);
    }
    const conflict = await findConflictingBusySlot(env.DB, slot, id);
    if (conflict) {
      return error(
        `Conflicts with ${conflict.experience_slug} at ${conflict.starts_at}.`,
        409,
      );
    }
    nextStatus = "booked";
    await env.DB.prepare(
      `UPDATE slots
       SET status = 'booked',
           hold_token = NULL,
           hold_expires_at = NULL,
           updated_at = ?
       WHERE id = ?`,
    )
      .bind(ts, id)
      .run();
    const booked = await getSlotById(env.DB, id);
    if (booked) await blockConflictingSlots(env.DB, booked, ts);
  } else if (action === "release") {
    if (slot.status !== "held" && slot.status !== "booked") {
      return error("Only held or booked slots can be released.", 409);
    }
    const wasBooked = slot.status === "booked";
    nextStatus = "open";
    await env.DB.prepare(
      `UPDATE slots
       SET status = 'open',
           hold_token = NULL,
           hold_expires_at = NULL,
           updated_at = ?
       WHERE id = ?`,
    )
      .bind(ts, id)
      .run();
    if (wasBooked) {
      await cancelActiveBookingsForSlot(env.DB, id, "cancelled");
    }
    await recomputeBlockedSlotsOnDay(env.DB, slot.day, ts);
  } else if (action === "cancel") {
    const wasBooked = slot.status === "booked";
    nextStatus = "cancelled";
    await env.DB.prepare(
      `UPDATE slots
       SET status = 'cancelled',
           hold_token = NULL,
           hold_expires_at = NULL,
           updated_at = ?
       WHERE id = ?`,
    )
      .bind(ts, id)
      .run();
    if (wasBooked) {
      await cancelActiveBookingsForSlot(env.DB, id, "cancelled");
    }
    await recomputeBlockedSlotsOnDay(env.DB, slot.day, ts);
  } else {
    return error("Unknown action.", 400);
  }

  const updated = await getSlotById(env.DB, id);
  return json({
    slot: updated ? adminSlot(updated) : null,
    status: nextStatus,
  });
};
