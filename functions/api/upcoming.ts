/**
 * GET /api/upcoming?limit=2
 * Next open trainer-organised events only (not inventory slots).
 */

import {
  effectiveDurationMinutes,
  effectivePricePerPerson,
  getServerEventTemplate,
} from "../_lib/event-templates";
import { slotsConflict } from "../_lib/capacity";
import { error, json } from "../_lib/http";
import {
  expireHolds,
  isFutureStartsAt,
  listBusySlotsOnDay,
  nowIso,
} from "../_lib/slots";
import { type Env, type SlotRow } from "../_lib/types";

const DEFAULT_LIMIT = 2;
const MAX_LIMIT = 5;

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  if (!env.DB) {
    return error("Schedule database is not configured.", 503);
  }

  const url = new URL(request.url);
  const rawLimit = Number(url.searchParams.get("limit") ?? DEFAULT_LIMIT);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(MAX_LIMIT, Math.max(1, Math.floor(rawLimit)))
    : DEFAULT_LIMIT;

  await expireHolds(env.DB);

  const { results } = await env.DB.prepare(
    `SELECT * FROM slots
     WHERE status = 'open'
       AND kind = 'event'
     ORDER BY starts_at ASC
     LIMIT 40`,
  ).all<SlotRow>();

  const candidates = (results ?? []).filter((row) => {
    if (!isFutureStartsAt(row.starts_at)) return false;
    const template = getServerEventTemplate(row.experience_slug);
    if (!template) return false;
    const taken = Number(row.seats_taken) || 0;
    return taken < template.maxGuests;
  });

  const byDay = new Map<string, SlotRow[]>();
  for (const row of candidates) {
    const list = byDay.get(row.day) ?? [];
    list.push(row);
    byDay.set(row.day, list);
  }

  const available: SlotRow[] = [];
  for (const [day, daySlots] of byDay) {
    const busy = await listBusySlotsOnDay(env.DB, day);
    for (const row of daySlots) {
      const conflicts = busy.some(
        (b) => b.id !== row.id && slotsConflict(row, b),
      );
      if (!conflicts) available.push(row);
    }
  }

  available.sort((a, b) => (a.starts_at < b.starts_at ? -1 : 1));

  const events = [];
  for (const slot of available) {
    if (events.length >= limit) break;
    const template = getServerEventTemplate(slot.experience_slug);
    if (!template) continue;

    events.push({
      id: slot.id,
      slug: template.slug,
      title: template.title,
      startsAt: slot.starts_at,
      day: slot.day,
      locationLabel: template.locationLabel,
      image: template.images[0] ?? null,
      durationMinutes: effectiveDurationMinutes(
        template,
        slot.duration_minutes,
      ),
      pricePerPersonEur: effectivePricePerPerson(template, slot.price_eur),
      maxGuests: template.maxGuests,
      seatsRemaining: Math.max(
        0,
        template.maxGuests - (Number(slot.seats_taken) || 0),
      ),
      whatsappOnly: false,
      href: `/events/?id=${encodeURIComponent(slot.id)}`,
    });
  }

  return json({ events, generatedAt: nowIso() });
};
