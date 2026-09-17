"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { AdminNav } from "@/components/AdminNav";
import { Container } from "@/components/Container";
import { getExperiencesByGroup } from "@/data/experiences";
import {
  adminApi,
  formatMoney,
  paymentStatusBadgeClass,
  paymentStatusLabel,
  type AdminBooking,
} from "@/lib/admin-client";
import { formatSlotLabel } from "@/lib/schedule-api";

const scheduled = getExperiencesByGroup("experiences");

export default function AdminBookingsPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const titleBySlug = useMemo(() => {
    return new Map(scheduled.map((e) => [e.slug, e.title]));
  }, []);

  async function refresh() {
    const q = statusFilter
      ? `?status=${encodeURIComponent(statusFilter)}`
      : "";
    const res = await adminApi<{ bookings: AdminBooking[] }>(
      `/api/admin/bookings${q}`,
    );
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
    setBookings(res.data.bookings);
    setError(null);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const q = statusFilter
        ? `?status=${encodeURIComponent(statusFilter)}`
        : "";
      const res = await adminApi<{ bookings: AdminBooking[] }>(
        `/api/admin/bookings${q}`,
      );
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
      setBookings(res.data.bookings);
      setError(null);
    })();
    return () => {
      cancelled = true;
    };
  }, [statusFilter]);

  async function onLogin(e: FormEvent) {
    e.preventDefault();
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
    setBookings([]);
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
        <h1 className="text-3xl text-forest">Bookings admin</h1>
        <p className="mt-2 text-sm text-muted">Sign in to view bookings.</p>
        <form onSubmit={onLogin} className="mt-8 space-y-4">
          <div>
            <label
              htmlFor="admin-password"
              className="text-sm font-medium text-ink"
            >
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
          <h1 className="text-3xl text-forest">Bookings</h1>
          <p className="mt-1 text-sm text-muted">
            Deposits from Stripe · mark paid when the balance arrives
          </p>
        </div>
        <AdminNav active="bookings" onLogout={() => void onLogout()} />
      </div>

      <div className="mt-6">
        <label htmlFor="status-filter" className="text-sm font-medium text-ink">
          Payment status
        </label>
        <select
          id="status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="mt-1.5 block w-full max-w-xs rounded-xl border border-sand-dark bg-white px-3 py-2.5 text-sm"
        >
          <option value="">All</option>
          <option value="deposit_paid">Deposit paid — balance due</option>
          <option value="paid_in_full">Paid in full</option>
          <option value="cancelled">Cancelled</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {error ? (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <ul className="mt-6 space-y-3">
        {bookings.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-sand-dark bg-white/60 px-5 py-8 text-center text-sm text-muted">
            No bookings yet.
          </li>
        ) : (
          bookings.map((b) => (
            <li key={b.id}>
              <Link
                href={`/admin/bookings/detail/?id=${encodeURIComponent(b.id)}`}
                className="block rounded-2xl border border-sand-dark bg-white px-5 py-4 transition-colors hover:border-clay/50"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-forest">
                      {titleBySlug.get(b.experienceSlug) ?? b.experienceSlug}
                    </p>
                    <p className="mt-0.5 text-sm text-ink">
                      {formatSlotLabel(b.startsAt)}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {b.guestName || b.guestEmail || "Guest"}
                      {b.guestEmail && b.guestName
                        ? ` · ${b.guestEmail}`
                        : null}
                      {" · "}
                      {b.people} {b.people === 1 ? "person" : "people"}
                      {b.mats > 0 ? ` · ${b.mats} mats` : ""}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <span className={paymentStatusBadgeClass(b.paymentStatus)}>
                      {paymentStatusLabel(b.paymentStatus)}
                    </span>
                    <p className="mt-2 text-muted">
                      Total {formatMoney(b.totalEur)}
                      {b.paymentStatus === "deposit_paid"
                        ? ` · due ${formatMoney(b.remainingEur)}`
                        : ""}
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          ))
        )}
      </ul>
    </Container>
  );
}
