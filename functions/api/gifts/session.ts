/**
 * GET /api/gifts/session?session_id=
 * Buyer success page. The Stripe session id is unguessable.
 */

import { getGiftByStripeSession, publicGift } from "../../_lib/gifts";
import { error, json } from "../../_lib/http";
import type { Env } from "../../_lib/types";

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  if (!env.DB) return error("Schedule database is not configured.", 503);

  const sessionId = new URL(request.url).searchParams.get("session_id")?.trim() ?? "";
  if (!sessionId.startsWith("cs_")) return error("Missing session.", 400);

  const gift = await getGiftByStripeSession(env.DB, sessionId);
  if (!gift) return json({ ready: false });

  const pub = publicGift(gift);
  return json({
    ready: true,
    gift: {
      ...pub,
      deliverOn: gift.deliver_on,
    },
  });
};
