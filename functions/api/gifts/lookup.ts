/**
 * GET /api/gifts/lookup?code=
 * Public certificate status. The code itself is the secret.
 */

import { getGiftByCode, publicGift } from "../../_lib/gifts";
import { error, json } from "../../_lib/http";
import type { Env } from "../../_lib/types";

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  if (!env.DB) return error("Schedule database is not configured.", 503);

  const code = new URL(request.url).searchParams.get("code") ?? "";
  const gift = await getGiftByCode(env.DB, code);
  if (!gift) return json({ status: "not_found" });
  return json(publicGift(gift));
};
