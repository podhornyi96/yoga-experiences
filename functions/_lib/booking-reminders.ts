/**
 * Guest session reminders (24h / 12h / 3h) + teacher morning/evening digests.
 * All times are Europe/Lisbon wall clock (same as slots.starts_at).
 */

import type { BookingRow } from "./bookings";
import {
  sendBookingReminder,
  sendTeacherScheduleDigest,
  type EmailEnv,
  type ReminderWindowHours,
  type TeacherDigestKind,
  type TeacherDigestSlot,
} from "./email";
import { lisbonWallClock } from "./booking-lead-time";
import { lisbonDate, lisbonHour } from "./low-inventory-alert";
import { nowIso } from "./slots";

export const REMINDER_WINDOWS: ReminderWindowHours[] = [24, 12, 3];

/** Skip the 3h guest window overnight (sunrise would land ~03:30). */
export const QUIET_HOUR_START = 0;
export const QUIET_HOUR_END = 7;

export const TEACHER_EVENING_HOUR = 20;
export const TEACHER_MORNING_HOUR = 7;

type ReminderColumn =
  | "reminder_24h_sent_at"
  | "reminder_12h_sent_at"
  | "reminder_3h_sent_at";

const WINDOW_COLUMN: Record<ReminderWindowHours, ReminderColumn> = {
  24: "reminder_24h_sent_at",
  12: "reminder_12h_sent_at",
  3: "reminder_3h_sent_at",
};

/** Parse Lisbon wall `YYYY-MM-DDTHH:mm` as abstract UTC millis for diffs. */
function wallToMs(wall: string): number {
  const [datePart, timePart = "00:00"] = wall.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh, mm] = timePart.split(":").map(Number);
  return Date.UTC(y, (m || 1) - 1, d || 1, hh || 0, mm || 0);
}

function msToWall(ms: number): string {
  const dt = new Date(ms);
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dt.getUTCDate()).padStart(2, "0");
  const hh = String(dt.getUTCHours()).padStart(2, "0");
  const mm = String(dt.getUTCMinutes()).padStart(2, "0");
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

export function hoursUntilStart(startsAt: string, now = new Date()): number {
  const nowWall = lisbonWallClock(now);
  return (wallToMs(startsAt) - wallToMs(nowWall)) / 3_600_000;
}

export function isQuietHour(hour: number): boolean {
  return hour >= QUIET_HOUR_START && hour < QUIET_HOUR_END;
}

/** True when this window's 1-hour cron band is active. */
export function isReminderWindowDue(
  hoursUntil: number,
  windowHours: ReminderWindowHours,
): boolean {
  return hoursUntil <= windowHours && hoursUntil > windowHours - 1;
}

function reminderAlreadySent(
  booking: BookingRow,
  windowHours: ReminderWindowHours,
): boolean {
  const col = WINDOW_COLUMN[windowHours];
  return Boolean(booking[col]);
}

function addCalendarDays(dateYmd: string, days: number): string {
  const [y, m, d] = dateYmd.split("-").map(Number);
  const ms = Date.UTC(y, m - 1, d) + days * 86_400_000;
  const dt = new Date(ms);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function teacherDigestId(
  kind: TeacherDigestKind,
  sessionDate: string,
): string {
  return `${kind}:${sessionDate}`;
}

async function listActiveBookingsInRange(
  db: D1Database,
  fromWallInclusive: string,
  toWallExclusive: string,
): Promise<BookingRow[]> {
  const { results } = await db
    .prepare(
      `SELECT * FROM bookings
       WHERE payment_status IN ('deposit_paid', 'paid_in_full')
         AND starts_at >= ?
         AND starts_at < ?
       ORDER BY starts_at ASC, created_at ASC`,
    )
    .bind(fromWallInclusive, toWallExclusive)
    .all<BookingRow>();
  return results ?? [];
}

async function markGuestReminderSent(
  db: D1Database,
  bookingId: string,
  windowHours: ReminderWindowHours,
  sentAt: string,
): Promise<void> {
  const col = WINDOW_COLUMN[windowHours];
  await db
    .prepare(
      `UPDATE bookings SET ${col} = ?, updated_at = ? WHERE id = ? AND ${col} IS NULL`,
    )
    .bind(sentAt, sentAt, bookingId)
    .run();
}

async function digestAlreadySent(
  db: D1Database,
  id: string,
): Promise<boolean> {
  const row = await db
    .prepare(`SELECT id FROM teacher_reminder_digests WHERE id = ?`)
    .bind(id)
    .first<{ id: string }>();
  return Boolean(row);
}

async function markDigestSent(
  db: D1Database,
  id: string,
  sentAt: string,
): Promise<void> {
  await db
    .prepare(
      `INSERT OR IGNORE INTO teacher_reminder_digests (id, sent_at) VALUES (?, ?)`,
    )
    .bind(id, sentAt)
    .run();
}

function groupBookingsIntoSlots(bookings: BookingRow[]): TeacherDigestSlot[] {
  const bySlot = new Map<string, BookingRow[]>();
  for (const booking of bookings) {
    const list = bySlot.get(booking.slot_id) ?? [];
    list.push(booking);
    bySlot.set(booking.slot_id, list);
  }

  const slots: TeacherDigestSlot[] = [];
  for (const group of bySlot.values()) {
    const first = group[0];
    if (!first) continue;
    slots.push({
      startsAt: first.starts_at,
      experienceSlug: first.experience_slug,
      locationId: first.location_id,
      guests: group.map((b) => ({
        bookingId: b.id,
        name: b.guest_name,
        email: b.guest_email,
        phone: b.guest_phone,
        people: b.people,
        mats: b.mats,
      })),
    });
  }

  slots.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  return slots;
}

export type GuestReminderRunResult = {
  checked: number;
  sent: number;
  failed: number;
  skippedQuiet: number;
  details: Array<{
    bookingId: string;
    windowHours: ReminderWindowHours;
    status: "sent" | "failed" | "skipped_quiet" | "skipped_no_email";
    reason?: string;
  }>;
};

export async function runGuestReminders(
  db: D1Database,
  env: EmailEnv,
  opts?: { force?: boolean; now?: Date },
): Promise<GuestReminderRunResult> {
  const now = opts?.now ?? new Date();
  const force = Boolean(opts?.force);
  const hour = lisbonHour(now);
  const quiet = !force && isQuietHour(hour);

  const nowWall = lisbonWallClock(now);
  const horizonWall = msToWall(wallToMs(nowWall) + 25 * 3_600_000);

  const candidates = await listActiveBookingsInRange(
    db,
    nowWall,
    horizonWall,
  );

  const result: GuestReminderRunResult = {
    checked: candidates.length,
    sent: 0,
    failed: 0,
    skippedQuiet: 0,
    details: [],
  };

  for (const booking of candidates) {
    const hoursUntil = hoursUntilStart(booking.starts_at, now);
    if (hoursUntil <= 0) continue;

    for (const windowHours of REMINDER_WINDOWS) {
      if (reminderAlreadySent(booking, windowHours)) continue;
      if (!isReminderWindowDue(hoursUntil, windowHours)) continue;

      // Quiet hours only block the 3h window (overnight sunrise).
      if (quiet && windowHours === 3) {
        result.skippedQuiet += 1;
        result.details.push({
          bookingId: booking.id,
          windowHours,
          status: "skipped_quiet",
        });
        continue;
      }

      if (!booking.guest_email?.trim()) {
        result.details.push({
          bookingId: booking.id,
          windowHours,
          status: "skipped_no_email",
        });
        continue;
      }

      const send = await sendBookingReminder(booking, env, windowHours);
      if (!send.sent) {
        result.failed += 1;
        result.details.push({
          bookingId: booking.id,
          windowHours,
          status: "failed",
          reason: send.reason,
        });
        continue;
      }

      const sentAt = nowIso();
      await markGuestReminderSent(db, booking.id, windowHours, sentAt);
      booking[WINDOW_COLUMN[windowHours]] = sentAt;
      result.sent += 1;
      result.details.push({
        bookingId: booking.id,
        windowHours,
        status: "sent",
      });
    }
  }

  return result;
}

export type TeacherDigestRunResult = {
  kind: TeacherDigestKind | null;
  sessionDate: string | null;
  sent: boolean;
  skipped?: string;
  emailSent?: boolean;
  telegramSent?: boolean;
  slotCount?: number;
  guestCount?: number;
};

async function runOneTeacherDigest(
  db: D1Database,
  env: EmailEnv,
  kind: TeacherDigestKind,
  sessionDate: string,
): Promise<TeacherDigestRunResult> {
  const id = teacherDigestId(kind, sessionDate);
  if (await digestAlreadySent(db, id)) {
    return {
      kind,
      sessionDate,
      sent: false,
      skipped: "already_sent",
    };
  }

  const dayStart = `${sessionDate}T00:00`;
  const dayEnd = `${addCalendarDays(sessionDate, 1)}T00:00`;
  const bookings = await listActiveBookingsInRange(db, dayStart, dayEnd);

  if (bookings.length === 0) {
    return {
      kind,
      sessionDate,
      sent: false,
      skipped: "no_bookings",
      slotCount: 0,
      guestCount: 0,
    };
  }

  const slots = groupBookingsIntoSlots(bookings);
  const guestCount = bookings.length;
  const delivery = await sendTeacherScheduleDigest(env, {
    kind,
    sessionDate,
    slots,
  });

  if (!delivery.emailSent && !delivery.telegramSent) {
    return {
      kind,
      sessionDate,
      sent: false,
      skipped: delivery.reason ?? "send_failed",
      emailSent: false,
      telegramSent: false,
      slotCount: slots.length,
      guestCount,
    };
  }

  await markDigestSent(db, id, nowIso());
  return {
    kind,
    sessionDate,
    sent: true,
    emailSent: delivery.emailSent,
    telegramSent: delivery.telegramSent,
    slotCount: slots.length,
    guestCount,
  };
}

export async function runTeacherDigests(
  db: D1Database,
  env: EmailEnv,
  opts?: { force?: boolean; now?: Date },
): Promise<TeacherDigestRunResult[]> {
  const now = opts?.now ?? new Date();
  const force = Boolean(opts?.force);
  const hour = lisbonHour(now);
  const today = lisbonDate(now);
  const tomorrow = addCalendarDays(today, 1);

  const jobs: Array<{ kind: TeacherDigestKind; sessionDate: string }> = [];

  if (force || hour === TEACHER_MORNING_HOUR) {
    jobs.push({ kind: "morning", sessionDate: today });
  }
  if (force || hour === TEACHER_EVENING_HOUR) {
    jobs.push({ kind: "evening", sessionDate: tomorrow });
  }

  if (jobs.length === 0) {
    return [
      {
        kind: null,
        sessionDate: null,
        sent: false,
        skipped: "outside_lisbon_window",
      },
    ];
  }

  const results: TeacherDigestRunResult[] = [];
  for (const job of jobs) {
    results.push(await runOneTeacherDigest(db, env, job.kind, job.sessionDate));
  }
  return results;
}

export async function runBookingReminders(
  db: D1Database,
  env: EmailEnv,
  opts?: { force?: boolean; now?: Date },
): Promise<{
  lisbonHour: number;
  guests: GuestReminderRunResult;
  teacher: TeacherDigestRunResult[];
}> {
  const now = opts?.now ?? new Date();
  const guests = await runGuestReminders(db, env, opts);
  const teacher = await runTeacherDigests(db, env, opts);
  return {
    lisbonHour: lisbonHour(now),
    guests,
    teacher,
  };
}
