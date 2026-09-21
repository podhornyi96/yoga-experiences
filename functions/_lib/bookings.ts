import { nowIso } from "./slots";

export type BookingPaymentStatus =
  | "deposit_paid"
  | "paid_in_full"
  | "cancelled"
  | "refunded";

export interface BookingRow {
  id: string;
  slot_id: string;
  experience_slug: string;
  starts_at: string;
  guest_email: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  people: number;
  mats: number;
  total_eur: number;
  deposit_eur: number;
  remaining_eur: number;
  payment_status: BookingPaymentStatus;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  notes: string | null;
  paid_in_full_at: string | null;
  location_id: string | null;
  created_at: string;
  updated_at: string;
}

export function publicBooking(row: BookingRow) {
  return {
    id: row.id,
    slotId: row.slot_id,
    experienceSlug: row.experience_slug,
    startsAt: row.starts_at,
    guestEmail: row.guest_email,
    guestName: row.guest_name,
    guestPhone: row.guest_phone,
    people: row.people,
    mats: row.mats,
    totalEur: row.total_eur,
    depositEur: row.deposit_eur,
    remainingEur: row.remaining_eur,
    paymentStatus: row.payment_status,
    stripeCheckoutSessionId: row.stripe_checkout_session_id,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    notes: row.notes,
    paidInFullAt: row.paid_in_full_at,
    locationId: row.location_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getBookingById(
  db: D1Database,
  id: string,
): Promise<BookingRow | null> {
  return (
    (await db
      .prepare(`SELECT * FROM bookings WHERE id = ?`)
      .bind(id)
      .first<BookingRow>()) ?? null
  );
}

export async function getBookingByStripeSession(
  db: D1Database,
  sessionId: string,
): Promise<BookingRow | null> {
  return (
    (await db
      .prepare(
        `SELECT * FROM bookings WHERE stripe_checkout_session_id = ? LIMIT 1`,
      )
      .bind(sessionId)
      .first<BookingRow>()) ?? null
  );
}

export async function listActiveBookingsForSlot(
  db: D1Database,
  slotId: string,
): Promise<BookingRow[]> {
  const { results } = await db
    .prepare(
      `SELECT * FROM bookings
       WHERE slot_id = ?
         AND payment_status IN ('deposit_paid', 'paid_in_full')
       ORDER BY created_at DESC`,
    )
    .bind(slotId)
    .all<BookingRow>();
  return results ?? [];
}

export type InsertBookingInput = {
  slotId: string;
  experienceSlug: string;
  startsAt: string;
  guestEmail?: string | null;
  guestName?: string | null;
  guestPhone?: string | null;
  people: number;
  mats: number;
  totalEur: number;
  depositEur: number;
  remainingEur: number;
  paymentStatus: BookingPaymentStatus;
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  notes?: string | null;
  locationId?: string | null;
  paidInFullAt?: string | null;
};

export async function insertBooking(
  db: D1Database,
  input: InsertBookingInput,
): Promise<BookingRow> {
  const id = crypto.randomUUID();
  const ts = nowIso();
  const paidInFullAt =
    input.paidInFullAt ??
    (input.paymentStatus === "paid_in_full" ? ts : null);
  await db
    .prepare(
      `INSERT INTO bookings (
        id, slot_id, experience_slug, starts_at,
        guest_email, guest_name, guest_phone,
        people, mats, total_eur, deposit_eur, remaining_eur,
        payment_status, stripe_checkout_session_id, stripe_payment_intent_id,
        notes, paid_in_full_at, location_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      input.slotId,
      input.experienceSlug,
      input.startsAt,
      input.guestEmail ?? null,
      input.guestName ?? null,
      input.guestPhone ?? null,
      input.people,
      input.mats,
      input.totalEur,
      input.depositEur,
      input.remainingEur,
      input.paymentStatus,
      input.stripeCheckoutSessionId ?? null,
      input.stripePaymentIntentId ?? null,
      input.notes ?? null,
      paidInFullAt,
      input.locationId ?? null,
      ts,
      ts,
    )
    .run();

  const row = await getBookingById(db, id);
  if (!row) throw new Error("Booking insert failed.");
  return row;
}

export async function cancelActiveBookingsForSlot(
  db: D1Database,
  slotId: string,
  status: "cancelled" | "refunded" = "cancelled",
): Promise<number> {
  const ts = nowIso();
  const result = await db
    .prepare(
      `UPDATE bookings
       SET payment_status = ?,
           updated_at = ?
       WHERE slot_id = ?
         AND payment_status IN ('deposit_paid', 'paid_in_full')`,
    )
    .bind(status, ts, slotId)
    .run();
  return result.meta.changes ?? 0;
}
