/**
 * Client helpers for the schedule / soft-hold APIs (Cloudflare Pages Functions).
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

export async function fetchAvailableSlots(
  slug: string,
): Promise<{ slots: PublicSlot[]; holdMinutes: number } | null> {
  try {
    const res = await fetch(`/api/slots?slug=${encodeURIComponent(slug)}`, {
      credentials: "same-origin",
    });
    if (!res.ok) return null;
    return (await res.json()) as { slots: PublicSlot[]; holdMinutes: number };
  } catch {
    return null;
  }
}

export async function createHold(slotId: string): Promise<
  | { ok: true; data: HoldResponse }
  | { ok: false; error: string; status: number }
> {
  try {
    const res = await fetch("/api/holds", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ slotId }),
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
