/**
 * GET    /api/admin/events/participants?slotId=
 * POST   /api/admin/events/participants  — manual add
 * PATCH  /api/admin/events/participants  — edit guest details
 * DELETE /api/admin/events/participants  — remove manual participant only
 */

import { isAdminAuthenticated } from "../../../_lib/auth";
import {
  insertBooking,
  listActiveBookingsForSlot,
  publicBooking,
  getBookingById,
} from "../../../_lib/bookings";
import {
  claimEventSeatsForManualBooking,
  eventMaxGuests,
  eventSeatsRemaining,
  releaseEventSeats,
} from "../../../_lib/event-capacity";
import {
  effectivePricePerPerson,
  getServerEventTemplate,
} from "../../../_lib/event-templates";
import { sendBookingConfirmation } from "../../../_lib/email";
import { error, json, readJson } from "../../../_lib/http";
import { expireHolds, getSlotById, nowIso } from "../../../_lib/slots";
import type { Env as ScheduleEnv } from "../../../_lib/types";

interface Env extends ScheduleEnv {
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  SITE_URL?: string;
  CONTACT_EMAIL?: string;
  BOOKING_NOTIFY_EMAIL?: string;
  WHATSAPP?: string;
}

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

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const denied = await requireAdmin(request, env);
  if (denied) return denied;

  await expireHolds(env.DB);

  const slotId = new URL(request.url).searchParams.get("slotId")?.trim() ?? "";
  if (!slotId) return error("slotId is required.");

  const slot = await getSlotById(env.DB, slotId);
  if (!slot || slot.kind !== "event") {
    return error("Event not found.", 404);
  }

  const bookings = await listActiveBookingsForSlot(env.DB, slotId);
  bookings.sort((a, b) => (a.created_at < b.created_at ? -1 : 1));

  return json({
    slotId: slot.id,
    maxGuests: eventMaxGuests(slot),
    seatsTaken: Number(slot.seats_taken) || 0,
    seatsRemaining: eventSeatsRemaining(slot),
    participants: bookings.map(publicBooking),
  });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const denied = await requireAdmin(request, env);
  if (denied) return denied;

  await expireHolds(env.DB);

  const body = await readJson<{
    slotId?: string;
    guestName?: string;
    guestEmail?: string;
    guestPhone?: string;
  }>(request);

  const slotId = body?.slotId?.trim() ?? "";
  const guestName = body?.guestName?.trim() ?? "";
  if (!slotId) return error("slotId is required.");
  if (!guestName) return error("Guest name is required.");

  const slot = await getSlotById(env.DB, slotId);
  if (!slot || slot.kind !== "event") {
    return error("Event not found.", 404);
  }
  if (slot.status === "cancelled") {
    return error("Event is cancelled.", 409);
  }

  const template = getServerEventTemplate(slot.experience_slug);
  if (!template) return error("Event template not found.", 404);

  const claim = await claimEventSeatsForManualBooking(env.DB, slot, 1);
  if (!claim.ok) return error(claim.error, 409);

  const price = effectivePricePerPerson(template, slot.price_eur);

  try {
    const booking = await insertBooking(env.DB, {
      slotId: slot.id,
      experienceSlug: slot.experience_slug,
      startsAt: slot.starts_at,
      guestName,
      guestEmail: body?.guestEmail?.trim() || null,
      guestPhone: body?.guestPhone?.trim() || null,
      people: 1,
      mats: 0,
      totalEur: price,
      depositEur: price,
      remainingEur: 0,
      paymentStatus: "paid_in_full",
      addedManually: true,
      notes: "Added manually (offline payment)",
    });

    const email = await sendBookingConfirmation(booking, env, {
      notifyTeacher: true,
    });
    if (!email.sent || !email.teacherNotified) {
      console.warn("[admin] manual participant email incomplete", email);
    }

    return json(
      { participant: publicBooking(booking), email },
      { status: 201 },
    );
  } catch (err) {
    await env.DB.prepare(
      `UPDATE slots
       SET seats_taken = CASE WHEN seats_taken > 0 THEN seats_taken - 1 ELSE 0 END,
           updated_at = ?
       WHERE id = ? AND kind = 'event'`,
    )
      .bind(new Date().toISOString(), slotId)
      .run();
    const message = err instanceof Error ? err.message : "insert_failed";
    return error(message, 500);
  }
};

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const denied = await requireAdmin(request, env);
  if (denied) return denied;

  const body = await readJson<{
    bookingId?: string;
    guestName?: string;
    guestEmail?: string;
    guestPhone?: string;
  }>(request);

  const bookingId = body?.bookingId?.trim() ?? "";
  const guestName = body?.guestName?.trim() ?? "";
  if (!bookingId) return error("bookingId is required.");
  if (!guestName) return error("Guest name is required.");

  const booking = await getBookingById(env.DB, bookingId);
  if (!booking) return error("Participant not found.", 404);
  if (
    booking.payment_status !== "deposit_paid" &&
    booking.payment_status !== "paid_in_full"
  ) {
    return error("Can only edit active participants.", 409);
  }

  const slot = await getSlotById(env.DB, booking.slot_id);
  if (!slot || slot.kind !== "event") {
    return error("Not an event participant.", 404);
  }

  const ts = nowIso();
  await env.DB.prepare(
    `UPDATE bookings
     SET guest_name = ?,
         guest_email = ?,
         guest_phone = ?,
         updated_at = ?
     WHERE id = ?`,
  )
    .bind(
      guestName,
      body?.guestEmail?.trim() || null,
      body?.guestPhone?.trim() || null,
      ts,
      bookingId,
    )
    .run();

  const updated = await getBookingById(env.DB, bookingId);
  return json({
    participant: updated ? publicBooking(updated) : null,
  });
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const denied = await requireAdmin(request, env);
  if (denied) return denied;

  const url = new URL(request.url);
  let bookingId = url.searchParams.get("bookingId")?.trim() ?? "";
  if (!bookingId) {
    const body = await readJson<{ bookingId?: string }>(request);
    bookingId = body?.bookingId?.trim() ?? "";
  }
  if (!bookingId) return error("bookingId is required.");

  const booking = await getBookingById(env.DB, bookingId);
  if (!booking) return error("Participant not found.", 404);
  if (!booking.added_manually) {
    return error("Only manually added participants can be removed here.", 409);
  }
  if (
    booking.payment_status !== "deposit_paid" &&
    booking.payment_status !== "paid_in_full"
  ) {
    return error("Participant is already removed.", 409);
  }

  const slot = await getSlotById(env.DB, booking.slot_id);
  if (!slot || slot.kind !== "event") {
    return error("Not an event participant.", 404);
  }

  const ts = nowIso();
  await env.DB.prepare(
    `UPDATE bookings
     SET payment_status = 'cancelled',
         updated_at = ?
     WHERE id = ?`,
  )
    .bind(ts, bookingId)
    .run();

  await releaseEventSeats(env.DB, booking.slot_id, booking.people || 1);

  return json({ ok: true, bookingId });
};
