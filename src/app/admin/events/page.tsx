"use client";

import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { AdminNav } from "@/components/AdminNav";
import { AdminSlotTimeScope } from "@/components/AdminSlotTimeScope";
import { Container } from "@/components/Container";
import { getEventTemplates } from "@/data/event-templates";
import { formatSlotLabel } from "@/lib/schedule-api";
import {
  adminApi,
  formatMoney,
  isUpcomingStartsAt,
  type AdminBooking,
  type SlotTimeScope,
  slotStatusBadgeClass,
} from "@/lib/admin-client";

type AdminSlot = {
  id: string;
  experienceSlug: string;
  startsAt: string;
  day: string;
  status: "open" | "held" | "booked" | "cancelled" | "blocked";
  holdExpiresAt: string | null;
  priceEur?: number | null;
  durationMinutes?: number | null;
  kind?: string;
  seatsTaken?: number;
  createdAt: string;
  updatedAt: string;
};

const templates = getEventTemplates();

function lisbonToday(): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Lisbon",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function holdRemaining(expiresAt: string | null, now: number): string | null {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - now;
  if (ms <= 0) return "expired";
  const mins = Math.ceil(ms / 60_000);
  return `${mins} min left`;
}

function ParticipantsModal({
  slot,
  title,
  onClose,
}: {
  slot: AdminSlot;
  title: string;
  onClose: () => void;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [participants, setParticipants] = useState<AdminBooking[]>([]);
  const [maxGuests, setMaxGuests] = useState(0);
  const [seatsTaken, setSeatsTaken] = useState(0);
  const [seatsRemaining, setSeatsRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [formMode, setFormMode] = useState<"closed" | "add" | "edit">("closed");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [form, setForm] = useState({
    guestName: "",
    guestEmail: "",
    guestPhone: "",
  });
  const [resendBusyId, setResendBusyId] = useState<string | null>(null);
  const [deleteBusyId, setDeleteBusyId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<AdminBooking | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const res = await adminApi<{
      participants: AdminBooking[];
      maxGuests: number;
      seatsTaken: number;
      seatsRemaining: number;
    }>(`/api/admin/events/participants?slotId=${encodeURIComponent(slot.id)}`);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setParticipants(res.data.participants);
    setMaxGuests(res.data.maxGuests);
    setSeatsTaken(res.data.seatsTaken);
    setSeatsRemaining(res.data.seatsRemaining);
  }

  useEffect(() => {
    closeRef.current?.focus();
    void load();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slot.id]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return participants;
    return participants.filter((p) => {
      const name = (p.guestName ?? "").toLowerCase();
      const email = (p.guestEmail ?? "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [participants, query]);

  function openAdd() {
    setEditingId(null);
    setForm({ guestName: "", guestEmail: "", guestPhone: "" });
    setFormMode("add");
    setStatusMsg(null);
    setError(null);
  }

  function openEdit(p: AdminBooking) {
    setEditingId(p.id);
    setForm({
      guestName: p.guestName ?? "",
      guestEmail: p.guestEmail ?? "",
      guestPhone: p.guestPhone ?? "",
    });
    setFormMode("edit");
    setStatusMsg(null);
    setError(null);
  }

  function closeForm() {
    setFormMode("closed");
    setEditingId(null);
    setForm({ guestName: "", guestEmail: "", guestPhone: "" });
  }

  async function onSubmitForm(e: FormEvent) {
    e.preventDefault();
    setFormBusy(true);
    setError(null);
    setStatusMsg(null);

    if (formMode === "edit" && editingId) {
      const res = await adminApi<{ participant: AdminBooking }>(
        "/api/admin/events/participants",
        {
          method: "PATCH",
          body: JSON.stringify({
            bookingId: editingId,
            guestName: form.guestName,
            guestEmail: form.guestEmail || null,
            guestPhone: form.guestPhone || null,
          }),
        },
      );
      setFormBusy(false);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      closeForm();
      setStatusMsg("Participant updated.");
      await load();
      return;
    }

    const res = await adminApi<{ participant: AdminBooking }>(
      "/api/admin/events/participants",
      {
        method: "POST",
        body: JSON.stringify({
          slotId: slot.id,
          guestName: form.guestName,
          guestEmail: form.guestEmail || null,
          guestPhone: form.guestPhone || null,
        }),
      },
    );
    setFormBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    closeForm();
    setStatusMsg("Participant added.");
    await load();
  }

  async function resendEmail(p: AdminBooking) {
    if (!p.guestEmail?.trim()) {
      setStatusMsg("No email on this booking.");
      return;
    }
    setResendBusyId(p.id);
    setStatusMsg(null);
    setError(null);
    const res = await adminApi<{ booking: AdminBooking }>(
      `/api/admin/bookings/${encodeURIComponent(p.id)}`,
      {
        method: "PATCH",
        body: JSON.stringify({ action: "resend_email" }),
      },
    );
    setResendBusyId(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setStatusMsg(`Confirmation sent to ${p.guestEmail}.`);
  }

  async function removeParticipant(
    p: AdminBooking,
    opts?: { stripeRefundConfirmed?: boolean },
  ) {
    setDeleteBusyId(p.id);
    setError(null);
    setStatusMsg(null);
    const res = await adminApi<{ ok: boolean }>(
      "/api/admin/events/participants",
      {
        method: "DELETE",
        body: JSON.stringify({
          bookingId: p.id,
          stripeRefundConfirmed: Boolean(opts?.stripeRefundConfirmed),
        }),
      },
    );
    setDeleteBusyId(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setRemoveTarget(null);
    if (editingId === p.id) closeForm();
    setStatusMsg("Participant removed.");
    await load();
  }

  function requestRemove(p: AdminBooking) {
    if (p.addedManually) {
      const label = p.guestName || p.guestEmail || "this participant";
      if (!window.confirm(`Remove ${label}? This frees their seat.`)) return;
      void removeParticipant(p);
      return;
    }
    setRemoveTarget(p);
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-4 sm:items-center"
      role="presentation"
      onMouseDown={(ev) => {
        if (ev.target === ev.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-cream shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-sand-dark px-5 py-4">
          <div>
            <h2 id={titleId} className="text-xl text-forest">
              Participants
            </h2>
            <p className="mt-1 text-sm text-muted">
              {title} · {formatSlotLabel(slot.startsAt)} · {seatsTaken}/
              {maxGuests} seats
              {seatsRemaining > 0 ? ` · ${seatsRemaining} left` : " · full"}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-full border border-sand-dark px-3 py-1 text-sm text-ink hover:bg-sand"
          >
            Close
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-sand px-5 py-3">
          <input
            type="search"
            placeholder="Search name or email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-w-[12rem] flex-1 rounded-xl border border-sand-dark bg-white px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={seatsRemaining <= 0 && formMode !== "edit"}
            onClick={() => {
              if (formMode === "add") closeForm();
              else openAdd();
            }}
            className="rounded-full bg-clay px-4 py-2 text-sm font-semibold text-cream hover:bg-clay-dark disabled:opacity-50"
          >
            {formMode === "add" ? "Cancel" : "Add person"}
          </button>
        </div>

        {formMode !== "closed" ? (
          <form
            onSubmit={(e) => void onSubmitForm(e)}
            className="grid gap-2 border-b border-sand bg-sand/40 px-5 py-3 sm:grid-cols-4 sm:items-end"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-muted sm:col-span-4">
              {formMode === "edit" ? "Edit participant" : "Add person (offline)"}
            </p>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-ink" htmlFor="part-name">
                Name *
              </label>
              <input
                id="part-name"
                required
                value={form.guestName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, guestName: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-sand-dark bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label
                className="text-xs font-medium text-ink"
                htmlFor="part-email"
              >
                Email
              </label>
              <input
                id="part-email"
                type="email"
                value={form.guestEmail}
                onChange={(e) =>
                  setForm((f) => ({ ...f, guestEmail: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-sand-dark bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label
                className="text-xs font-medium text-ink"
                htmlFor="part-phone"
              >
                Phone
              </label>
              <input
                id="part-phone"
                value={form.guestPhone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, guestPhone: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-sand-dark bg-white px-3 py-2 text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2 sm:col-span-4">
              <button
                type="submit"
                disabled={formBusy}
                className="rounded-full bg-forest px-4 py-2 text-sm font-semibold text-cream hover:bg-forest-deep disabled:opacity-60"
              >
                {formBusy
                  ? "Saving…"
                  : formMode === "edit"
                    ? "Save changes"
                    : "Save (offline payment)"}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-full border border-sand-dark px-4 py-2 text-sm text-ink hover:bg-sand"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : null}

        <div className="min-h-0 flex-1 overflow-auto px-5 py-3">
          {loading ? (
            <p className="text-sm text-muted">Loading…</p>
          ) : filtered.length === 0 && !error ? (
            <p className="text-sm text-muted">No participants yet.</p>
          ) : (
            <>
              {error ? (
                <p role="alert" className="mb-2 text-sm text-red-700">
                  {error}
                </p>
              ) : null}
              {statusMsg ? (
                <p className="mb-2 text-sm text-forest" role="status">
                  {statusMsg}
                </p>
              ) : null}
              {filtered.length === 0 ? (
                <p className="text-sm text-muted">No participants yet.</p>
              ) : (
                <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-sand-dark text-xs uppercase tracking-wide text-muted">
                      <th className="py-2 pr-3 font-semibold">Name</th>
                      <th className="py-2 pr-3 font-semibold">Email</th>
                      <th className="py-2 pr-3 font-semibold">Phone</th>
                      <th className="py-2 pr-3 font-semibold">Paid</th>
                      <th className="py-2 pr-3 font-semibold">Source</th>
                      <th className="py-2 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => (
                      <tr
                        key={p.id}
                        className={`border-b border-sand ${
                          editingId === p.id ? "bg-sand/50" : ""
                        }`}
                      >
                        <td className="py-2.5 pr-3 font-medium text-ink">
                          {p.guestName || "—"}
                        </td>
                        <td className="py-2.5 pr-3 text-muted">
                          {p.guestEmail || "—"}
                        </td>
                        <td className="py-2.5 pr-3 text-muted">
                          {p.guestPhone || "—"}
                        </td>
                        <td className="py-2.5 pr-3 text-ink">
                          {formatMoney(p.totalEur)}
                        </td>
                        <td className="py-2.5 pr-3">
                          {p.addedManually ? (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                              Manual
                            </span>
                          ) : (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-900">
                              Stripe
                            </span>
                          )}
                        </td>
                        <td className="py-2.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEdit(p)}
                              className="inline-flex rounded-full border border-sand-dark bg-white px-3 py-1 text-xs font-semibold text-ink hover:bg-sand"
                            >
                              Edit
                            </button>
                            <a
                              href={`/admin/bookings/detail/?id=${encodeURIComponent(p.id)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex rounded-full border border-clay/40 bg-white px-3 py-1 text-xs font-semibold text-clay-dark hover:bg-sand"
                            >
                              Open
                            </a>
                            <button
                              type="button"
                              disabled={
                                !p.guestEmail?.trim() || resendBusyId === p.id
                              }
                              onClick={() => void resendEmail(p)}
                              title={
                                p.guestEmail?.trim()
                                  ? "Resend confirmation email"
                                  : "No email on this booking"
                              }
                              className="inline-flex rounded-full border border-forest/30 bg-white px-3 py-1 text-xs font-semibold text-forest hover:bg-sand disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {resendBusyId === p.id ? "…" : "Email"}
                            </button>
                            <button
                              type="button"
                              disabled={deleteBusyId === p.id}
                              onClick={() => requestRemove(p)}
                              className="inline-flex rounded-full border border-red-300 bg-white px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                            >
                              {deleteBusyId === p.id ? "…" : "Remove"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>

      {removeTarget ? (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/60 p-4 sm:items-center"
          role="presentation"
          onMouseDown={(ev) => {
            if (ev.target === ev.currentTarget) setRemoveTarget(null);
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="remove-stripe-title"
            className="w-full max-w-md rounded-2xl bg-cream p-5 shadow-xl"
          >
            <h3
              id="remove-stripe-title"
              className="text-lg font-semibold text-forest"
            >
              Remove Stripe participant?
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-ink">
              Make sure you have issued a refund in the Stripe Dashboard before
              removing{" "}
              <strong>
                {removeTarget.guestName ||
                  removeTarget.guestEmail ||
                  "this guest"}
              </strong>
              . This only frees their seat here — it does not refund money
              automatically.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={deleteBusyId === removeTarget.id}
                onClick={() =>
                  void removeParticipant(removeTarget, {
                    stripeRefundConfirmed: true,
                  })
                }
                className="rounded-full bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
              >
                {deleteBusyId === removeTarget.id
                  ? "Removing…"
                  : "Refund done"}
              </button>
              <button
                type="button"
                disabled={deleteBusyId === removeTarget.id}
                onClick={() => setRemoveTarget(null)}
                className="rounded-full border border-sand-dark px-4 py-2 text-sm font-semibold text-ink hover:bg-sand"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>,
    document.body,
  );
}

function CreateEventModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (slot: AdminSlot) => void;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [form, setForm] = useState({
    experienceSlug: templates[0]?.slug ?? "",
    date: "",
    time: "10:00",
    priceEur: "",
    durationMinutes: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = templates.find((t) => t.slug === form.experienceSlug);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const today = lisbonToday();
    if (form.date < today) {
      setError("Pick a date today or in the future (Lisbon time).");
      return;
    }
    const priceRaw = form.priceEur.trim();
    const durationRaw = form.durationMinutes.trim();
    const priceEur = priceRaw === "" ? null : Number(priceRaw);
    const durationMinutes = durationRaw === "" ? null : Number(durationRaw);
    if (priceRaw !== "" && (!Number.isFinite(priceEur) || (priceEur ?? 0) <= 0)) {
      setError("Price override must be a positive number (€).");
      return;
    }
    if (
      durationRaw !== "" &&
      (!Number.isFinite(durationMinutes) ||
        (durationMinutes ?? 0) < 15 ||
        (durationMinutes ?? 0) > 480)
    ) {
      setError("Duration override must be between 15 and 480 minutes.");
      return;
    }

    setBusy(true);
    const res = await adminApi<{ slot: AdminSlot }>("/api/admin/slots", {
      method: "POST",
      body: JSON.stringify({
        experienceSlug: form.experienceSlug,
        date: form.date,
        time: form.time,
        kind: "event",
        priceEur,
        durationMinutes,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onCreated(res.data.slot);
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-4 sm:items-center"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-cream p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id={titleId} className="text-xl text-forest">
              Schedule event
            </h2>
            <p className="mt-1 text-sm text-muted">
              Yoga Studio Saldanha, Cascais or Sintra — share the public link after
              creating.
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-full border border-sand-dark px-3 py-1 text-sm text-ink hover:bg-sand"
          >
            Close
          </button>
        </div>

        <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-4">
          <div>
            <label htmlFor="ev-template" className="text-sm font-medium text-ink">
              Template
            </label>
            <select
              id="ev-template"
              value={form.experienceSlug}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  experienceSlug: e.target.value,
                  priceEur: "",
                  durationMinutes: "",
                }))
              }
              className="mt-1.5 w-full rounded-xl border border-sand-dark bg-white px-3 py-2.5 text-sm"
            >
              {templates.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.title} · €{t.pricePerPersonEur} · {t.durationMinutes} min
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="ev-date" className="text-sm font-medium text-ink">
                Date
              </label>
              <input
                id="ev-date"
                type="date"
                required
                min={lisbonToday()}
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-sand-dark bg-white px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label htmlFor="ev-time" className="text-sm font-medium text-ink">
                Time
              </label>
              <input
                id="ev-time"
                type="time"
                required
                value={form.time}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-sand-dark bg-white px-3 py-2.5 text-sm"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="ev-price" className="text-sm font-medium text-ink">
                Price override (€ / person)
              </label>
              <input
                id="ev-price"
                type="number"
                min={1}
                step={0.5}
                placeholder={
                  selected ? `Default €${selected.pricePerPersonEur}` : ""
                }
                value={form.priceEur}
                onChange={(e) =>
                  setForm((f) => ({ ...f, priceEur: e.target.value }))
                }
                className="mt-1.5 w-full rounded-xl border border-sand-dark bg-white px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="ev-duration"
                className="text-sm font-medium text-ink"
              >
                Duration override (min)
              </label>
              <input
                id="ev-duration"
                type="number"
                min={15}
                max={480}
                step={5}
                placeholder={
                  selected ? `Default ${selected.durationMinutes} min` : ""
                }
                value={form.durationMinutes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, durationMinutes: e.target.value }))
                }
                className="mt-1.5 w-full rounded-xl border border-sand-dark bg-white px-3 py-2.5 text-sm"
              />
            </div>
          </div>
          <p className="text-xs text-muted">
            Leave overrides empty to use template defaults. Stripe charges full
            amount online.
          </p>
          {error ? (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-clay px-6 py-3 text-sm font-semibold text-cream hover:bg-clay-dark disabled:opacity-60"
          >
            {busy ? "Creating…" : "Create event"}
          </button>
        </form>
      </div>
    </div>,
    document.body,
  );
}

export default function AdminEventsPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [slots, setSlots] = useState<AdminSlot[]>([]);
  const [filterSlug, setFilterSlug] = useState("");
  const [timeScope, setTimeScope] = useState<SlotTimeScope>("upcoming");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [modalOpen, setModalOpen] = useState(false);
  const [participantsSlot, setParticipantsSlot] = useState<AdminSlot | null>(
    null,
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const titleBySlug = useMemo(() => {
    return new Map(templates.map((t) => [t.slug, t.title]));
  }, []);

  const nowDate = useMemo(() => new Date(now), [now]);
  const upcomingSlots = useMemo(
    () => slots.filter((s) => isUpcomingStartsAt(s.startsAt, nowDate)),
    [slots, nowDate],
  );
  const pastSlots = useMemo(
    () =>
      slots
        .filter((s) => !isUpcomingStartsAt(s.startsAt, nowDate))
        .slice()
        .reverse(),
    [slots, nowDate],
  );
  const visibleSlots = timeScope === "upcoming" ? upcomingSlots : pastSlots;

  async function refreshSlots() {
    const q = filterSlug
      ? `?kind=event&slug=${encodeURIComponent(filterSlug)}`
      : "?kind=event";
    const res = await adminApi<{ slots: AdminSlot[] }>(`/api/admin/slots${q}`);
    if (!res.ok) {
      if (res.status === 401) {
        setAuthed(false);
        return;
      }
      setError(res.error);
      return;
    }
    setAuthed(true);
    setSlots(res.data.slots);
    setError(null);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const q = filterSlug
        ? `?kind=event&slug=${encodeURIComponent(filterSlug)}`
        : "?kind=event";
      const res = await adminApi<{ slots: AdminSlot[] }>(`/api/admin/slots${q}`);
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
      setSlots(res.data.slots);
      setError(null);
    })();
    return () => {
      cancelled = true;
    };
  }, [filterSlug]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

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
    setAuthed(true);
    await refreshSlots();
  }

  async function onLogout() {
    await adminApi("/api/admin/logout", { method: "POST" });
    setAuthed(false);
    setSlots([]);
  }

  async function patch(id: string, action: "book" | "release" | "cancel") {
    setMessage(null);
    setError(null);
    const res = await adminApi("/api/admin/slots", {
      method: "PATCH",
      body: JSON.stringify({ id, action }),
    });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setMessage(
      `Event ${action === "book" ? "marked booked" : action === "release" ? "released" : "cancelled"}.`,
    );
    await refreshSlots();
  }

  async function copyLink(id: string) {
    const url = `${window.location.origin}/events/?id=${encodeURIComponent(id)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setError("Could not copy link.");
    }
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
        <h1 className="text-3xl text-forest">Events admin</h1>
        <p className="mt-2 text-sm text-muted">
          Sign in to schedule trainer-organised events.
        </p>
        <form onSubmit={onLogin} className="mt-8 space-y-4">
          <div>
            <label htmlFor="admin-password" className="text-sm font-medium text-ink">
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
          <h1 className="text-3xl text-forest">Events</h1>
          <p className="mt-1 text-sm text-muted">
            Trainer-organised sessions (studio, Cascais, Sintra) · Stripe full
            pay · share the public link in socials
          </p>
        </div>
        <AdminNav active="events" onLogout={() => void onLogout()} />
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="rounded-full bg-clay px-6 py-3 text-sm font-semibold text-cream hover:bg-clay-dark"
        >
          Schedule event
        </button>
        <AdminSlotTimeScope
          value={timeScope}
          onChange={setTimeScope}
          upcomingCount={upcomingSlots.length}
          pastCount={pastSlots.length}
        />
        <label htmlFor="ev-filter" className="text-sm font-medium text-ink">
          Filter
        </label>
        <select
          id="ev-filter"
          value={filterSlug}
          onChange={(e) => setFilterSlug(e.target.value)}
          className="rounded-xl border border-sand-dark bg-white px-3 py-2 text-sm"
        >
          <option value="">All events</option>
          {templates.map((t) => (
            <option key={t.slug} value={t.slug}>
              {t.title}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void refreshSlots()}
          className="text-sm font-medium text-forest underline-offset-2 hover:underline"
        >
          Refresh
        </button>
      </div>

      {message ? (
        <p className="mt-4 text-sm text-sage-dark" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <ul className="mt-6 space-y-3">
        {visibleSlots.length === 0 ? (
          <li className="text-sm text-muted">
            {slots.length === 0
              ? "No events yet."
              : timeScope === "upcoming"
                ? "No upcoming events."
                : "No past events."}
          </li>
        ) : (
          visibleSlots.map((slot) => {
            const hold = holdRemaining(slot.holdExpiresAt, now);
            return (
              <li
                key={slot.id}
                className="flex flex-col gap-3 rounded-2xl border border-sand-dark bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-forest">
                    {formatSlotLabel(slot.startsAt)}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">
                    {titleBySlug.get(slot.experienceSlug) ?? slot.experienceSlug}
                    {" · "}
                    <span className={slotStatusBadgeClass(slot.status)}>
                      {slot.status}
                    </span>
                    {slot.status === "held" && hold ? ` · ${hold}` : null}
                    {slot.priceEur != null ? ` · €${slot.priceEur}/pp` : null}
                    {slot.durationMinutes != null
                      ? ` · ${slot.durationMinutes} min`
                      : null}
                    {typeof slot.seatsTaken === "number"
                      ? ` · ${slot.seatsTaken} booked`
                      : null}
                  </p>
                  {slot.status !== "cancelled" ? (
                    <p className="mt-1 text-xs">
                      <button
                        type="button"
                        onClick={() => void copyLink(slot.id)}
                        className="font-medium text-clay-dark hover:underline"
                      >
                        {copiedId === slot.id
                          ? "Copied!"
                          : "Copy public event link"}
                      </button>
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setParticipantsSlot(slot)}
                    className="rounded-full border border-forest px-4 py-2 text-xs font-semibold text-forest hover:bg-forest hover:text-cream"
                  >
                    Participants
                    {typeof slot.seatsTaken === "number"
                      ? ` (${slot.seatsTaken})`
                      : ""}
                  </button>
                  {(slot.status === "held" || slot.status === "booked") && (
                    <button
                      type="button"
                      onClick={() => void patch(slot.id, "release")}
                      className="rounded-full border border-sand-dark px-4 py-2 text-xs font-semibold text-ink hover:bg-sand"
                    >
                      Release
                    </button>
                  )}
                  {slot.status !== "blocked" ? (
                    <button
                      type="button"
                      disabled={
                        typeof slot.seatsTaken === "number" &&
                        slot.seatsTaken > 0
                      }
                      title={
                        typeof slot.seatsTaken === "number" &&
                        slot.seatsTaken > 0
                          ? "Remove all participants before cancelling"
                          : undefined
                      }
                      onClick={() => void patch(slot.id, "cancel")}
                      className="rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-800 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Cancel
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })
        )}
      </ul>

      {modalOpen ? (
        <CreateEventModal
          onClose={() => setModalOpen(false)}
          onCreated={(slot) => {
            setModalOpen(false);
            setMessage(`Created ${formatSlotLabel(slot.startsAt)}`);
            void refreshSlots();
            void copyLink(slot.id);
          }}
        />
      ) : null}
      {participantsSlot ? (
        <ParticipantsModal
          slot={participantsSlot}
          title={
            titleBySlug.get(participantsSlot.experienceSlug) ??
            participantsSlot.experienceSlug
          }
          onClose={() => {
            setParticipantsSlot(null);
            void refreshSlots();
          }}
        />
      ) : null}
    </Container>
  );
}
