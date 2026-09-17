/**
 * Cloudflare Pages Function — FUTURE online payments (not active yet).
 *
 * This file is a stub kept here so that wiring up online checkout later is a
 * small, isolated change. The static site (output: "export") deploys as-is to
 * Cloudflare Pages; this Function lives alongside schedule APIs under /api/*.
 *
 * HOW TO ENABLE PAYMENTS LATER (high level):
 *  1. Set `paymentsEnabled: true` in src/config/site.ts.
 *  2. Add STRIPE_SECRET_KEY (and webhook secret) in the Cloudflare Pages project.
 *  3. Implement Stripe Checkout Session creation below.
 *  4. Accept body: { holdToken, slug, people?, mats? } — validate the soft-hold
 *     in D1 (status=held, token match, not expired), then create the session.
 *  5. Stripe webhook: on checkout.session.completed → mark slot status=booked.
 *  6. Update AvailabilityBooking / BookingCTA to POST here when paymentsEnabled
 *     instead of opening WhatsApp, then redirect to the returned Stripe URL.
 *
 * Docs: https://developers.cloudflare.com/pages/functions/
 *       https://docs.stripe.com/api/checkout/sessions/create
 */

import type { Env as ScheduleEnv } from "../_lib/types";

interface Env extends ScheduleEnv {
  STRIPE_SECRET_KEY?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env } = context;

  if (!env.STRIPE_SECRET_KEY) {
    return new Response(
      JSON.stringify({ error: "Payments are not enabled yet." }),
      { status: 501, headers: { "content-type": "application/json" } },
    );
  }

  // TODO: parse { holdToken, slug, people, mats } from request, validate hold
  // against D1, create a Stripe Checkout Session, return { url }.
  //
  // Example (pseudo):
  // const { holdToken, slug, people, mats } = await context.request.json();
  // const session = await createStripeCheckoutSession(env.STRIPE_SECRET_KEY, { ... });
  // return Response.json({ url: session.url });

  return new Response(
    JSON.stringify({ error: "Checkout not implemented." }),
    { status: 501, headers: { "content-type": "application/json" } },
  );
};
