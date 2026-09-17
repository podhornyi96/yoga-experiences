import {
  createSessionCookie,
  passwordMatches,
} from "../../_lib/auth";
import { error, json, readJson } from "../../_lib/http";
import type { Env } from "../../_lib/types";

/**
 * POST /api/admin/login
 * Body: { password: string }
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (!env.ADMIN_PASSWORD || !env.ADMIN_SESSION_SECRET) {
    return error("Admin auth is not configured on the server.", 503);
  }

  const body = await readJson<{ password?: string }>(request);
  const password = body?.password ?? "";
  if (!password || !passwordMatches(env, password)) {
    return error("Invalid password.", 401);
  }

  const cookie = await createSessionCookie(env, request);
  if (!cookie) return error("Could not create session.", 500);

  return json(
    { ok: true },
    {
      headers: {
        "set-cookie": cookie,
      },
    },
  );
};
