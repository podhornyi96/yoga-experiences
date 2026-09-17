"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Container } from "@/components/Container";
import { siteConfig } from "@/config/site";
import { getExperiencesByGroup } from "@/data/experiences";
import { formatSlotLabel } from "@/lib/schedule-api";

type AdminSlot = {
  id: string;
  experienceSlug: string;
  startsAt: string;
  day: string;
  status: "open" | "held" | "booked" | "cancelled" | "blocked";
  holdExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const scheduled = getExperiencesByGroup("experiences");

async function api<T>(
  path: string,
  init?: RequestInit,
): Promise<{ ok: true; data: T } | { ok: false; status: number; error: string }> {
  try {
    const res = await fetch(path, {
      credentials: "same-origin",
      headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
      ...init,
    });
    const data = (await res.json()) as T & { error?: string };
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: data.error ?? `Request failed (${res.status})`,
      };
    }
    return { ok: true, data };
  } catch {
    return { ok: false, status: 0, error: "Network error" };
  }
}

function holdRemaining(expiresAt: string | null, now: number): string | null {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - now;
  if (ms <= 0) return "expired";
  const mins = Math.ceil(ms / 60_000);
  return `${mins} min left`;
}

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [slots, setSlots] = useState<AdminSlot[]>([]);
  const [filterSlug, setFilterSlug] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [form, setForm] = useState({
    experienceSlug: scheduled[0]?.slug ?? "",
    date: "",
    time: "07:00",
  });
  const [bookConfirm, setBookConfirm] = useState<AdminSlot | null>(null);
  const [bookBusy, setBookBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const q = filterSlug ? `?slug=${encodeURIComponent(filterSlug)}` : "";
      const res = await api<{ slots: AdminSlot[] }>(`/api/admin/slots${q}`);
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

  const titleBySlug = useMemo(() => {
    const map = new Map(scheduled.map((e) => [e.slug, e.title]));
    return map;
  }, []);

  async function refreshSlots() {
    const q = filterSlug ? `?slug=${encodeURIComponent(filterSlug)}` : "";
    const res = await api<{ slots: AdminSlot[] }>(`/api/admin/slots${q}`);
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

  async function onLogin(e: FormEvent) {
    e.preventDefault();
    setLoginError(null);
    const res = await api<{ ok: boolean }>("/api/admin/login", {
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
    await api("/api/admin/logout", { method: "POST" });
    setAuthed(false);
    setSlots([]);
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const res = await api<{ slot: AdminSlot }>("/api/admin/slots", {
      method: "POST",
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setMessage(`Added ${formatSlotLabel(res.data.slot.startsAt)}`);
    setForm((f) => ({ ...f, date: "" }));
    await refreshSlots();
  }

  async function patch(id: string, action: "book" | "release" | "cancel") {
    setMessage(null);
    setError(null);
    const res = await api("/api/admin/slots", {
      method: "PATCH",
      body: JSON.stringify({ id, action }),
    });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setMessage(
      `Slot ${action === "book" ? "marked booked" : action === "release" ? "released" : "cancelled"}.`,
    );
    await refreshSlots();
  }

  async function confirmMarkBooked() {
    if (!bookConfirm) return;
    setBookBusy(true);
    await patch(bookConfirm.id, "book");
    setBookBusy(false);
    setBookConfirm(null);
  }

  const siblingsOnBookDay = bookConfirm
    ? slots.filter(
        (s) =>
          s.day === bookConfirm.day &&
          s.id !== bookConfirm.id &&
          (s.status === "open" || s.status === "held"),
      )
    : [];

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
        <h1 className="text-3xl text-forest">Schedule admin</h1>
        <p className="mt-2 text-sm text-muted">
          Sign in to manage available dates for group experiences.
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
          <h1 className="text-3xl text-forest">Schedule admin</h1>
          <p className="mt-1 text-sm text-muted">
            Several experiences can share a day until one is marked booked ·
            Lisbon time · soft hold {siteConfig.scheduleHoldMinutes} min
          </p>
        </div>
        <button
          type="button"
          onClick={() => void onLogout()}
          className="rounded-full border border-sand-dark px-4 py-2 text-sm font-medium text-ink hover:bg-sand"
        >
          Sign out
        </button>
      </div>

      <form
        onSubmit={onCreate}
        className="mt-8 grid gap-4 rounded-2xl border border-sand-dark bg-white p-6 sm:grid-cols-4 sm:items-end"
      >
        <div className="sm:col-span-2">
          <label htmlFor="exp" className="text-sm font-medium text-ink">
            Experience
          </label>
          <select
            id="exp"
            value={form.experienceSlug}
            onChange={(e) =>
              setForm((f) => ({ ...f, experienceSlug: e.target.value }))
            }
            className="mt-1.5 w-full rounded-xl border border-sand-dark bg-cream px-3 py-2.5 text-sm"
          >
            {scheduled.map((e) => (
              <option key={e.slug} value={e.slug}>
                {e.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="date" className="text-sm font-medium text-ink">
            Date
          </label>
          <input
            id="date"
            type="date"
            required
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className="mt-1.5 w-full rounded-xl border border-sand-dark bg-cream px-3 py-2.5 text-sm"
          />
        </div>
        <div>
          <label htmlFor="time" className="text-sm font-medium text-ink">
            Time
          </label>
          <input
            id="time"
            type="time"
            required
            value={form.time}
            onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
            className="mt-1.5 w-full rounded-xl border border-sand-dark bg-cream px-3 py-2.5 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-full bg-clay px-6 py-3 text-sm font-semibold text-cream hover:bg-clay-dark sm:col-span-4 sm:justify-self-start"
        >
          Add slot
        </button>
      </form>

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

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <label htmlFor="filter" className="text-sm font-medium text-ink">
          Filter
        </label>
        <select
          id="filter"
          value={filterSlug}
          onChange={(e) => setFilterSlug(e.target.value)}
          className="rounded-xl border border-sand-dark bg-white px-3 py-2 text-sm"
        >
          <option value="">All experiences</option>
          {scheduled.map((e) => (
            <option key={e.slug} value={e.slug}>
              {e.title}
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

      <ul className="mt-6 space-y-3">
        {slots.length === 0 ? (
          <li className="text-sm text-muted">No slots yet.</li>
        ) : (
          slots.map((slot) => {
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
                    <span className="capitalize">{slot.status}</span>
                    {slot.status === "held" && hold ? ` · ${hold}` : null}
                    {slot.status === "blocked"
                      ? " · another session booked that day"
                      : null}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(slot.status === "open" || slot.status === "held") && (
                    <button
                      type="button"
                      onClick={() => setBookConfirm(slot)}
                      className="rounded-full bg-forest px-4 py-2 text-xs font-semibold text-cream hover:bg-forest-deep"
                    >
                      Mark booked
                    </button>
                  )}
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
                      onClick={() => void patch(slot.id, "cancel")}
                      className="rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-800 hover:bg-red-50"
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

      {bookConfirm ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-4"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !bookBusy) setBookConfirm(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="book-confirm-title"
            className="w-full max-w-md rounded-t-2xl border border-sand-dark bg-cream p-6 shadow-lg sm:rounded-2xl"
          >
            <h2 id="book-confirm-title" className="text-xl text-forest">
              Mark as booked?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink">
              Confirm booking for{" "}
              <span className="font-medium">
                {titleBySlug.get(bookConfirm.experienceSlug) ??
                  bookConfirm.experienceSlug}
              </span>{" "}
              on{" "}
              <span className="font-medium">
                {formatSlotLabel(bookConfirm.startsAt)}
              </span>
              .
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              If you approve, all other experience slots on this day become
              unavailable for guests
              {siblingsOnBookDay.length > 0
                ? ` (${siblingsOnBookDay.length} other slot${siblingsOnBookDay.length === 1 ? "" : "s"} will be blocked)`
                : ""}
              . Soft holds on those slots will be cleared.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={bookBusy}
                onClick={() => void confirmMarkBooked()}
                className="rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-cream hover:bg-forest-deep disabled:opacity-60"
              >
                {bookBusy ? "Saving…" : "Yes, mark booked"}
              </button>
              <button
                type="button"
                disabled={bookBusy}
                onClick={() => setBookConfirm(null)}
                className="rounded-full border border-sand-dark px-5 py-2.5 text-sm font-semibold text-ink hover:bg-sand disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Container>
  );
}
