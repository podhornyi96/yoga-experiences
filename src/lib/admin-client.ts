/** Shared fetch helper for admin UI pages. */

export async function adminApi<T>(
  path: string,
  init?: RequestInit,
): Promise<{ ok: true; data: T } | { ok: false; status: number; error: string }> {
  try {
    const res = await fetch(path, {
      credentials: "same-origin",
      headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
      ...init,
    });
    const raw = await res.text();
    let data: (T & { error?: string }) | null = null;
    try {
      data = raw ? (JSON.parse(raw) as T & { error?: string }) : null;
    } catch {
      /* non-JSON (e.g. Cloudflare HTML error page) */
    }
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error:
          data?.error ??
          (raw && !raw.trimStart().startsWith("<")
            ? raw.slice(0, 300)
            : `Request failed (${res.status}). Redeploy if this persists, then check Resend / secrets.`),
      };
    }
    if (!data) {
      return { ok: false, status: res.status, error: "Empty response." };
    }
    return { ok: true, data };
  } catch {
    return { ok: false, status: 0, error: "Network error" };
  }
}

export type AdminBooking = {
  id: string;
  slotId: string;
  experienceSlug: string;
  startsAt: string;
  guestEmail: string | null;
  guestName: string | null;
  guestPhone: string | null;
  people: number;
  mats: number;
  totalEur: number;
  depositEur: number;
  remainingEur: number;
  paymentStatus: "deposit_paid" | "paid_in_full" | "cancelled" | "refunded";
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  notes: string | null;
  paidInFullAt: string | null;
  locationId: string | null;
  createdAt: string;
  updatedAt: string;
};

export function formatMoney(amount: number): string {
  return Number.isInteger(amount) ? `€${amount}` : `€${amount.toFixed(2)}`;
}

export function paymentStatusLabel(
  status: AdminBooking["paymentStatus"],
): string {
  switch (status) {
    case "deposit_paid":
      return "Deposit paid — balance due";
    case "paid_in_full":
      return "Paid in full";
    case "cancelled":
      return "Cancelled";
    case "refunded":
      return "Refunded";
  }
}

/** Bright badge classes for booking payment status. */
export function paymentStatusBadgeClass(
  status: AdminBooking["paymentStatus"],
): string {
  const base =
    "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide";
  switch (status) {
    case "deposit_paid":
      return `${base} bg-amber-500 text-white`;
    case "paid_in_full":
      return `${base} bg-emerald-600 text-white`;
    case "cancelled":
      return `${base} bg-red-600 text-white`;
    case "refunded":
      return `${base} bg-sky-600 text-white`;
  }
}

export type SlotStatus =
  | "open"
  | "held"
  | "booked"
  | "cancelled"
  | "blocked";

/** Bright badge classes for schedule slot status. */
export function slotStatusBadgeClass(status: SlotStatus | string): string {
  const base =
    "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize";
  switch (status) {
    case "open":
      return `${base} bg-emerald-500 text-white`;
    case "held":
      return `${base} bg-amber-500 text-white`;
    case "booked":
      return `${base} bg-blue-600 text-white`;
    case "cancelled":
      return `${base} bg-red-600 text-white`;
    case "blocked":
      return `${base} bg-zinc-500 text-white`;
    default:
      return `${base} bg-zinc-400 text-white`;
  }
}
