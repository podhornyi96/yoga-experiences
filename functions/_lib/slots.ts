import {
  DEFAULT_HOLD_MINUTES,
  type Env,
  type SlotRow,
  type SlotStatus,
} from "./types";

export function nowIso(): string {
  return new Date().toISOString();
}

export function holdMinutes(env: Env): number {
  const raw = env.SCHEDULE_HOLD_MINUTES;
  if (!raw) return DEFAULT_HOLD_MINUTES;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_HOLD_MINUTES;
}

/** Parse admin input `YYYY-MM-DD` + `HH:mm` into Lisbon wall-time fields. */
export function parseLocalDateTime(
  date: string,
  time: string,
): { starts_at: string; day: string } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  if (!/^\d{2}:\d{2}$/.test(time)) return null;
  const [hh, mm] = time.split(":").map(Number);
  if (hh > 23 || mm > 59) return null;
  const [y, mo, d] = date.split("-").map(Number);
  const probe = new Date(Date.UTC(y, mo - 1, d));
  if (
    probe.getUTCFullYear() !== y ||
    probe.getUTCMonth() !== mo - 1 ||
    probe.getUTCDate() !== d
  ) {
    return null;
  }
  return { day: date, starts_at: `${date}T${time}` };
}

/** Compare Lisbon wall time `YYYY-MM-DDTHH:mm` to "now" in Europe/Lisbon. */
export function isFutureStartsAt(startsAt: string, now = new Date()): boolean {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Lisbon",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "00";
  const nowLocal = `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
  return startsAt > nowLocal;
}

export function publicSlot(row: SlotRow) {
  return {
    id: row.id,
    experienceSlug: row.experience_slug,
    startsAt: row.starts_at,
    day: row.day,
    status: row.status as SlotStatus,
    holdExpiresAt: row.hold_expires_at,
  };
}

export function adminSlot(row: SlotRow) {
  return {
    ...publicSlot(row),
    holdToken: row.hold_token,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Release expired holds (lazy). */
export async function expireHolds(db: D1Database, now = nowIso()): Promise<void> {
  await db
    .prepare(
      `UPDATE slots
       SET status = 'open',
           hold_token = NULL,
           hold_expires_at = NULL,
           updated_at = ?
       WHERE status = 'held'
         AND hold_expires_at IS NOT NULL
         AND hold_expires_at < ?`,
    )
    .bind(now, now)
    .run();
}

export async function getSlotById(
  db: D1Database,
  id: string,
): Promise<SlotRow | null> {
  return (
    (await db
      .prepare(`SELECT * FROM slots WHERE id = ?`)
      .bind(id)
      .first<SlotRow>()) ?? null
  );
}

/** Same experience already has a non-cancelled/non-blocked slot that day. */
export async function dayHasSameExperienceSlot(
  db: D1Database,
  day: string,
  experienceSlug: string,
): Promise<SlotRow | null> {
  return (
    (await db
      .prepare(
        `SELECT * FROM slots
         WHERE day = ?
           AND experience_slug = ?
           AND status NOT IN ('cancelled', 'blocked')
         LIMIT 1`,
      )
      .bind(day, experienceSlug)
      .first<SlotRow>()) ?? null
  );
}

/** True when any slot on this day is already booked (teacher capacity used). */
export async function dayHasBookedSlot(
  db: D1Database,
  day: string,
  exceptId?: string,
): Promise<SlotRow | null> {
  if (exceptId) {
    return (
      (await db
        .prepare(
          `SELECT * FROM slots
           WHERE day = ?
             AND status = 'booked'
             AND id != ?
           LIMIT 1`,
        )
        .bind(day, exceptId)
        .first<SlotRow>()) ?? null
    );
  }
  return (
    (await db
      .prepare(
        `SELECT * FROM slots
         WHERE day = ?
           AND status = 'booked'
         LIMIT 1`,
      )
      .bind(day)
      .first<SlotRow>()) ?? null
  );
}

/** After booking one slot, close other open/held offers that day. */
export async function blockSiblingSlotsOnDay(
  db: D1Database,
  day: string,
  bookedId: string,
  updatedAt: string,
): Promise<void> {
  await db
    .prepare(
      `UPDATE slots
       SET status = 'blocked',
           hold_token = NULL,
           hold_expires_at = NULL,
           updated_at = ?
       WHERE day = ?
         AND id != ?
         AND status IN ('open', 'held')`,
    )
    .bind(updatedAt, day, bookedId)
    .run();
}

/** When the booked session is released/cancelled, reopen blocked siblings. */
export async function unblockSiblingSlotsOnDay(
  db: D1Database,
  day: string,
  updatedAt: string,
): Promise<void> {
  await db
    .prepare(
      `UPDATE slots
       SET status = 'open',
           hold_token = NULL,
           hold_expires_at = NULL,
           updated_at = ?
       WHERE day = ?
         AND status = 'blocked'`,
    )
    .bind(updatedAt, day)
    .run();
}
