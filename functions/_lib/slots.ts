import {
  isBusyStatus,
  POST_SESSION_BUFFER_MIN,
  slotsConflict,
} from "./capacity";
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

/** Release expired holds (lazy), then reopen blocked slots that are free again. */
export async function expireHolds(db: D1Database, now = nowIso()): Promise<void> {
  const { results: expired } = await db
    .prepare(
      `SELECT day FROM slots
       WHERE status = 'held'
         AND hold_expires_at IS NOT NULL
         AND hold_expires_at < ?`,
    )
    .bind(now)
    .all<{ day: string }>();

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

  const days = [...new Set((expired ?? []).map((r) => r.day))];
  for (const day of days) {
    await recomputeBlockedSlotsOnDay(db, day, now);
  }
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

export async function listSlotsOnDay(
  db: D1Database,
  day: string,
): Promise<SlotRow[]> {
  const { results } = await db
    .prepare(`SELECT * FROM slots WHERE day = ?`)
    .bind(day)
    .all<SlotRow>();
  return results ?? [];
}

/** Busy = booked or held (teacher calendar occupied). */
export async function listBusySlotsOnDay(
  db: D1Database,
  day: string,
  exceptId?: string,
): Promise<SlotRow[]> {
  const rows = await listSlotsOnDay(db, day);
  return rows.filter(
    (row) =>
      isBusyStatus(row.status) && (!exceptId || row.id !== exceptId),
  );
}

/**
 * True when `candidate` overlaps a busy (booked/held) window on the same day.
 */
export async function findConflictingBusySlot(
  db: D1Database,
  candidate: SlotRow,
  exceptId?: string,
): Promise<SlotRow | null> {
  const busy = await listBusySlotsOnDay(db, candidate.day, exceptId);
  return busy.find((other) => slotsConflict(candidate, other)) ?? null;
}

/**
 * After hold/book: mark open/held siblings whose busy windows overlap as blocked.
 * Does not touch the source slot.
 */
export async function blockConflictingSlots(
  db: D1Database,
  source: SlotRow,
  updatedAt: string,
): Promise<void> {
  const rows = await listSlotsOnDay(db, source.day);
  for (const row of rows) {
    if (row.id === source.id) continue;
    if (row.status !== "open" && row.status !== "held") continue;
    if (!slotsConflict(source, row)) continue;
    await db
      .prepare(
        `UPDATE slots
         SET status = 'blocked',
             hold_token = NULL,
             hold_expires_at = NULL,
             updated_at = ?
         WHERE id = ?
           AND status IN ('open', 'held')`,
      )
      .bind(updatedAt, row.id)
      .run();
  }
}

/**
 * Re-evaluate blocked slots on a day: reopen if they no longer conflict with
 * any booked/held session; keep blocked (or re-block open) if they do.
 */
export async function recomputeBlockedSlotsOnDay(
  db: D1Database,
  day: string,
  updatedAt: string,
): Promise<void> {
  const rows = await listSlotsOnDay(db, day);
  const busy = rows.filter((row) => isBusyStatus(row.status));

  for (const row of rows) {
    if (row.status === "cancelled" || isBusyStatus(row.status)) continue;

    const conflicts = busy.some((b) => slotsConflict(row, b));
    if (conflicts && row.status === "open") {
      await db
        .prepare(
          `UPDATE slots
           SET status = 'blocked',
               hold_token = NULL,
               hold_expires_at = NULL,
               updated_at = ?
           WHERE id = ?
             AND status = 'open'`,
        )
        .bind(updatedAt, row.id)
        .run();
    } else if (!conflicts && row.status === "blocked") {
      await db
        .prepare(
          `UPDATE slots
           SET status = 'open',
               hold_token = NULL,
               hold_expires_at = NULL,
               updated_at = ?
           WHERE id = ?
             AND status = 'blocked'`,
        )
        .bind(updatedAt, row.id)
        .run();
    }
  }
}

/** @deprecated Prefer findConflictingBusySlot — kept for any leftover imports. */
export async function dayHasBookedSlot(
  db: D1Database,
  day: string,
  exceptId?: string,
): Promise<SlotRow | null> {
  const busy = await listBusySlotsOnDay(db, day, exceptId);
  return busy.find((row) => row.status === "booked") ?? null;
}

/** @deprecated Prefer blockConflictingSlots. */
export async function blockSiblingSlotsOnDay(
  db: D1Database,
  day: string,
  bookedId: string,
  updatedAt: string,
): Promise<void> {
  const source = await getSlotById(db, bookedId);
  if (!source) return;
  await blockConflictingSlots(db, source, updatedAt);
}

/** @deprecated Prefer recomputeBlockedSlotsOnDay. */
export async function unblockSiblingSlotsOnDay(
  db: D1Database,
  day: string,
  updatedAt: string,
): Promise<void> {
  await recomputeBlockedSlotsOnDay(db, day, updatedAt);
}

export type CreateOpenSlotResult =
  | { ok: true; slot: SlotRow }
  | { ok: false; day: string; reason: string };

/** Insert an open slot, or return a skip reason (conflicts / invalid). */
export async function createOpenSlot(
  db: D1Database,
  experienceSlug: string,
  date: string,
  time: string,
): Promise<CreateOpenSlotResult> {
  const parsed = parseLocalDateTime(date, time);
  if (!parsed) {
    return { ok: false, day: date, reason: "Invalid date or time." };
  }
  if (!isFutureStartsAt(parsed.starts_at)) {
    return {
      ok: false,
      day: parsed.day,
      reason: "Slot must be in the future (Lisbon time).",
    };
  }

  // Overlapping *offers* are allowed. Only reject if the new window already
  // conflicts with a booked/held session (teacher is busy).
  const probe: SlotRow = {
    id: "__probe__",
    experience_slug: experienceSlug,
    starts_at: parsed.starts_at,
    day: parsed.day,
    status: "open",
    hold_token: null,
    hold_expires_at: null,
    created_at: "",
    updated_at: "",
  };
  const conflict = await findConflictingBusySlot(db, probe);
  if (conflict) {
    return {
      ok: false,
      day: parsed.day,
      reason: `Conflicts with ${conflict.experience_slug} at ${conflict.starts_at} (session + ${POST_SESSION_BUFFER_MIN} min buffer).`,
    };
  }

  const id = crypto.randomUUID();
  const ts = nowIso();
  await db
    .prepare(
      `INSERT INTO slots (
        id, experience_slug, starts_at, day, status,
        hold_token, hold_expires_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'open', NULL, NULL, ?, ?)`,
    )
    .bind(id, experienceSlug, parsed.starts_at, parsed.day, ts, ts)
    .run();

  const row = await getSlotById(db, id);
  if (!row) {
    return { ok: false, day: parsed.day, reason: "Insert failed." };
  }
  return { ok: true, slot: row };
}

/** ISO weekday: Mon=1 … Sun=7 for a `YYYY-MM-DD` calendar day. */
export function isoWeekday(day: string): number {
  const [y, m, d] = day.split("-").map(Number);
  const js = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return js === 0 ? 7 : js;
}

export function addDays(day: string, delta: number): string {
  const [y, m, d] = day.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + delta));
  const yyyy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Dates after `fromDate` through `fromDate + weeks`, matching ISO weekdays.
 * The seed day itself is excluded (already created).
 */
export function repeatDatesAfter(
  fromDate: string,
  weeks: number,
  weekdays: number[],
): string[] {
  if (weeks < 1 || weekdays.length === 0) return [];
  const wanted = new Set(weekdays);
  const end = addDays(fromDate, weeks * 7);
  const out: string[] = [];
  for (let d = addDays(fromDate, 1); d <= end; d = addDays(d, 1)) {
    if (wanted.has(isoWeekday(d))) out.push(d);
  }
  return out;
}
