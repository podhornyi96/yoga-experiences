"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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

function BookingDetailInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id")?.trim() ?? "";

  const [authed, setAuthed] = useState<boolean | null>(null);
  const [booking, setBooking] = useState<AdminBooking | null>(null);
  const [slotStatus, setSlotStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const titleBySlug = useMemo(() => {
    return new Map(scheduled.map((e) => [e.slug, e.title]));
  }, []);

  const load = useCallback(async () => {
    if (!id) {
      setError("Missing booking id.");
      setAuthed(true);
      return;
    }
    const res = await adminApi<{
      booking: AdminBooking;
      slot: { status: string } | null;
    }>(`/api/admin/bookings/${encodeURIComponent(id)}`);
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
    setBooking(res.data.booking);
    setSlotStatus(res.data.slot?.status ?? null);
    setError(null);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onLogout() {
    await adminApi("/api/admin/logout", { method: "POST" });
    setAuthed(false);
    setBooking(null);
  }

  async function patch(action: "mark_paid" | "cancel" | "refund") {
    if (!booking) return;
    setBusy(true);
    setMessage(null);
    setError(null);
    const res = await adminApi<{ booking: AdminBooking }>(
      `/api/admin/bookings/${encodeURIComponent(booking.id)}`,
      {
        method: "PATCH",
        body: JSON.stringify({ action }),
      },
    );
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setBooking(res.data.booking);
    setMessage(
      action === "mark_paid"
        ? "Marked paid in full."
        : action === "refund"
          ? "Marked refunded · slot reopened if it was booked."
          : "Cancelled · slot reopened if it was booked.",
    );
    await load();
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
        <h1 className="text-3xl text-forest">Booking detail</h1>
        <p className="mt-2 text-sm text-muted">
          <Link href="/admin/bookings/" className="underline">
            Sign in on the bookings list
          </Link>{" "}
          first.
        </p>
      </Container>
    );
  }

  if (!booking) {
    return (
      <Container className="py-12">
        <AdminNav active="bookings" onLogout={() => void onLogout()} />
        <p role="alert" className="mt-8 text-sm text-red-700">
          {error ?? "Booking not found."}
        </p>
        <Link
          href="/admin/bookings/"
          className="mt-4 inline-block text-sm font-medium text-forest underline"
        >
          Back to bookings
        </Link>
      </Container>
    );
  }

  const title = titleBySlug.get(booking.experienceSlug) ?? booking.experienceSlug;

  return (
    <Container className="py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted">
            <Link href="/admin/bookings/" className="hover:underline">
              Bookings
            </Link>{" "}
            / detail
          </p>
          <h1 className="mt-1 text-3xl text-forest">{title}</h1>
          <p className="mt-1 text-sm text-muted">
            {formatSlotLabel(booking.startsAt)}
            {slotStatus ? ` · slot ${slotStatus}` : ""}
          </p>
        </div>
        <AdminNav active="bookings" onLogout={() => void onLogout()} />
      </div>

      {message ? (
        <p className="mt-4 text-sm text-sage-dark" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-sand-dark bg-white p-6">
          <h2 className="text-lg text-forest">Guest</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-sand pb-2">
              <dt className="text-muted">Name</dt>
              <dd className="font-medium text-ink">
                {booking.guestName || "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-sand pb-2">
              <dt className="text-muted">Email</dt>
              <dd className="font-medium text-ink">
                {booking.guestEmail ? (
                  <a
                    href={`mailto:${booking.guestEmail}`}
                    className="underline-offset-2 hover:underline"
                  >
                    {booking.guestEmail}
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-sand pb-2">
              <dt className="text-muted">Phone</dt>
              <dd className="font-medium text-ink">
                {booking.guestPhone || "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-sand pb-2">
              <dt className="text-muted">People</dt>
              <dd className="font-medium text-ink">{booking.people}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Mats</dt>
              <dd className="font-medium text-ink">{booking.mats}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-sand-dark bg-white p-6">
          <h2 className="text-lg text-forest">Payment</h2>
          <p className="mt-3">
            <span className={paymentStatusBadgeClass(booking.paymentStatus)}>
              {paymentStatusLabel(booking.paymentStatus)}
            </span>
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-sand pb-2">
              <dt className="text-muted">Total</dt>
              <dd className="font-medium text-ink">
                {formatMoney(booking.totalEur)}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-sand pb-2">
              <dt className="text-muted">Deposit paid</dt>
              <dd className="font-medium text-ink">
                {formatMoney(booking.depositEur)}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-sand pb-2">
              <dt className="text-muted">Remaining</dt>
              <dd className="font-medium text-ink">
                {formatMoney(booking.remainingEur)}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-sand pb-2">
              <dt className="text-muted">Paid in full at</dt>
              <dd className="font-medium text-ink">
                {booking.paidInFullAt
                  ? new Date(booking.paidInFullAt).toLocaleString("en-GB")
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-sand pb-2">
              <dt className="text-muted">Stripe session</dt>
              <dd className="max-w-[60%] break-all font-mono text-xs text-ink">
                {booking.stripeCheckoutSessionId || "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Payment intent</dt>
              <dd className="max-w-[60%] break-all font-mono text-xs text-ink">
                {booking.stripePaymentIntentId || "—"}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {booking.paymentStatus === "deposit_paid" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void patch("mark_paid")}
            className="rounded-full bg-clay px-5 py-2.5 text-sm font-semibold text-cream hover:bg-clay-dark disabled:opacity-60"
          >
            Mark paid in full
          </button>
        ) : null}
        {booking.paymentStatus === "deposit_paid" ||
        booking.paymentStatus === "paid_in_full" ? (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (
                  window.confirm(
                    "Cancel this booking and reopen the day if the slot was booked?",
                  )
                ) {
                  void patch("cancel");
                }
              }}
              className="rounded-full border border-sand-dark px-5 py-2.5 text-sm font-medium text-ink hover:bg-sand disabled:opacity-60"
            >
              Cancel booking
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (
                  window.confirm(
                    "Mark as refunded and reopen the day? (Refund money in Stripe Dashboard separately.)",
                  )
                ) {
                  void patch("refund");
                }
              }}
              className="rounded-full border border-sand-dark px-5 py-2.5 text-sm font-medium text-ink hover:bg-sand disabled:opacity-60"
            >
              Mark refunded
            </button>
          </>
        ) : null}
      </div>
    </Container>
  );
}

export default function AdminBookingDetailPage() {
  return (
    <Suspense
      fallback={
        <Container className="py-16">
          <p className="text-muted">Loading…</p>
        </Container>
      }
    >
      <BookingDetailInner />
    </Suspense>
  );
}
