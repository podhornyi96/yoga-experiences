import { runBookingReminders } from "../../_lib/booking-reminders";
import { authorizeCron } from "../../_lib/cron-auth";
import type { EmailEnv } from "../../_lib/email";
import { error, json } from "../../_lib/http";
import type { Env as ScheduleEnv } from "../../_lib/types";

interface Env extends ScheduleEnv, EmailEnv {
  CRON_SECRET?: string;
}

/**
 * GET /api/cron/booking-reminders
 * Hourly job: guest 24h/12h/3h reminders + teacher morning/evening digests.
 *
 * Auth: Authorization: Bearer ${CRON_SECRET}
 *   or: X-Cron-Secret: ${CRON_SECRET}
 * ?force=1 — ignore quiet hours / digest hour gates (for manual tests)
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

  try {
    const result = await runBookingReminders(env.DB, env, { force });

    console.log("[cron/booking-reminders]", {
      force,
      lisbonHour: result.lisbonHour,
      guestsSent: result.guests.sent,
      guestsFailed: result.guests.failed,
      teacher: result.teacher.map((t) => ({
        kind: t.kind,
        sent: t.sent,
        skipped: t.skipped,
      })),
    });

    return json({
      ok: true,
      force,
      ...result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "reminders_failed";
    console.error("[cron/booking-reminders] exception", { message, err });
    return json(
      { ok: false, error: "Booking reminders failed.", reason: message },
      { status: 500 },
    );
  }
};
