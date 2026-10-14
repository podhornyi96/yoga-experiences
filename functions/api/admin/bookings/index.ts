/**
 * GET /api/admin/bookings?status=optional&slug=optional&scope=upcoming|past
 * Lists bookings for admin (nearest session first for upcoming; recent past first).
 */

import {
  publicBooking,
  type BookingPaymentStatus,
  type BookingRow,
} from "../../../_lib/bookings";
import { lisbonWallClock } from "../../../_lib/booking-lead-time";
import { isAdminAuthenticated } from "../../../_lib/auth";
import { error, json } from "../../../_lib/http";
import { isBookableSlug, type Env } from "../../../_lib/types";

const STATUSES: BookingPaymentStatus[] = [
  "deposit_paid",
  "paid_in_full",
  "cancelled",
  "refunded",
];

const SCOPES = ["upcoming", "past"] as const;
type BookingTimeScope = (typeof SCOPES)[number];

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

function buildStatusClause(
  status: string | undefined,
): { sql: string; binds: string[] } {
  if (!status || status === "all") {
    return { sql: "", binds: [] };
  }
  if (status === "active") {
    return {
      sql: "payment_status IN ('deposit_paid', 'paid_in_full')",
      binds: [],
    };
  }
  return { sql: "payment_status = ?", binds: [status] };
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const denied = await requireAdmin(request, env);
  if (denied) return denied;

  const url = new URL(request.url);
  const statusParam = url.searchParams.get("status")?.trim() || "active";
  const slug = url.searchParams.get("slug")?.trim();
  const scopeParam = url.searchParams.get("scope")?.trim() || "upcoming";

  if (
    statusParam !== "active" &&
    statusParam !== "all" &&
    !STATUSES.includes(statusParam as BookingPaymentStatus)
  ) {
    return error("Invalid payment status filter.", 400);
  }
  if (slug && !isBookableSlug(slug)) {
    return error("Unknown experience slug.", 400);
  }
  if (!SCOPES.includes(scopeParam as BookingTimeScope)) {
    return error("Invalid scope. Use upcoming or past.", 400);
  }
  const scope = scopeParam as BookingTimeScope;

  const nowLocal = lisbonWallClock();
  const statusClause = buildStatusClause(
    statusParam === "all" ? undefined : statusParam,
  );

  const whereParts: string[] = [];
  const binds: string[] = [];

  if (statusClause.sql) {
    whereParts.push(statusClause.sql);
    binds.push(...statusClause.binds);
  }
  if (slug) {
    whereParts.push("experience_slug = ?");
    binds.push(slug);
  }

  const baseWhere = whereParts.length ? whereParts.join(" AND ") : "1=1";

  const upcomingWhere = `${baseWhere} AND starts_at > ?`;
  const pastWhere = `${baseWhere} AND starts_at <= ?`;

  const [upcomingCountRow, pastCountRow] = await Promise.all([
    env.DB.prepare(
      `SELECT COUNT(*) AS c FROM bookings WHERE ${upcomingWhere}`,
    )
      .bind(...binds, nowLocal)
      .first<{ c: number }>(),
    env.DB.prepare(`SELECT COUNT(*) AS c FROM bookings WHERE ${pastWhere}`)
      .bind(...binds, nowLocal)
      .first<{ c: number }>(),
  ]);

  const listWhere = scope === "upcoming" ? upcomingWhere : pastWhere;
  const orderBy =
    scope === "upcoming"
      ? "ORDER BY starts_at ASC, created_at ASC"
      : "ORDER BY starts_at DESC, created_at DESC";

  const { results } = await env.DB.prepare(
    `SELECT * FROM bookings WHERE ${listWhere} ${orderBy}`,
  )
    .bind(...binds, nowLocal)
    .all<BookingRow>();

  return json({
    bookings: (results ?? []).map(publicBooking),
    upcomingCount: Number(upcomingCountRow?.c) || 0,
    pastCount: Number(pastCountRow?.c) || 0,
  });
};
