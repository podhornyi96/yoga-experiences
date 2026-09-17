/**
 * Client helpers for the schedule / soft-hold / checkout APIs
 * (Cloudflare Pages Functions).
 */

export type PublicSlot = {
  id: string;
  experienceSlug: string;
  startsAt: string;
  day: string;
  status: "open" | "held" | "booked" | "cancelled" | "blocked";
  holdExpiresAt: string | null;
};

export type HoldResponse = {
  holdToken: string;
  expiresAt: string;
  holdMinutes: number;
  slot: PublicSlot;
};

export type CheckoutResponse = {
  url: string;
  sessionId: string;
  depositEur: number;
  remainingEur: number;
  totalEur: number;
};

/** Survives Stripe redirect so the guest can resume their held slot. */
export type PendingHold = {
  holdToken: string;
  slotId: string;
  slug: string;
  people: number;
  mats: number;
  expiresAt: string;
};

const PENDING_HOLD_KEY = "yoga.pendingHold";

export function savePendingHold(hold: PendingHold): void {
  try {
    sessionStorage.setItem(PENDING_HOLD_KEY, JSON.stringify(hold));
  } catch {
    /* private mode / quota */
  }
}

export function clearPendingHold(): void {
  try {
    sessionStorage.removeItem(PENDING_HOLD_KEY);
  } catch {
    /* ignore */
  }
}

export function readPendingHold(slug?: string): PendingHold | null {
  try {
    const raw = sessionStorage.getItem(PENDING_HOLD_KEY);
    if (!raw) return null;
    const hold = JSON.parse(raw) as PendingHold;
    if (!hold?.holdToken || !hold.slotId || !hold.slug || !hold.expiresAt) {
      clearPendingHold();
      return null;
    }
    if (new Date(hold.expiresAt).getTime() <= Date.now()) {
      clearPendingHold();
      return null;
    }
    if (slug && hold.slug !== slug) return null;
    return hold;
  } catch {
    return null;
  }
}

export async function fetchAvailableSlots(
  slug: string,
  holdToken?: string | null,
): Promise<{ slots: PublicSlot[]; holdMinutes: number } | null> {
  try {
    const params = new URLSearchParams({ slug });
    if (holdToken) params.set("holdToken", holdToken);
    const res = await fetch(`/api/slots?${params}`, {
      credentials: "same-origin",
    });
    if (!res.ok) return null;
    return (await res.json()) as { slots: PublicSlot[]; holdMinutes: number };
  } catch {
    return null;
  }
}

export async function createHold(
  slotId: string,
  holdToken?: string | null,
): Promise<
  | { ok: true; data: HoldResponse }
  | { ok: false; error: string; status: number }
> {
  try {
    const res = await fetch("/api/holds", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        slotId,
        ...(holdToken ? { holdToken } : {}),
      }),
    });
    const data = (await res.json()) as HoldResponse & { error?: string };
    if (!res.ok) {
      return {
        ok: false,
        error: data.error ?? "Could not hold this slot.",
        status: res.status,
      };
    }
    return { ok: true, data };
  } catch {
    return { ok: false, error: "Network error. Please try again.", status: 0 };
  }
}

export async function createCheckoutSession(input: {
  holdToken: string;
  slotId: string;
  slug: string;
  people: number;
  mats: number;
}): Promise<
  | { ok: true; data: CheckoutResponse }
  | { ok: false; error: string; status: number }
> {
  try {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(input),
    });
    const data = (await res.json()) as CheckoutResponse & { error?: string };
    if (!res.ok) {
      return {
        ok: false,
        error: data.error ?? "Could not start checkout.",
        status: res.status,
      };
    }
    if (!data.url) {
      return {
        ok: false,
        error: "Checkout URL missing.",
        status: res.status,
      };
    }
    return { ok: true, data };
  } catch {
    return { ok: false, error: "Network error. Please try again.", status: 0 };
  }
}

/** Format `YYYY-MM-DDTHH:mm` Lisbon wall time for UI / WhatsApp. */
export function formatSlotLabel(startsAt: string): string {
  const [datePart, timePart = ""] = startsAt.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  if (!y || !m || !d) return startsAt;
  const utc = new Date(Date.UTC(y, m - 1, d, 12));
  const weekday = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    timeZone: "UTC",
  }).format(utc);
  const month = new Intl.DateTimeFormat("en-GB", {
    month: "short",
    timeZone: "UTC",
  }).format(utc);
  const time = timePart.slice(0, 5);
  return `${weekday} ${d} ${month} · ${time}`;
}
