/**
 * Minimal Stripe REST helpers for Cloudflare Pages Functions (no SDK).
 */

export type StripeCheckoutSession = {
  id: string;
  url: string | null;
};

export async function createCheckoutSession(
  secretKey: string,
  params: {
    depositCents: number;
    currency: string;
    productName: string;
    productDescription: string;
    successUrl: string;
    cancelUrl: string;
    metadata: Record<string, string>;
  },
): Promise<StripeCheckoutSession> {
  const body = new URLSearchParams();
  body.set("mode", "payment");
  body.set("success_url", params.successUrl);
  body.set("cancel_url", params.cancelUrl);
  body.set("billing_address_collection", "auto");
  body.set("phone_number_collection[enabled]", "true");
  body.set("line_items[0][quantity]", "1");
  body.set("line_items[0][price_data][currency]", params.currency);
  body.set(
    "line_items[0][price_data][unit_amount]",
    String(params.depositCents),
  );
  body.set("line_items[0][price_data][product_data][name]", params.productName);
  body.set(
    "line_items[0][price_data][product_data][description]",
    params.productDescription,
  );

  for (const [key, value] of Object.entries(params.metadata)) {
    body.set(`metadata[${key}]`, value);
  }

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${secretKey}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = (await res.json()) as StripeCheckoutSession & {
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new Error(data.error?.message ?? "Stripe Checkout Session failed.");
  }
  return data;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

async function hmacSha256Hex(
  keyBytes: Uint8Array,
  payload: string,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  return [...new Uint8Array(sig)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function utf8Key(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

/** Some older docs/libs base64-decode the part after `whsec_`. */
function base64WhsecKey(secret: string): Uint8Array | null {
  if (!secret.startsWith("whsec_")) return null;
  try {
    let b64 = secret.slice(6).replace(/-/g, "+").replace(/_/g, "/");
    b64 += "=".repeat((4 - (b64.length % 4)) % 4);
    const binary = atob(b64);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

export type StripeWebhookVerifyResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | "missing_header"
        | "missing_secret"
        | "bad_header"
        | "timestamp_too_old"
        | "signature_mismatch"
        | "secret_has_whitespace";
    };

/**
 * Verify Stripe-Signature header (v1).
 * Matches stripe-node: HMAC key = UTF-8 bytes of the full `whsec_…` string.
 * Also tries base64-decoded key as a fallback.
 * @see https://docs.stripe.com/webhooks#verify-manual
 */
export async function verifyStripeWebhookDetailed(
  rawBody: string,
  signatureHeader: string | null,
  webhookSecret: string | undefined,
  toleranceSec = 300,
): Promise<StripeWebhookVerifyResult> {
  if (!webhookSecret) return { ok: false, reason: "missing_secret" };
  if (/\s/.test(webhookSecret)) {
    return { ok: false, reason: "secret_has_whitespace" };
  }
  if (!signatureHeader) return { ok: false, reason: "missing_header" };

  const parts = signatureHeader.split(",").map((p) => p.trim());
  let timestamp = "";
  const v1Sigs: string[] = [];
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const k = part.slice(0, eq);
    const v = part.slice(eq + 1);
    if (k === "t") timestamp = v;
    if (k === "v1" && v) v1Sigs.push(v);
  }
  if (!timestamp || v1Sigs.length === 0) {
    return { ok: false, reason: "bad_header" };
  }

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return { ok: false, reason: "bad_header" };
  const age = Math.abs(Math.floor(Date.now() / 1000) - ts);
  if (age > toleranceSec) return { ok: false, reason: "timestamp_too_old" };

  const signedPayload = `${timestamp}.${rawBody}`;
  const keys: Uint8Array[] = [utf8Key(webhookSecret)];
  const decoded = base64WhsecKey(webhookSecret);
  if (decoded) keys.push(decoded);

  for (const keyBytes of keys) {
    const expected = await hmacSha256Hex(keyBytes, signedPayload);
    if (v1Sigs.some((sig) => timingSafeEqual(sig, expected))) {
      return { ok: true };
    }
  }

  return { ok: false, reason: "signature_mismatch" };
}

export async function verifyStripeWebhook(
  rawBody: string,
  signatureHeader: string | null,
  webhookSecret: string,
  toleranceSec = 300,
): Promise<boolean> {
  const result = await verifyStripeWebhookDetailed(
    rawBody,
    signatureHeader,
    webhookSecret,
    toleranceSec,
  );
  return result.ok;
}

export type StripeCheckoutSessionObject = {
  id?: string;
  metadata?: Record<string, string>;
  payment_status?: string;
  payment_intent?: string | { id?: string } | null;
  customer_details?: {
    email?: string | null;
    name?: string | null;
    phone?: string | null;
  } | null;
  customer_email?: string | null;
};

export type StripeEvent = {
  id: string;
  type: string;
  data: {
    object: StripeCheckoutSessionObject;
  };
};

export function paymentIntentIdFromSession(
  session: StripeCheckoutSessionObject,
): string | null {
  const pi = session.payment_intent;
  if (!pi) return null;
  if (typeof pi === "string") return pi;
  return pi.id ?? null;
}
