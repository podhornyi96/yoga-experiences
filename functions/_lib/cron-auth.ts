/**
 * Shared Bearer / X-Cron-Secret check for /api/cron/* endpoints.
 */

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

function extractPresentedSecret(request: Request): string | null {
  const header = request.headers.get("authorization")?.trim() ?? "";
  const bearer = /^Bearer\s+(.+)$/i.exec(header);
  if (bearer?.[1]?.trim()) return bearer[1].trim();

  const alt = request.headers.get("x-cron-secret")?.trim() ?? "";
  return alt || null;
}

export function authorizeCron(
  request: Request,
  env: { CRON_SECRET?: string },
): { ok: true } | { ok: false; reason: string } {
  const secret = env.CRON_SECRET?.trim().replace(/^["']|["']$/g, "");
  if (!secret) {
    return { ok: false, reason: "cron_secret_not_configured" };
  }
  const presented = extractPresentedSecret(request);
  if (!presented) {
    return { ok: false, reason: "missing_auth" };
  }
  if (!timingSafeEqual(presented, secret)) {
    return { ok: false, reason: "invalid_auth" };
  }
  return { ok: true };
}
