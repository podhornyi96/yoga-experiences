/**
 * Gift certificates for Sunrise, Sunset, and Private / Tandem.
 * Prices come from the same helpers as checkout.
 */

import { insertBooking } from "./bookings";
import {
  sendGiftBuyerEmail,
  sendGiftRecipientEmail,
  sendGiftTeacherEmail,
  type EmailEnv,
  type GiftEmailPayload,
} from "./email";
import { lisbonDate, lisbonHour } from "./low-inventory-alert";
import { coastalPriceForPeople } from "./pricing";
import {
  blockConflictingSlots,
  expireHolds,
  getSlotById,
  isFutureStartsAt,
  nowIso,
  recomputeBlockedSlotsOnDay,
} from "./slots";
import {
  paymentIntentIdFromSession,
  type StripeCheckoutSessionObject,
} from "./stripe";

export const GIFT_VALIDITY_MS = 365 * 24 * 60 * 60 * 1000;

export const GIFT_SLUGS = [
  "sunrise-yoga-lisbon",
  "sunset-yoga-ocean",
  "private-yoga-session",
] as const;

export type GiftSlug = (typeof GIFT_SLUGS)[number];

const PRIVATE_LOCATION_IDS = new Set([
  "estrela",
  "graca",
  "nacoes",
  "eduardo-vii",
]);

const SUNRISE_LOCATION_IDS = new Set([
  "portas-do-sol",
  "beato",
  "vasco-da-gama",
]);

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export type GiftRow = {
  id: string;
  code: string;
  experience_slug: string;
  people: number;
  amount_eur: number;
  buyer_name: string;
  buyer_email: string;
  recipient_name: string;
  recipient_email: string | null;
  message: string | null;
  deliver_on: string | null;
  buyer_email_sent_at: string | null;
  recipient_email_sent_at: string | null;
  status: "active" | "redeemed";
  expires_at: string;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  hold_token: string | null;
  hold_slot_id: string | null;
  hold_expires_at: string | null;
  redeemed_booking_id: string | null;
  redeemed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type GiftDisplayStatus = "active" | "redeemed" | "expired";

export function isGiftSlug(slug: string): slug is GiftSlug {
  return (GIFT_SLUGS as readonly string[]).includes(slug);
}

export function normalizeGiftCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function formatGiftCode(code: string): string {
  const normalized = normalizeGiftCode(code);
  if (normalized.length !== 8) return normalized;
  return `${normalized.slice(0, 4)}-${normalized.slice(4)}`;
}

export function giftAmountEur(slug: string, people: number): number | null {
  if (people !== 1 && people !== 2) return null;
  if (slug === "sunrise-yoga-lisbon" || slug === "sunset-yoga-ocean") {
    return coastalPriceForPeople(people);
  }
  if (slug === "private-yoga-session") return people === 2 ? 80 : 45;
  return null;
}

export function giftTitle(slug: string, people: number): string {
  if (slug === "sunrise-yoga-lisbon") return "Sunrise Yoga";
  if (slug === "sunset-yoga-ocean") return "Sunset Yoga by the Ocean";
  if (slug === "private-yoga-session") {
    return people >= 2 ? "Tandem Yoga" : "Private Yoga Session";
  }
  return slug;
}

export function giftPagePath(slug: string, people: number): string {
  if (slug === "private-yoga-session" && people >= 2) {
    return "/experiences/private-yoga-tandem/";
  }
  return `/experiences/${slug}/`;
}

export function giftDisplayStatus(row: GiftRow, now = nowIso()): GiftDisplayStatus {
  if (row.status === "redeemed") return "redeemed";
  if (row.expires_at <= now) return "expired";
  return "active";
}

function randomCode(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const byte of bytes) out += CODE_ALPHABET[byte % CODE_ALPHABET.length];
  return out;
}

export function addMonthsToIsoDate(isoDate: string, months: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y, (m ?? 1) - 1 + months, d || 1, 12));
  return dt.toISOString().slice(0, 10);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type GiftPurchaseInput = {
  slug: string;
  people: number;
  buyerName: string;
  buyerEmail: string;
  recipientName: string;
  recipientEmail: string;
  message: string;
  deliverOn: string;
};

export type ValidGiftPurchase = {
  slug: GiftSlug;
  people: 1 | 2;
  amountEur: number;
  buyerName: string;
  buyerEmail: string;
  recipientName: string;
  recipientEmail: string | null;
  message: string | null;
  /** Set only when the recipient email should wait for a future Lisbon morning. */
  deliverOn: string | null;
};

export function validateGiftPurchase(
  input: GiftPurchaseInput,
  opts?: { today?: string; allowPastDeliverOn?: boolean },
): { ok: true; value: ValidGiftPurchase } | { ok: false; error: string } {
  const today = opts?.today ?? lisbonDate();
  const slug = input.slug.trim();
  const people = Math.floor(Number(input.people));
  if (!isGiftSlug(slug)) return { ok: false, error: "Choose a gift." };
  const amountEur = giftAmountEur(slug, people);
  if (amountEur == null || (people !== 1 && people !== 2)) {
    return { ok: false, error: "Choose 1 or 2 people." };
  }

  const buyerName = input.buyerName.trim().slice(0, 80);
  const recipientName = input.recipientName.trim().slice(0, 80);
  const buyerEmail = input.buyerEmail.trim().toLowerCase();
  const recipientEmailRaw = input.recipientEmail.trim().toLowerCase();
  const message = input.message.trim().replace(/\s+/g, " ").slice(0, 400);
  const deliverOnRaw = input.deliverOn.trim();

  if (!buyerName) return { ok: false, error: "Add your name." };
  if (!EMAIL_RE.test(buyerEmail)) {
    return { ok: false, error: "Add a valid email for the receipt." };
  }
  if (!recipientName) return { ok: false, error: "Add the recipient's name." };
  if (recipientEmailRaw && !EMAIL_RE.test(recipientEmailRaw)) {
    return { ok: false, error: "Recipient email looks invalid." };
  }

  let deliverOn: string | null = null;
  if (deliverOnRaw) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(deliverOnRaw)) {
      return { ok: false, error: "Choose a valid delivery date." };
    }
    const [year, month, day] = deliverOnRaw.split("-").map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    if (
      parsed.getUTCFullYear() !== year ||
      parsed.getUTCMonth() !== month - 1 ||
      parsed.getUTCDate() !== day
    ) {
      return { ok: false, error: "Choose a valid delivery date." };
    }
    if (!recipientEmailRaw) {
      return {
        ok: false,
        error: "Add the recipient's email to schedule delivery.",
      };
    }
    const latest = addMonthsToIsoDate(today, 11);
    if (deliverOnRaw < today) {
      if (!opts?.allowPastDeliverOn) {
        return { ok: false, error: "Delivery date can't be in the past." };
      }
    } else if (deliverOnRaw > latest) {
      return { ok: false, error: "Pick a delivery date within 11 months." };
    }
    // Today (or a missed date on a late webhook) sends immediately.
    if (deliverOnRaw > today) deliverOn = deliverOnRaw;
  }

  return {
    ok: true,
    value: {
      slug,
      people: people === 2 ? 2 : 1,
      amountEur,
      buyerName,
      buyerEmail,
      recipientName,
      recipientEmail: recipientEmailRaw || null,
      message: message || null,
      deliverOn,
    },
  };
}

export async function getGiftByCode(
  db: D1Database,
  code: string,
): Promise<GiftRow | null> {
  const normalized = normalizeGiftCode(code);
  if (normalized.length !== 8) return null;
  return (
    (await db
      .prepare(`SELECT * FROM gifts WHERE code = ? LIMIT 1`)
      .bind(normalized)
      .first<GiftRow>()) ?? null
  );
}

export async function getGiftByStripeSession(
  db: D1Database,
  sessionId: string,
): Promise<GiftRow | null> {
  return (
    (await db
      .prepare(
        `SELECT * FROM gifts WHERE stripe_checkout_session_id = ? LIMIT 1`,
      )
      .bind(sessionId)
      .first<GiftRow>()) ?? null
  );
}

export function publicGift(row: GiftRow, now = nowIso()) {
  const people = row.people === 2 ? 2 : 1;
  return {
    status: giftDisplayStatus(row, now),
    code: row.code,
    displayCode: formatGiftCode(row.code),
    experienceSlug: row.experience_slug,
    pagePath: giftPagePath(row.experience_slug, people),
    title: giftTitle(row.experience_slug, people),
    people,
    amountEur: row.amount_eur,
    recipientName: row.recipient_name,
    recipientEmail: row.recipient_email,
    expiresAt: row.expires_at,
    message: row.message,
  };
}

export function adminGift(row: GiftRow, now = nowIso()) {
  return {
    ...publicGift(row, now),
    id: row.id,
    buyerName: row.buyer_name,
    buyerEmail: row.buyer_email,
    deliverOn: row.deliver_on,
    buyerEmailSentAt: row.buyer_email_sent_at,
    recipientEmailSentAt: row.recipient_email_sent_at,
    redeemedBookingId: row.redeemed_booking_id,
    redeemedAt: row.redeemed_at,
    createdAt: row.created_at,
    holdActive: Boolean(
      row.status === "active" &&
        row.hold_expires_at &&
        row.hold_expires_at > now,
    ),
  };
}

async function insertGift(
  db: D1Database,
  input: ValidGiftPurchase & {
    stripeCheckoutSessionId: string;
    stripePaymentIntentId: string | null;
  },
): Promise<GiftRow> {
  const id = crypto.randomUUID();
  const ts = nowIso();
  const expiresAt = new Date(Date.now() + GIFT_VALIDITY_MS).toISOString();

  let code = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    code = randomCode();
    try {
      await db
        .prepare(
          `INSERT INTO gifts (
            id, code, experience_slug, people, amount_eur,
            buyer_name, buyer_email, recipient_name, recipient_email, message,
            deliver_on, status, expires_at,
            stripe_checkout_session_id, stripe_payment_intent_id,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?)`,
        )
        .bind(
          id,
          code,
          input.slug,
          input.people,
          input.amountEur,
          input.buyerName,
          input.buyerEmail,
          input.recipientName,
          input.recipientEmail,
          input.message,
          input.deliverOn,
          expiresAt,
          input.stripeCheckoutSessionId,
          input.stripePaymentIntentId,
          ts,
          ts,
        )
        .run();
      const row = await getGiftByCode(db, code);
      if (!row) throw new Error("Gift insert failed.");
      return row;
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (attempt < 4 && /idx_gifts_code|UNIQUE/i.test(message)) continue;
      throw err;
    }
  }
  throw new Error("Could not allocate a gift code.");
}

function emailPayload(row: GiftRow): GiftEmailPayload {
  const people = row.people === 2 ? 2 : 1;
  return {
    code: row.code,
    displayCode: formatGiftCode(row.code),
    buyerName: row.buyer_name,
    buyerEmail: row.buyer_email,
    recipientName: row.recipient_name,
    recipientEmail: row.recipient_email,
    message: row.message,
    title: giftTitle(row.experience_slug, people),
    people,
    amountEur: row.amount_eur,
    expiresAt: row.expires_at,
    deliverOn: row.deliver_on,
    pagePath: giftPagePath(row.experience_slug, people),
  };
}

async function markEmailSent(
  db: D1Database,
  id: string,
  column: "buyer_email_sent_at" | "recipient_email_sent_at",
): Promise<void> {
  const ts = nowIso();
  await db
    .prepare(
      `UPDATE gifts SET ${column} = ?, updated_at = ? WHERE id = ? AND ${column} IS NULL`,
    )
    .bind(ts, ts, id)
    .run();
}

/** Send any certificate emails that have not gone out yet. */
export async function sendPendingGiftEmails(
  db: D1Database,
  row: GiftRow,
  env: EmailEnv,
): Promise<void> {
  const payload = emailPayload(row);
  if (!row.buyer_email_sent_at) {
    const buyer = await sendGiftBuyerEmail(env, payload);
    if (buyer.sent) await markEmailSent(db, row.id, "buyer_email_sent_at");
  }

  const sendRecipientNow = Boolean(row.recipient_email) && !row.deliver_on;
  if (sendRecipientNow && !row.recipient_email_sent_at) {
    const recipient = await sendGiftRecipientEmail(env, payload);
    if (recipient.sent) {
      await markEmailSent(db, row.id, "recipient_email_sent_at");
    }
  }

}

export async function fulfillGiftCheckout(
  db: D1Database,
  session: StripeCheckoutSessionObject,
  env: EmailEnv,
): Promise<
  | { ok: true; body: Record<string, unknown> }
  | { ok: false; error: string; status: number }
> {
  const sessionId = session.id?.trim();
  if (!sessionId) return { ok: false, error: "Missing session id.", status: 400 };

  const existing = await getGiftByStripeSession(db, sessionId);
  if (existing) {
    await sendPendingGiftEmails(db, existing, env);
    return {
      ok: true,
      body: { received: true, status: "already_issued", giftId: existing.id },
    };
  }

  const meta = session.metadata ?? {};
  const purchase = validateGiftPurchase(
    {
      slug: meta.slug ?? "",
      people: Number(meta.people),
      buyerName: meta.buyerName ?? "",
      buyerEmail: meta.buyerEmail ?? session.customer_details?.email ?? "",
      recipientName: meta.recipientName ?? "",
      recipientEmail: meta.recipientEmail ?? "",
      message: meta.message ?? "",
      deliverOn: meta.deliverOn ?? "",
    },
    { allowPastDeliverOn: true },
  );
  if (!purchase.ok) {
    console.error("[gifts] invalid checkout metadata", purchase.error);
    return { ok: false, error: purchase.error, status: 400 };
  }

  const expectedCents = Math.round(purchase.value.amountEur * 100);
  if (
    typeof session.amount_total === "number" &&
    session.amount_total !== expectedCents
  ) {
    console.error("[gifts] amount mismatch", {
      sessionId,
      expectedCents,
      amountTotal: session.amount_total,
    });
    return { ok: false, error: "Paid amount does not match the gift.", status: 400 };
  }

  const gift = await insertGift(db, {
    ...purchase.value,
    stripeCheckoutSessionId: sessionId,
    stripePaymentIntentId: paymentIntentIdFromSession(session),
  });
  await sendPendingGiftEmails(db, gift, env);
  await sendGiftTeacherEmail(env, emailPayload(gift));
  return {
    ok: true,
    body: { received: true, status: "issued", giftId: gift.id },
  };
}

export async function listGifts(db: D1Database): Promise<GiftRow[]> {
  const { results } = await db
    .prepare(`SELECT * FROM gifts ORDER BY created_at DESC LIMIT 200`)
    .all<GiftRow>();
  return results ?? [];
}

export type RedeemInput = {
  code: string;
  holdToken: string;
  slotId: string;
  guestName: string;
  guestEmail: string;
  locationId: string;
};

export async function redeemGift(
  db: D1Database,
  input: RedeemInput,
): Promise<
  | { ok: true; bookingId: string }
  | { ok: false; error: string; status: number }
> {
  if (!input.holdToken || !input.slotId) {
    return { ok: false, error: "Hold this date before booking.", status: 400 };
  }

  await expireHolds(db);

  const gift = await getGiftByCode(db, input.code);
  if (!gift) return { ok: false, error: "Gift code not found.", status: 404 };
  const shown = giftDisplayStatus(gift);
  if (shown === "redeemed") {
    return { ok: false, error: "This gift has already been used.", status: 409 };
  }
  if (shown === "expired") {
    return { ok: false, error: "This gift has expired.", status: 409 };
  }

  const guestName = input.guestName.trim().slice(0, 80);
  const guestEmail = input.guestEmail.trim().toLowerCase();
  if (!guestName) return { ok: false, error: "Add your name.", status: 400 };
  if (!EMAIL_RE.test(guestEmail)) {
    return { ok: false, error: "Add a valid email.", status: 400 };
  }

  const slot = await getSlotById(db, input.slotId);
  if (!slot || slot.status === "cancelled" || slot.status === "blocked") {
    return { ok: false, error: "Slot not found.", status: 404 };
  }
  if (slot.kind === "event") {
    return { ok: false, error: "This gift can't be used on that session.", status: 409 };
  }
  if (slot.experience_slug !== gift.experience_slug) {
    return { ok: false, error: "This gift is for a different experience.", status: 409 };
  }
  if (!isFutureStartsAt(slot.starts_at)) {
    return { ok: false, error: "This slot is in the past.", status: 409 };
  }
  if (slot.status !== "held" || slot.hold_token !== input.holdToken) {
    return { ok: false, error: "Hold this date before booking.", status: 409 };
  }
  if (slot.hold_expires_at && slot.hold_expires_at < nowIso()) {
    return { ok: false, error: "Your hold expired. Pick the date again.", status: 409 };
  }

  const locationId = input.locationId.trim();
  if (gift.experience_slug === "private-yoga-session") {
    if (!PRIVATE_LOCATION_IDS.has(locationId)) {
      return { ok: false, error: "Choose a park location to continue.", status: 400 };
    }
  } else if (gift.experience_slug === "sunrise-yoga-lisbon") {
    if (!SUNRISE_LOCATION_IDS.has(locationId)) {
      return { ok: false, error: "Choose a location to continue.", status: 400 };
    }
  }

  const ts = nowIso();
  const reserved = await db
    .prepare(
      `UPDATE gifts
       SET hold_token = ?,
           hold_slot_id = ?,
           hold_expires_at = ?,
           updated_at = ?
       WHERE id = ?
         AND status = 'active'
         AND expires_at > ?
         AND (
           hold_token IS NULL
           OR hold_expires_at IS NULL
           OR hold_expires_at < ?
           OR hold_token = ?
         )`,
    )
    .bind(
      input.holdToken,
      slot.id,
      slot.hold_expires_at,
      ts,
      gift.id,
      ts,
      ts,
      input.holdToken,
    )
    .run();

  if (!reserved.meta.changes) {
    return {
      ok: false,
      error: "This gift is already being used to book a time. Try again shortly.",
      status: 409,
    };
  }

  const booked = await db
    .prepare(
      `UPDATE slots
       SET status = 'booked',
           hold_token = NULL,
           hold_expires_at = NULL,
           updated_at = ?
       WHERE id = ?
         AND status = 'held'
         AND hold_token = ?`,
    )
    .bind(ts, slot.id, input.holdToken)
    .run();

  if (!booked.meta.changes) {
    await clearGiftHold(db, gift.id, ts);
    return {
      ok: false,
      error: "Your hold expired. Pick the date again.",
      status: 409,
    };
  }

  let bookingId = "";
  try {
    const booking = await insertBooking(db, {
      slotId: slot.id,
      experienceSlug: slot.experience_slug,
      startsAt: slot.starts_at,
      guestEmail,
      guestName,
      people: gift.people,
      mats: 0,
      totalEur: gift.amount_eur,
      depositEur: gift.amount_eur,
      remainingEur: 0,
      paymentStatus: "paid_in_full",
      notes: `Gift ${formatGiftCode(gift.code)}`,
      locationId: locationId || null,
    });
    bookingId = booking.id;
  } catch (err) {
    await db
      .prepare(
        `UPDATE slots
         SET status = 'open',
             hold_token = NULL,
             hold_expires_at = NULL,
             updated_at = ?
         WHERE id = ?`,
      )
      .bind(ts, slot.id)
      .run();
    await clearGiftHold(db, gift.id, ts);
    await recomputeBlockedSlotsOnDay(db, slot.day, ts);
    const message = err instanceof Error ? err.message : "Could not create the booking.";
    return { ok: false, error: message, status: 500 };
  }

  const redeemed = await db
    .prepare(
      `UPDATE gifts
       SET status = 'redeemed',
           redeemed_booking_id = ?,
           redeemed_at = ?,
           hold_token = NULL,
           hold_slot_id = NULL,
           hold_expires_at = NULL,
           updated_at = ?
       WHERE id = ?
         AND status = 'active'`,
    )
    .bind(bookingId, ts, ts, gift.id)
    .run();

  if (!redeemed.meta.changes) {
    console.error("[gifts] booking created but gift was not marked redeemed", {
      giftId: gift.id,
      bookingId,
    });
  }

  const updated = await getSlotById(db, slot.id);
  if (updated) await blockConflictingSlots(db, updated, ts);

  return { ok: true, bookingId };
}

async function clearGiftHold(
  db: D1Database,
  giftId: string,
  ts: string,
): Promise<void> {
  await db
    .prepare(
      `UPDATE gifts
       SET hold_token = NULL,
           hold_slot_id = NULL,
           hold_expires_at = NULL,
           updated_at = ?
       WHERE id = ?
         AND status = 'active'`,
    )
    .bind(ts, giftId)
    .run();
}

/**
 * Recipient emails scheduled for a future date.
 * Sent at 11:00 Europe/Lisbon on that day. Missed dates are sent on the next run.
 */
export async function deliverDueGiftEmails(
  db: D1Database,
  env: EmailEnv,
  opts: { force: boolean },
): Promise<{ sent: number; failed: number }> {
  const today = lisbonDate();
  const includeToday = opts.force || lisbonHour() === 11;
  const { results } = await db
    .prepare(
      `SELECT * FROM gifts
       WHERE status = 'active'
         AND recipient_email IS NOT NULL
         AND recipient_email_sent_at IS NULL
         AND deliver_on IS NOT NULL
         AND (deliver_on < ? OR (? = 1 AND deliver_on <= ?))`,
    )
    .bind(today, includeToday ? 1 : 0, today)
    .all<GiftRow>();

  let sent = 0;
  let failed = 0;
  const now = nowIso();
  for (const row of results ?? []) {
    if (row.expires_at <= now) continue;
    const result = await sendGiftRecipientEmail(env, emailPayload(row));
    if (!result.sent) {
      failed += 1;
      continue;
    }
    await markEmailSent(db, row.id, "recipient_email_sent_at");
    sent += 1;
  }
  return { sent, failed };
}
