/**
 * Multi-booking capacity for trainer-organised events (Model B).
 * seats_taken on the slot is incremented atomically on reserve / manual add
 * and covers both confirmed bookings and active Stripe soft-reservations.
 */

import { getServerEventTemplate } from "./event-templates";
import { nowIso } from "./slots";
import type { SlotRow } from "./types";

export function eventMaxGuests(slot: SlotRow): number {
  const template = getServerEventTemplate(slot.experience_slug);
  return template?.maxGuests ?? 1;
}

export function eventSeatsRemaining(slot: SlotRow): number {
  const max = eventMaxGuests(slot);
  const taken = Math.max(0, Number(slot.seats_taken) || 0);
  return Math.max(0, max - taken);
}

/** Release expired event seat reservations (atomic decrement). */
export async function expireEventReservations(
  db: D1Database,
  now = nowIso(),
): Promise<void> {
  const { results } = await db
    .prepare(
      `SELECT id, slot_id, people FROM event_reservations
       WHERE expires_at < ?`,
    )
    .bind(now)
    .all<{ id: string; slot_id: string; people: number }>();

  for (const row of results ?? []) {
    await db.batch([
      db
        .prepare(
          `UPDATE slots
           SET seats_taken = CASE
             WHEN seats_taken > ? THEN seats_taken - ?
             ELSE 0
           END,
               updated_at = ?
           WHERE id = ? AND kind = 'event'`,
        )
        .bind(row.people, row.people, now, row.slot_id),
      db
        .prepare(`DELETE FROM event_reservations WHERE id = ?`)
        .bind(row.id),
    ]);

    const slot = await db
      .prepare(`SELECT experience_slug, seats_taken, status FROM slots WHERE id = ?`)
      .bind(row.slot_id)
      .first<{ experience_slug: string; seats_taken: number; status: string }>();
    if (slot?.status === "booked") {
      const template = getServerEventTemplate(slot.experience_slug);
      const max = template?.maxGuests ?? 1;
      if ((Number(slot.seats_taken) || 0) < max) {
        await db
          .prepare(
            `UPDATE slots
             SET status = 'open',
                 updated_at = ?
             WHERE id = ? AND kind = 'event' AND status = 'booked'`,
          )
          .bind(now, row.slot_id)
          .run();
      }
    }
  }
}

/**
 * Atomically claim seats for an event. Returns holdToken on success.
 * Does NOT change slot.status (stays open until full / cancelled).
 */
export async function reserveEventSeats(
  db: D1Database,
  slot: SlotRow,
  people: number,
  holdMinutes: number,
  existingHoldToken?: string,
): Promise<
  | { ok: true; holdToken: string; expiresAt: string }
  | { ok: false; error: string }
> {
  if (slot.kind !== "event") {
    return { ok: false, error: "Not an event slot." };
  }
  if (slot.status !== "open" && slot.status !== "held") {
    // Events should stay open; tolerate legacy held.
  }
  if (slot.status === "cancelled" || slot.status === "blocked") {
    return { ok: false, error: "Event is not available." };
  }

  const max = eventMaxGuests(slot);
  const seats = Math.max(1, Math.floor(people));
  const ts = nowIso();
  const expiresAt = new Date(Date.now() + holdMinutes * 60_000).toISOString();

  if (existingHoldToken) {
    const existing = await db
      .prepare(
        `SELECT id, people FROM event_reservations
         WHERE hold_token = ? AND slot_id = ? LIMIT 1`,
      )
      .bind(existingHoldToken, slot.id)
      .first<{ id: string; people: number }>();
    if (existing) {
      await db
        .prepare(
          `UPDATE event_reservations
           SET expires_at = ?
           WHERE id = ?`,
        )
        .bind(expiresAt, existing.id)
        .run();
      return { ok: true, holdToken: existingHoldToken, expiresAt };
    }
  }

  const claim = await db
    .prepare(
      `UPDATE slots
       SET seats_taken = seats_taken + ?,
           updated_at = ?
       WHERE id = ?
         AND kind = 'event'
         AND status = 'open'
         AND seats_taken + ? <= ?`,
    )
    .bind(seats, ts, slot.id, seats, max)
    .run();

  if (!claim.meta.changes) {
    return { ok: false, error: "This event is full." };
  }

  const holdToken = crypto.randomUUID();
  const reservationId = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO event_reservations (
        id, slot_id, hold_token, people, expires_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(reservationId, slot.id, holdToken, seats, expiresAt, ts)
    .run();

  // Mark full events as booked so inventory conflicts treat them as busy.
  // Concurrent claims: SQLite serializes the UPDATE above; only one writer
  // can succeed when seats_taken + people would exceed max.
  const updated = await db
    .prepare(`SELECT seats_taken FROM slots WHERE id = ?`)
    .bind(slot.id)
    .first<{ seats_taken: number }>();
  if (updated && updated.seats_taken >= max) {
    await db
      .prepare(
        `UPDATE slots
         SET status = 'booked',
             hold_token = NULL,
             hold_expires_at = NULL,
             updated_at = ?
         WHERE id = ? AND kind = 'event' AND status = 'open'`,
      )
      .bind(ts, slot.id)
      .run();
  }

  return { ok: true, holdToken, expiresAt };
}

/** Confirm a reservation into a paid booking (seats already claimed). */
export async function consumeEventReservation(
  db: D1Database,
  slotId: string,
  holdToken: string,
): Promise<{ ok: true; people: number } | { ok: false; error: string }> {
  const row = await db
    .prepare(
      `SELECT id, people FROM event_reservations
       WHERE slot_id = ? AND hold_token = ? LIMIT 1`,
    )
    .bind(slotId, holdToken)
    .first<{ id: string; people: number }>();

  if (!row) {
    return { ok: false, error: "Reservation not found or expired." };
  }

  await db
    .prepare(`DELETE FROM event_reservations WHERE id = ?`)
    .bind(row.id)
    .run();

  return { ok: true, people: row.people };
}

/** Atomically claim seats for a manual (offline) booking. */
export async function claimEventSeatsForManualBooking(
  db: D1Database,
  slot: SlotRow,
  people: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (slot.kind !== "event") {
    return { ok: false, error: "Not an event slot." };
  }
  if (slot.status === "cancelled") {
    return { ok: false, error: "Event is cancelled." };
  }

  const max = eventMaxGuests(slot);
  const seats = Math.max(1, Math.floor(people));
  const ts = nowIso();

  const claim = await db
    .prepare(
      `UPDATE slots
       SET seats_taken = seats_taken + ?,
           updated_at = ?
       WHERE id = ?
         AND kind = 'event'
         AND status IN ('open', 'booked')
         AND seats_taken + ? <= ?`,
    )
    .bind(seats, ts, slot.id, seats, max)
    .run();

  if (!claim.meta.changes) {
    return { ok: false, error: "This event is full." };
  }

  const updated = await db
    .prepare(`SELECT seats_taken FROM slots WHERE id = ?`)
    .bind(slot.id)
    .first<{ seats_taken: number }>();
  if (updated && updated.seats_taken >= max && slot.status === "open") {
    await db
      .prepare(
        `UPDATE slots
         SET status = 'booked',
             hold_token = NULL,
             hold_expires_at = NULL,
             updated_at = ?
         WHERE id = ? AND kind = 'event' AND status = 'open'`,
      )
      .bind(ts, slot.id)
      .run();
  }

  return { ok: true };
}

/** Release seats after cancelling an event booking (manual remove / refund). */
export async function releaseEventSeats(
  db: D1Database,
  slotId: string,
  people: number,
): Promise<void> {
  const seats = Math.max(1, Math.floor(people));
  const ts = nowIso();

  await db
    .prepare(
      `UPDATE slots
       SET seats_taken = CASE
         WHEN seats_taken > ? THEN seats_taken - ?
         ELSE 0
       END,
           updated_at = ?
       WHERE id = ? AND kind = 'event'`,
    )
    .bind(seats, seats, ts, slotId)
    .run();

  const slot = await db
    .prepare(`SELECT experience_slug, seats_taken, status FROM slots WHERE id = ?`)
    .bind(slotId)
    .first<{ experience_slug: string; seats_taken: number; status: string }>();

  if (slot?.status === "booked") {
    const max = getServerEventTemplate(slot.experience_slug)?.maxGuests ?? 1;
    if ((Number(slot.seats_taken) || 0) < max) {
      await db
        .prepare(
          `UPDATE slots
           SET status = 'open',
               updated_at = ?
           WHERE id = ? AND kind = 'event' AND status = 'booked'`,
        )
        .bind(ts, slotId)
        .run();
    }
  }
}
