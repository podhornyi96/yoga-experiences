/**
 * Hourly cron Worker → hits Pages cron APIs.
 * The low-inventory API only acts at 11:00 Europe/Lisbon (DST-safe).
 * Booking reminders run every hour (guest windows + teacher digests at 07:00 / 20:00).
 *
 * Deploy:
 *   npx wrangler secret put CRON_SECRET -c workers/inventory-alert-cron/wrangler.toml
 *   npx wrangler secret put SITE_URL -c workers/inventory-alert-cron/wrangler.toml
 *   # or set SITE_URL as a plain var in wrangler.toml / dashboard
 *   npx wrangler deploy -c workers/inventory-alert-cron/wrangler.toml
 */

export interface Env {
  SITE_URL: string;
  CRON_SECRET: string;
}

async function hitCron(
  env: Env,
  path: string,
  label: string,
): Promise<void> {
  const base = (env.SITE_URL || "https://ivanna-yoga.com").replace(/\/$/, "");
  const url = `${base}${path}`;
  const secret = env.CRON_SECRET?.trim().replace(/^["']|["']$/g, "") ?? "";
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${secret}`,
      "X-Cron-Secret": secret,
    },
  });
  const body = await res.text();
  console.log(`[inventory-alert-cron] ${label}`, {
    status: res.status,
    body: body.slice(0, 500),
  });
}

export default {
  async scheduled(
    _controller: ScheduledController,
    env: Env,
    _ctx: ExecutionContext,
  ): Promise<void> {
    await hitCron(env, "/api/cron/low-inventory", "low-inventory");
    await hitCron(env, "/api/cron/booking-reminders", "booking-reminders");
  },
};
