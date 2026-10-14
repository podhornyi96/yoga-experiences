/**
 * GET /api/admin/gifts
 */

import { isAdminAuthenticated } from "../../_lib/auth";
import { adminGift, listGifts } from "../../_lib/gifts";
import { error, json } from "../../_lib/http";
import type { Env } from "../../_lib/types";

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  if (!(await isAdminAuthenticated(request, env))) {
    return error("Unauthorized.", 401);
  }
  if (!env.DB) return error("Schedule database is not configured.", 503);

  const gifts = await listGifts(env.DB);
  return json({ gifts: gifts.map((row) => adminGift(row)) });
};
