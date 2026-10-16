import { authorizeCron } from "../../_lib/cron-auth";
import { sendLowInventoryAlert } from "../../_lib/email";
import { deliverDueGiftEmails } from "../../_lib/gifts";
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
  const gifts = await deliverDueGiftEmails(env.DB, env, { force });
  if (gifts.sent > 0 || gifts.failed > 0) {
    console.log("[cron/low-inventory] gift emails", gifts);
  }

  if (!force && hour !== 11) {
    return json({
      ok: true,
      sent: false,
      reason: "outside_lisbon_window",
      lisbonHour: hour,
      gifts,
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
      gifts,
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
        gifts,
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
    gifts,
  });
};
