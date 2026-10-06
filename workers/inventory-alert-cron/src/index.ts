/**
 * Hourly cron Worker → hits Pages /api/cron/low-inventory.
 * The API only acts at 11:00 Europe/Lisbon (DST-safe).
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

async function runLowInventoryCheck(env: Env): Promise<void> {
  const base = (env.SITE_URL || "https://ivanna-yoga.com").replace(/\/$/, "");
  const url = `${base}/api/cron/low-inventory`;
  const secret = env.CRON_SECRET?.trim().replace(/^["']|["']$/g, "") ?? "";
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${secret}`,
      "X-Cron-Secret": secret,
    },
  });
  const body = await res.text();
  console.log("[inventory-alert-cron]", {
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
    await runLowInventoryCheck(env);
  },
};
