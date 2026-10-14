"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { AdminNav } from "@/components/AdminNav";
import { Container } from "@/components/Container";
import { adminApi, formatMoney } from "@/lib/admin-client";
import { formatGiftExpiry } from "@/lib/gifts";

type AdminGift = {
  id: string;
  status: "active" | "redeemed" | "expired";
  displayCode: string;
  title: string;
  people: number;
  amountEur: number;
  buyerName: string;
  buyerEmail: string;
  recipientName: string;
  recipientEmail: string | null;
  deliverOn: string | null;
  recipientEmailSentAt: string | null;
  expiresAt: string;
  redeemedBookingId: string | null;
  createdAt: string;
  holdActive: boolean;
};

function statusClass(status: AdminGift["status"]): string {
  const base = "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold";
  if (status === "redeemed") return `${base} bg-emerald-600 text-white`;
  if (status === "expired") return `${base} bg-red-600 text-white`;
  return `${base} bg-amber-500 text-white`;
}

export default function AdminGiftsPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [gifts, setGifts] = useState<AdminGift[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const res = await adminApi<{ gifts: AdminGift[] }>("/api/admin/gifts");
    if (!res.ok) {
      if (res.status === 401) {
        setAuthed(false);
        return;
      }
      setError(res.error);
      setAuthed(true);
      return;
    }
    setAuthed(true);
    setGifts(res.data.gifts);
    setError(null);
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await adminApi<{ gifts: AdminGift[] }>("/api/admin/gifts");
      if (cancelled) return;
      if (!res.ok) {
        if (res.status === 401) {
          setAuthed(false);
          return;
        }
        setError(res.error);
        setAuthed(true);
        return;
      }
      setAuthed(true);
      setGifts(res.data.gifts);
      setError(null);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onLogin(event: FormEvent) {
    event.preventDefault();
    setLoginError(null);
    const res = await adminApi<{ ok: boolean }>("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      setLoginError(res.error);
      return;
    }
    setPassword("");
    await refresh();
  }

  async function onLogout() {
    await adminApi("/api/admin/logout", { method: "POST" });
    setAuthed(false);
    setGifts([]);
  }

  if (authed === null) {
    return (
      <Container className="py-16">
        <p className="text-muted">Loading…</p>
      </Container>
    );
  }

  if (!authed) {
    return (
      <Container className="max-w-md py-16">
        <h1 className="text-3xl text-forest">Gifts admin</h1>
        <p className="mt-2 text-sm text-muted">Sign in to view gift certificates.</p>
        <form onSubmit={(event) => void onLogin(event)} className="mt-8 space-y-4">
          <div>
            <label htmlFor="admin-password" className="text-sm font-medium text-ink">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-sand-dark bg-white px-3 py-2.5 text-base outline-none focus:border-clay focus:ring-2 focus:ring-clay/25"
              required
            />
          </div>
          {loginError ? (
            <p role="alert" className="text-sm text-red-700">
              {loginError}
            </p>
          ) : null}
          <button
            type="submit"
            className="rounded-full bg-forest px-6 py-3 text-sm font-semibold text-cream hover:bg-forest-deep"
          >
            Sign in
          </button>
        </form>
      </Container>
    );
  }

  return (
    <Container className="py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl text-forest">Gifts</h1>
          <p className="mt-1 text-sm text-muted">
            Certificates sold online. A code is used when the date is booked.
          </p>
        </div>
        <AdminNav active="gifts" onLogout={() => void onLogout()} />
      </div>

      {error ? (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <ul className="mt-6 space-y-3">
        {gifts.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-sand-dark bg-white/60 px-5 py-8 text-center text-sm text-muted">
            No gifts yet.
          </li>
        ) : (
          gifts.map((gift) => (
            <li
              key={gift.id}
              className="rounded-2xl border border-sand-dark bg-white px-5 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-sm tracking-widest text-forest">
                    {gift.displayCode}
                  </p>
                  <p className="mt-1 font-medium text-ink">
                    {gift.title} · {gift.people === 1 ? "1 person" : "2 people"} ·{" "}
                    {formatMoney(gift.amountEur)}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    From {gift.buyerName} ({gift.buyerEmail}) to {gift.recipientName}
                    {gift.recipientEmail ? ` (${gift.recipientEmail})` : ""}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    Valid until {formatGiftExpiry(gift.expiresAt)}
                    {gift.deliverOn && !gift.recipientEmailSentAt
                      ? ` · email recipient on ${gift.deliverOn}`
                      : ""}
                    {gift.holdActive ? " · booking in progress" : ""}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <span className={statusClass(gift.status)}>{gift.status}</span>
                  {gift.redeemedBookingId ? (
                    <p className="mt-2">
                      <Link
                        href={`/admin/bookings/detail/?id=${encodeURIComponent(gift.redeemedBookingId)}`}
                        className="font-medium text-forest underline-offset-2 hover:underline"
                      >
                        Open booking
                      </Link>
                    </p>
                  ) : null}
                </div>
              </div>
            </li>
          ))
        )}
      </ul>
    </Container>
  );
}
