/**
 * GET /api/events?id=<slotId>
 * Public trainer-organised event detail (kind = event only).
 */

import {
  effectiveDurationMinutes,
  effectivePricePerPerson,
  getServerEventTemplate,
} from "../_lib/event-templates";
import { eventMaxGuests, eventSeatsRemaining } from "../_lib/event-capacity";
import { error, json } from "../_lib/http";
import { expireHolds, getSlotById, isFutureStartsAt } from "../_lib/slots";
import { type Env } from "../_lib/types";

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  if (!env.DB) {
    return error("Schedule database is not configured.", 503);
  }

  const id = new URL(request.url).searchParams.get("id")?.trim() ?? "";
  if (!id) return error("id is required.");

  await expireHolds(env.DB);

  const slot = await getSlotById(env.DB, id);
  if (!slot || slot.status === "cancelled" || slot.kind !== "event") {
    return error("Event not found.", 404);
  }

  const template = getServerEventTemplate(slot.experience_slug);
  if (!template) {
    return error("Event template not found.", 404);
  }

  const durationMinutes = effectiveDurationMinutes(
    template,
    slot.duration_minutes,
  );
  const pricePerPersonEur = effectivePricePerPerson(template, slot.price_eur);
  const maxGuests = eventMaxGuests(slot);
  const seatsRemaining = eventSeatsRemaining(slot);
  const bookable =
    isFutureStartsAt(slot.starts_at) &&
    seatsRemaining > 0 &&
    slot.status !== "cancelled" &&
    slot.status !== "blocked";

  return json({
    event: {
      id: slot.id,
      slug: template.slug,
      title: template.title,
      summary: template.summary,
      description: template.description,
      locationLabel: template.locationLabel,
      locationUrl: template.locationUrl ?? null,
      startsAt: slot.starts_at,
      day: slot.day,
      status: slot.status,
      durationMinutes,
      maxGuests,
      seatsTaken: Number(slot.seats_taken) || 0,
      seatsRemaining,
      images: template.images,
      includes: template.includes,
      pricePerPersonEur,
      priceSchedule: null,
      privatePricing: false,
      mats: template.mats,
      depositRate: template.depositRate,
      whatsappOnly: false,
      marketingSlug: template.marketingSlug ?? null,
      bookable,
      holdExpiresAt: slot.hold_expires_at,
    },
  });
};
