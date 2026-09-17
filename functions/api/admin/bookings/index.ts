/**
 * GET /api/admin/bookings?status=optional&slug=optional
 * Lists bookings for admin (nearest session first).
 */

import {
  publicBooking,
  type BookingPaymentStatus,
  type BookingRow,
} from "../../../_lib/bookings";
import { isAdminAuthenticated } from "../../../_lib/auth";
import { error, json } from "../../../_lib/http";
import { isScheduledSlug, type Env } from "../../../_lib/types";

const STATUSES: BookingPaymentStatus[] = [
  "deposit_paid",
  "paid_in_full",
  "cancelled",
  "refunded",
];

async function requireAdmin(
  request: Request,
  env: Env,
): Promise<Response | null> {
  if (!(await isAdminAuthenticated(request, env))) {
    return error("Unauthorized.", 401);
  }
  if (!env.DB) return error("Schedule database is not configured.", 503);
  return null;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const denied = await requireAdmin(request, env);
  if (denied) return denied;

  const url = new URL(request.url);
  const status = url.searchParams.get("status")?.trim() as
    | BookingPaymentStatus
    | undefined;
  const slug = url.searchParams.get("slug")?.trim();

  if (status && !STATUSES.includes(status)) {
    return error("Invalid payment status filter.", 400);
  }
  if (slug && !isScheduledSlug(slug)) {
    return error("Unknown experience slug.", 400);
  }

  let rows: BookingRow[];
  if (status && slug) {
    const { results } = await env.DB.prepare(
      `SELECT * FROM bookings
       WHERE payment_status = ? AND experience_slug = ?
       ORDER BY starts_at ASC, created_at ASC`,
    )
      .bind(status, slug)
      .all<BookingRow>();
    rows = results ?? [];
  } else if (status) {
    const { results } = await env.DB.prepare(
      `SELECT * FROM bookings
       WHERE payment_status = ?
       ORDER BY starts_at ASC, created_at ASC`,
    )
      .bind(status)
      .all<BookingRow>();
    rows = results ?? [];
  } else if (slug) {
    const { results } = await env.DB.prepare(
      `SELECT * FROM bookings
       WHERE experience_slug = ?
       ORDER BY starts_at ASC, created_at ASC`,
    )
      .bind(slug)
      .all<BookingRow>();
    rows = results ?? [];
  } else {
    const { results } = await env.DB.prepare(
      `SELECT * FROM bookings
       ORDER BY starts_at ASC, created_at ASC`,
    ).all<BookingRow>();
    rows = results ?? [];
  }

  return json({ bookings: rows.map(publicBooking) });
};
