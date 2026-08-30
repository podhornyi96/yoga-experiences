/**
 * Cloudflare Pages Function — FUTURE online payments (not active yet).
 *
 * This file is a stub kept here so that wiring up online checkout later is a
 * small, isolated change. The static site (output: "export") deploys as-is to
 * Cloudflare Pages; this Function would live alongside it under /api/checkout.
 *
 * HOW TO ENABLE PAYMENTS LATER (high level):
 *  1. Set `paymentsEnabled: true` in src/config/site.ts.
 *  2. Add STRIPE_SECRET_KEY as a secret in the Cloudflare Pages project.
 *  3. Implement the Stripe Checkout Session creation below.
 *  4. Update src/components/BookingCTA.tsx to POST here (when paymentsEnabled)
 *     instead of opening WhatsApp, then redirect to the returned Stripe URL.
 *
 * Docs: https://developers.cloudflare.com/pages/functions/
 *       https://docs.stripe.com/api/checkout/sessions/create
 */

interface Env {
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

  // TODO: parse { slug, quantity } from request, look up the price, then create
  // a Stripe Checkout Session and return { url } for the client to redirect to.
  //
  // Example (pseudo):
  // const { slug, quantity } = await context.request.json();
  // const session = await createStripeCheckoutSession(env.STRIPE_SECRET_KEY, { slug, quantity });
  // return Response.json({ url: session.url });

  return new Response(
    JSON.stringify({ error: "Checkout not implemented." }),
    { status: 501, headers: { "content-type": "application/json" } },
  );
};
