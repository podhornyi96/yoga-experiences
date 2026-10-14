/**
 * POST /api/gifts/checkout
 * Start Stripe Checkout for one gift certificate. No slot is held.
 */

import { giftTitle, validateGiftPurchase } from "../../_lib/gifts";
import { error, json, readJson } from "../../_lib/http";
import { createCheckoutSession } from "../../_lib/stripe";
import type { Env as ScheduleEnv } from "../../_lib/types";

interface Env extends ScheduleEnv {
  STRIPE_SECRET_KEY?: string;
  SITE_URL?: string;
}

type Body = {
  slug?: string;
  people?: number;
  buyerName?: string;
  buyerEmail?: string;
  recipientName?: string;
  recipientEmail?: string;
  message?: string;
  deliverOn?: string;
};

function siteOrigin(request: Request, env: Env): string {
  const configured = env.SITE_URL?.replace(/\/$/, "");
  if (configured) return configured;
  return new URL(request.url).origin;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  if (!env.STRIPE_SECRET_KEY) return error("Payments are not enabled yet.", 501);

  const body = await readJson<Body>(request);
  const purchase = validateGiftPurchase({
    slug: body?.slug ?? "",
    people: Number(body?.people),
    buyerName: body?.buyerName ?? "",
    buyerEmail: body?.buyerEmail ?? "",
    recipientName: body?.recipientName ?? "",
    recipientEmail: body?.recipientEmail ?? "",
    message: body?.message ?? "",
    deliverOn: body?.deliverOn ?? "",
  });
  if (!purchase.ok) return error(purchase.error);

  const { value } = purchase;
  const who = value.people === 1 ? "1 person" : "2 people";
  const title = giftTitle(value.slug, value.people);

  const origin = siteOrigin(request, env);
  const metadata: Record<string, string> = {
    kind: "gift",
    slug: value.slug,
    people: String(value.people),
    amountEur: String(value.amountEur),
    buyerName: value.buyerName,
    buyerEmail: value.buyerEmail,
    recipientName: value.recipientName,
  };
  if (value.recipientEmail) metadata.recipientEmail = value.recipientEmail;
  if (value.message) metadata.message = value.message;
  if (value.deliverOn) metadata.deliverOn = value.deliverOn;

  try {
    const session = await createCheckoutSession(env.STRIPE_SECRET_KEY, {
      depositCents: Math.round(value.amountEur * 100),
      currency: "eur",
      productName: `Gift — ${title} · ${who}`,
      productDescription:
        "Gift certificate, valid 12 months. The recipient chooses a date. Non-refundable.",
      successUrl: `${origin}/gift/success/?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/gift/`,
      customerEmail: value.buyerEmail,
      collectPhone: false,
      metadata,
    });
    if (!session.url) return error("Stripe did not return a checkout URL.", 502);
    return json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not start checkout.";
    return error(message, 502);
  }
};
