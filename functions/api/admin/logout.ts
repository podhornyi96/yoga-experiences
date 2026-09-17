import { clearSessionCookie, isAdminAuthenticated } from "../../_lib/auth";
import { error, json } from "../../_lib/http";
import type { Env } from "../../_lib/types";

/**
 * POST /api/admin/logout
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  if (!(await isAdminAuthenticated(request, env))) {
    return error("Unauthorized.", 401);
  }

  return json(
    { ok: true },
    {
      headers: {
        "set-cookie": clearSessionCookie(request),
      },
    },
  );
};
