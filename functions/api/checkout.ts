/**
 * POST /api/checkout
 * Create a Stripe Checkout Session for a 30% deposit against a valid soft-hold.
 *
 * Body: { holdToken, slotId, slug, people, mats }
 * Returns: { url }
 */

import { error, json, readJson } from "../_lib/http";
import { quoteCheckout } from "../_lib/pricing";
import {
  expireHolds,
  getSlotById,
  isFutureStartsAt,
  nowIso,
} from "../_lib/slots";
import { createCheckoutSession } from "../_lib/stripe";
import type { Env as ScheduleEnv } from "../_lib/types";

interface Env extends ScheduleEnv {
  STRIPE_SECRET_KEY?: string;
  SITE_URL?: string;
}

type CheckoutBody = {
  holdToken?: string;
  slotId?: string;
  slug?: string;
  people?: number;
  mats?: number;
};

function siteOrigin(request: Request, env: Env): string {
  const configured = env.SITE_URL?.replace(/\/$/, "");
  if (configured) return configured;
  const url = new URL(request.url);
  return url.origin;
}

function formatSlotLabel(startsAt: string): string {
  const [datePart, timePart = ""] = startsAt.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  if (!y || !m || !d) return startsAt;
  const utc = new Date(Date.UTC(y, m - 1, d, 12));
  const weekday = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    timeZone: "UTC",
  }).format(utc);
  const month = new Intl.DateTimeFormat("en-GB", {
    month: "short",
    timeZone: "UTC",
  }).format(utc);
  const time = timePart.slice(0, 5);
  return `${weekday} ${d} ${month} · ${time}`;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (!env.STRIPE_SECRET_KEY) {
    return error("Payments are not enabled yet.", 501);
  }
  if (!env.DB) {
    return error("Schedule database is not configured.", 503);
  }

  const body = await readJson<CheckoutBody>(request);
  const holdToken = body?.holdToken?.trim();
  const slotId = body?.slotId?.trim();
  const slug = body?.slug?.trim();
  const people = Number(body?.people);
  const mats = Number(body?.mats ?? 0);

  if (!holdToken || !slotId || !slug) {
    return error("holdToken, slotId and slug are required.");
  }

  const quote = quoteCheckout({ slug, people, mats });
  if (!quote.ok) return error(quote.error);

  await expireHolds(env.DB);

  const slot = await getSlotById(env.DB, slotId);
  if (!slot || slot.status === "cancelled" || slot.status === "blocked") {
    return error("Slot not found.", 404);
  }
  if (slot.experience_slug !== slug) {
    return error("Slot does not match this experience.", 409);
  }
  if (!isFutureStartsAt(slot.starts_at)) {
    return error("This slot is in the past.", 409);
  }
  if (slot.status === "booked") {
    return error("This slot is already booked.", 409);
  }
  if (slot.status !== "held") {
    return error("Hold this date before paying the deposit.", 409);
  }
  if (slot.hold_token !== holdToken) {
    return error("Invalid hold token.", 409);
  }
  if (slot.hold_expires_at && slot.hold_expires_at < nowIso()) {
    return error("Your hold expired. Pick the date again.", 409);
  }

  const origin = siteOrigin(request, env);
  const slotLabel = formatSlotLabel(slot.starts_at);
  const productName = `Deposit 30% — ${quote.title}`;
  const productDescription = `${slotLabel} (Lisbon time) · Total €${quote.totalEur} · Remaining €${quote.remainingEur} due later`;

  try {
    const session = await createCheckoutSession(env.STRIPE_SECRET_KEY, {
      depositCents: quote.depositCents,
      currency: "eur",
      productName,
      productDescription,
      successUrl: `${origin}/booking/success/?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/booking/cancel/?slug=${encodeURIComponent(slug)}`,
      metadata: {
        slotId: slot.id,
        holdToken,
        slug,
        people: String(quote.people),
        mats: String(quote.mats),
        totalEur: String(quote.totalEur),
        depositEur: String(quote.depositEur),
        remainingEur: String(quote.remainingEur),
      },
    });

    if (!session.url) {
      return error("Stripe did not return a checkout URL.", 502);
    }

    return json({
      url: session.url,
      sessionId: session.id,
      depositEur: quote.depositEur,
      remainingEur: quote.remainingEur,
      totalEur: quote.totalEur,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not start checkout.";
    return error(message, 502);
  }
};
