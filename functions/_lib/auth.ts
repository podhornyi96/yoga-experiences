import type { Env } from "./types";

const COOKIE_NAME = "admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

function encoder() {
  return new TextEncoder();
}

function toBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const binary = atob(padded);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function sign(payload: string, secret: string): Promise<string> {
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, encoder().encode(payload));
  return `${payload}.${toBase64Url(sig)}`;
}

async function verify(token: string, secret: string): Promise<string | null> {
  const i = token.lastIndexOf(".");
  if (i <= 0) return null;
  const payload = token.slice(0, i);
  const sig = token.slice(i + 1);
  const key = await hmacKey(secret);
  const ok = await crypto.subtle.verify(
    "HMAC",
    key,
    fromBase64Url(sig),
    encoder().encode(payload),
  );
  return ok ? payload : null;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export function parseCookies(header: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (!k) continue;
    out[k] = decodeURIComponent(rest.join("="));
  }
  return out;
}

export async function createSessionCookie(
  env: Env,
  request: Request,
): Promise<string | null> {
  if (!env.ADMIN_SESSION_SECRET) return null;
  const exp = String(Date.now() + SESSION_TTL_MS);
  const token = await sign(exp, env.ADMIN_SESSION_SECRET);
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly${secure}; SameSite=Lax; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`;
}

export function clearSessionCookie(request?: Request): string {
  const secure =
    request && new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE_NAME}=; Path=/; HttpOnly${secure}; SameSite=Lax; Max-Age=0`;
}

export async function isAdminAuthenticated(
  request: Request,
  env: Env,
): Promise<boolean> {
  if (!env.ADMIN_SESSION_SECRET) return false;
  const cookies = parseCookies(request.headers.get("cookie"));
  const token = cookies[COOKIE_NAME];
  if (!token) return false;
  const payload = await verify(token, env.ADMIN_SESSION_SECRET);
  if (!payload) return false;
  const exp = Number(payload);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  return true;
}

export function passwordMatches(env: Env, password: string): boolean {
  if (!env.ADMIN_PASSWORD) return false;
  return timingSafeEqual(env.ADMIN_PASSWORD, password);
}

export { COOKIE_NAME };
