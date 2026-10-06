import { sendLowInventoryAlert } from "../../_lib/email";
import { error, json } from "../../_lib/http";
import {
  categoriesBelowThreshold,
  countOpenInventoryByCategory,
  lisbonHour,
  LOW_INVENTORY_THRESHOLD,
} from "../../_lib/low-inventory-alert";
import type { Env as ScheduleEnv } from "../../_lib/types";

interface Env extends ScheduleEnv {
  CRON_SECRET?: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  CONTACT_EMAIL?: string;
  BOOKING_NOTIFY_EMAIL?: string;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

function extractPresentedSecret(request: Request): string | null {
  const header = request.headers.get("authorization")?.trim() ?? "";
  const bearer = /^Bearer\s+(.+)$/i.exec(header);
  if (bearer?.[1]?.trim()) return bearer[1].trim();

  // Alternate header — some edges strip Authorization on GET.
  const alt = request.headers.get("x-cron-secret")?.trim() ?? "";
  return alt || null;
}

function authorizeCron(
  request: Request,
  env: Env,
): { ok: true } | { ok: false; reason: string } {
  const secret = env.CRON_SECRET?.trim().replace(/^["']|["']$/g, "");
  if (!secret) {
    return { ok: false, reason: "cron_secret_not_configured" };
  }
  const presented = extractPresentedSecret(request);
  if (!presented) {
    return { ok: false, reason: "missing_auth" };
  }
  if (!timingSafeEqual(presented, secret)) {
    return { ok: false, reason: "invalid_auth" };
  }
  return { ok: true };
}

/**
 * GET /api/cron/low-inventory
 * Secured daily job: email trainer when Sunrise / Sunset / Private-Tandem
 * have fewer than 5 future open slots.
 *
 * Auth: Authorization: Bearer ${CRON_SECRET}
 *   or: X-Cron-Secret: ${CRON_SECRET}
 * Gate: only runs at 11:00 Europe/Lisbon unless ?force=1
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const auth = authorizeCron(request, env);
  if (!auth.ok) {
    const status = auth.reason === "cron_secret_not_configured" ? 503 : 401;
    return json({ error: "Unauthorized.", reason: auth.reason }, { status });
  }

  if (!env.DB) {
    return error("Schedule database is not configured.", 503);
  }

  const url = new URL(request.url);
  const force = url.searchParams.get("force") === "1";
  const hour = lisbonHour();

  if (!force && hour !== 11) {
    return json({
      ok: true,
      sent: false,
      reason: "outside_lisbon_window",
      lisbonHour: hour,
    });
  }

  const counts = await countOpenInventoryByCategory(env.DB);
  const low = categoriesBelowThreshold(counts, LOW_INVENTORY_THRESHOLD);

  if (low.length === 0) {
    return json({
      ok: true,
      sent: false,
      reason: "inventory_ok",
      threshold: LOW_INVENTORY_THRESHOLD,
      counts,
    });
  }

  const result = await sendLowInventoryAlert(
    env,
    low.map((c) => ({ label: c.label, count: c.count })),
  );

  if (!result.sent) {
    console.warn("[cron/low-inventory] email failed", result);
    return json(
      {
        ok: false,
        sent: false,
        reason: result.reason ?? "email_failed",
        threshold: LOW_INVENTORY_THRESHOLD,
        counts,
        low,
      },
      { status: 502 },
    );
  }

  console.log("[cron/low-inventory] alert sent", {
    low: low.map((c) => `${c.label}:${c.count}`),
  });

  return json({
    ok: true,
    sent: true,
    threshold: LOW_INVENTORY_THRESHOLD,
    counts,
    low,
  });
};
