/**
 * POST /api/gifts/redeem
 * Turn a held slot plus a gift code into a paid-in-full booking.
 * The code is reserved with the hold, then consumed only if the booking is created.
 */

import { redeemGift } from "../../_lib/gifts";
import { sendBookingConfirmation } from "../../_lib/email";
import { getBookingById } from "../../_lib/bookings";
import { error, json, readJson } from "../../_lib/http";
import type { Env as ScheduleEnv } from "../../_lib/types";

interface Env extends ScheduleEnv {
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  SITE_URL?: string;
  CONTACT_EMAIL?: string;
  BOOKING_NOTIFY_EMAIL?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
}

type Body = {
  code?: string;
  holdToken?: string;
  slotId?: string;
  guestName?: string;
  guestEmail?: string;
  locationId?: string;
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  if (!env.DB) return error("Schedule database is not configured.", 503);

  const body = await readJson<Body>(request);
  const result = await redeemGift(env.DB, {
    code: body?.code ?? "",
    holdToken: body?.holdToken?.trim() ?? "",
    slotId: body?.slotId?.trim() ?? "",
    guestName: body?.guestName ?? "",
    guestEmail: body?.guestEmail ?? "",
    locationId: body?.locationId ?? "",
  });
  if (!result.ok) return error(result.error, result.status);

  const booking = await getBookingById(env.DB, result.bookingId);
  if (booking) {
    const emailResult = await sendBookingConfirmation(booking, env, {
      notifyTeacher: true,
    });
    if (!emailResult.sent) {
      console.warn("[gifts] booking email incomplete", {
        bookingId: booking.id,
        ...emailResult,
      });
    }
  }

  return json({ bookingId: result.bookingId });
};
