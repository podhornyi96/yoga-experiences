/**
 * POST /api/stripe/webhook
 * On checkout.session.completed:
 *  - create booking (unique id per payment via crypto.randomUUID)
 *  - inventory: mark held slot booked + block siblings
 *  - events: consume seat reservation (seats already claimed atomically)
 *  - send confirmation email (best-effort)
 */

import {
  getBookingByStripeSession,
  insertBooking,
} from "../../_lib/bookings";
import {
  claimEventSeatsForManualBooking,
  consumeEventReservation,
} from "../../_lib/event-capacity";
import { sendBookingConfirmation } from "../../_lib/email";
import { error, json } from "../../_lib/http";
import {
  blockConflictingSlots,
  getSlotById,
  nowIso,
} from "../../_lib/slots";
import {
  paymentIntentIdFromSession,
  type StripeEvent,
  verifyStripeWebhookDetailed,
} from "../../_lib/stripe";
import type { Env as ScheduleEnv } from "../../_lib/types";

interface Env extends ScheduleEnv {
  STRIPE_WEBHOOK_SECRET?: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  SITE_URL?: string;
  CONTACT_EMAIL?: string;
  BOOKING_NOTIFY_EMAIL?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (!env.STRIPE_WEBHOOK_SECRET) {
    return error("Webhook secret is not configured.", 501);
  }
  if (!env.DB) {
    return error("Schedule database is not configured.", 503);
  }

  const rawBody = new TextDecoder().decode(await request.arrayBuffer());
  const signature = request.headers.get("stripe-signature");
  const verified = await verifyStripeWebhookDetailed(
    rawBody,
    signature,
    env.STRIPE_WEBHOOK_SECRET.trim(),
  );
  if (!verified.ok) {
    return error(`Invalid Stripe signature (${verified.reason}).`, 400);
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(rawBody) as StripeEvent;
  } catch {
    return error("Invalid JSON payload.", 400);
  }

  if (event.type !== "checkout.session.completed") {
    return json({ received: true });
  }

  const session = event.data.object;
  if (session.payment_status && session.payment_status !== "paid") {
    return json({ received: true, skipped: "not_paid" });
  }

  const sessionId = session.id?.trim();
  if (!sessionId) {
    return json({ received: true, skipped: "missing_session_id" });
  }

  const existing = await getBookingByStripeSession(env.DB, sessionId);
  if (existing) {
    return json({
      received: true,
      status: "already_booked",
      bookingId: existing.id,
    });
  }

  const meta = session.metadata ?? {};
  const slotId = meta.slotId?.trim();
  const holdToken = meta.holdToken?.trim();
  if (!slotId || !holdToken) {
    return json({ received: true, skipped: "missing_metadata" });
  }

  const slot = await getSlotById(env.DB, slotId);
  if (!slot) {
    return json({ received: true, skipped: "slot_not_found" });
  }

  const people = Math.max(1, Number(meta.people) || 1);
  const mats = Math.max(0, Number(meta.mats) || 0);
  const totalEur = Number(meta.totalEur);
  const depositEur = Number(meta.depositEur);
  const remainingEur = Number(meta.remainingEur);
  if (
    !Number.isFinite(totalEur) ||
    !Number.isFinite(depositEur) ||
    !Number.isFinite(remainingEur)
  ) {
    return json({ received: true, skipped: "bad_amounts" });
  }

  const fullPay =
    meta.fullPay === "1" || remainingEur <= 0 || depositEur >= totalEur;
  const locationId = meta.locationId?.trim() || null;

  const guestEmail =
    session.customer_details?.email ?? session.customer_email ?? null;
  const guestName = session.customer_details?.name ?? null;
  const guestPhone = session.customer_details?.phone ?? null;
  const ts = nowIso();

  let slotBookedNow = false;
  let eventOverbookRisk = false;

  if (slot.kind === "event") {
    const consumed = await consumeEventReservation(
      env.DB,
      slotId,
      holdToken,
    );
    if (!consumed.ok) {
      // Hold expired after payment (or webhook retry). Seats were released —
      // try to reclaim atomically so we never overbook when the last seat
      // was taken by someone else in between.
      const reclaim = await claimEventSeatsForManualBooking(
        env.DB,
        slot,
        people,
      );
      if (!reclaim.ok) {
        eventOverbookRisk = true;
        console.error("[webhook] event overbook risk after expired hold", {
          slotId,
          people,
          reason: reclaim.error,
        });
      }
    }
  } else if (slot.status === "held" && slot.hold_token === holdToken) {
    const result = await env.DB.prepare(
      `UPDATE slots
       SET status = 'booked',
           hold_token = NULL,
           hold_expires_at = NULL,
           updated_at = ?
       WHERE id = ?
         AND status = 'held'
         AND hold_token = ?`,
    )
      .bind(ts, slotId, holdToken)
      .run();
    slotBookedNow = Boolean(result.meta.changes);
    if (slotBookedNow) {
      const booked = await getSlotById(env.DB, slotId);
      if (booked) await blockConflictingSlots(env.DB, booked, ts);
    }
  } else if (slot.status !== "booked") {
    return json({
      received: true,
      skipped: "hold_mismatch",
      status: slot.status,
    });
  }

  try {
    const booking = await insertBooking(env.DB, {
      slotId,
      experienceSlug: slot.experience_slug,
      startsAt: slot.starts_at,
      guestEmail,
      guestName,
      guestPhone,
      people,
      mats,
      totalEur,
      depositEur,
      remainingEur: fullPay ? 0 : remainingEur,
      paymentStatus: fullPay ? "paid_in_full" : "deposit_paid",
      stripeCheckoutSessionId: sessionId,
      stripePaymentIntentId: paymentIntentIdFromSession(session),
      locationId,
      notes: eventOverbookRisk
        ? "Paid after hold expired; event may be over capacity — review manually."
        : null,
    });

    const emailResult = await sendBookingConfirmation(booking, env, {
      notifyTeacher: true,
    });
    if (!emailResult.sent || !emailResult.teacherNotified) {
      console.warn("[webhook] confirmation email incomplete", {
        bookingId: booking.id,
        kind: slot.kind,
        ...emailResult,
      });
    } else {
      console.log("[webhook] confirmation emails sent", {
        bookingId: booking.id,
        kind: slot.kind,
        guest: Boolean(booking.guest_email),
        teacherNotified: emailResult.teacherNotified,
      });
    }

    return json({
      received: true,
      status:
        slot.kind === "event"
          ? "event_booking"
          : slotBookedNow || slot.status === "booked"
            ? "booked"
            : "booking_only",
      bookingId: booking.id,
      email: emailResult,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "booking_insert_failed";
    return error(`Booking insert failed: ${message}`, 500);
  }
};
