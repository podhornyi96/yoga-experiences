/**
 * Gift catalog for the purchase page. Amounts match group pricing
 * (Sunrise/Sunset coastal rates, Private €45, Tandem €80).
 */

import { coastalPriceForPeople, privateSessionEur } from "@/lib/group-pricing";

export const GIFT_PRODUCTS = [
  {
    slug: "sunrise-yoga-lisbon",
    title: "Sunrise Yoga",
    summary: "60 minutes as the city wakes up.",
  },
  {
    slug: "sunset-yoga-ocean",
    title: "Sunset Yoga by the Ocean",
    summary: "60 minutes at Praia das Avencas.",
  },
  {
    slug: "private-yoga-session",
    title: "Private or tandem",
    summary: "75 minutes in a Lisbon park. One person, or two as tandem.",
  },
] as const;

export type GiftProductSlug = (typeof GIFT_PRODUCTS)[number]["slug"];

export function giftPrice(slug: string, people: 1 | 2): number {
  if (slug === "private-yoga-session") return privateSessionEur(people);
  return coastalPriceForPeople(people);
}

export function giftProductTitle(slug: string, people: 1 | 2): string {
  if (slug === "private-yoga-session") {
    return people === 2 ? "Tandem Yoga" : "Private Yoga Session";
  }
  return GIFT_PRODUCTS.find((item) => item.slug === slug)?.title ?? slug;
}

export function normalizeGiftCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function formatGiftCode(code: string): string {
  const normalized = normalizeGiftCode(code).slice(0, 8);
  if (normalized.length <= 4) return normalized;
  return `${normalized.slice(0, 4)}-${normalized.slice(4)}`;
}

export type GiftBooking = {
  code: string;
  recipientName: string;
  recipientEmail: string | null;
};

export type PublicGift = {
  status: "active" | "redeemed" | "expired";
  code: string;
  displayCode: string;
  experienceSlug: string;
  pagePath: string;
  title: string;
  people: 1 | 2;
  amountEur: number;
  recipientName: string;
  recipientEmail: string | null;
  expiresAt: string;
  message: string | null;
};

export function formatGiftExpiry(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Lisbon",
  }).format(parsed);
}

export function giftMatchesPage(
  pageSlug: string,
  gift: { experienceSlug: string; people: number },
): boolean {
  if (pageSlug === "private-yoga-tandem") {
    return gift.experienceSlug === "private-yoga-session" && gift.people === 2;
  }
  if (pageSlug === "private-yoga-session") {
    return gift.experienceSlug === "private-yoga-session" && gift.people === 1;
  }
  return gift.experienceSlug === pageSlug;
}

export async function lookupGift(
  code: string,
): Promise<PublicGift | { status: "not_found" } | null> {
  try {
    const params = new URLSearchParams({ code: normalizeGiftCode(code) });
    const res = await fetch(`/api/gifts/lookup?${params}`, {
      credentials: "same-origin",
    });
    if (!res.ok) return null;
    return (await res.json()) as PublicGift | { status: "not_found" };
  } catch {
    return null;
  }
}

export async function startGiftCheckout(input: {
  slug: string;
  people: 1 | 2;
  buyerName: string;
  buyerEmail: string;
  recipientName: string;
  recipientEmail: string;
  message: string;
  deliverOn: string;
}): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  try {
    const res = await fetch("/api/gifts/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(input),
    });
    const data = (await res.json().catch(() => null)) as {
      url?: string;
      error?: string;
    } | null;
    if (!res.ok || !data?.url) {
      return { ok: false, error: data?.error ?? "Could not start checkout." };
    }
    return { ok: true, url: data.url };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}

export async function redeemGiftBooking(input: {
  code: string;
  holdToken: string;
  slotId: string;
  guestName: string;
  guestEmail: string;
  locationId?: string | null;
}): Promise<{ ok: true; bookingId: string } | { ok: false; error: string }> {
  try {
    const res = await fetch("/api/gifts/redeem", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        code: input.code,
        holdToken: input.holdToken,
        slotId: input.slotId,
        guestName: input.guestName,
        guestEmail: input.guestEmail,
        locationId: input.locationId ?? "",
      }),
    });
    const data = (await res.json()) as { bookingId?: string; error?: string };
    if (!res.ok || !data.bookingId) {
      return { ok: false, error: data.error ?? "Could not book with this gift." };
    }
    return { ok: true, bookingId: data.bookingId };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}

export type GiftSession =
  | { ready: false }
  | {
      ready: true;
      gift: PublicGift & { deliverOn: string | null };
    };

export async function fetchGiftSession(
  sessionId: string,
): Promise<GiftSession | null> {
  try {
    const params = new URLSearchParams({ session_id: sessionId });
    const res = await fetch(`/api/gifts/session?${params}`, {
      credentials: "same-origin",
    });
    if (!res.ok) return null;
    return (await res.json()) as GiftSession;
  } catch {
    return null;
  }
}
