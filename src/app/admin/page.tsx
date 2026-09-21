"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AdminNav } from "@/components/AdminNav";
import { Container } from "@/components/Container";
import { siteConfig } from "@/config/site";
import { getExperiencesByGroup } from "@/data/experiences";
import { formatSlotLabel } from "@/lib/schedule-api";
import { adminApi, slotStatusBadgeClass } from "@/lib/admin-client";

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

const groupExperiences = getExperiencesByGroup("experiences");
const privateInventory = getExperiencesByGroup("private").filter(
  (e) => e.slug === "private-yoga-session",
);
const scheduled = [
  ...groupExperiences,
  ...privateInventory.map((e) => ({
    ...e,
    title: "Private / Tandem",
  })),
];

const WEEKDAYS: { iso: number; label: string }[] = [
  { iso: 1, label: "Mon" },
  { iso: 2, label: "Tue" },
  { iso: 3, label: "Wed" },
  { iso: 4, label: "Thu" },
  { iso: 5, label: "Fri" },
  { iso: 6, label: "Sat" },
  { iso: 7, label: "Sun" },
];

/** ISO weekday Mon=1 … Sun=7 for YYYY-MM-DD. */
function isoWeekday(day: string): number {
  const [y, m, d] = day.split("-").map(Number);
  const js = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return js === 0 ? 7 : js;
}

/** Today's calendar date in Europe/Lisbon as YYYY-MM-DD. */
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
  const [repeatPrompt, setRepeatPrompt] = useState<AdminSlot | null>(null);
  const [repeatWeekdays, setRepeatWeekdays] = useState<number[]>([]);
  const [repeatWeeks, setRepeatWeeks] = useState(4);
  const [repeatBusy, setRepeatBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const q = filterSlug ? `?slug=${encodeURIComponent(filterSlug)}` : "";
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

  const titleBySlug = useMemo(() => {
    const map = new Map(scheduled.map((e) => [e.slug, e.title]));
    return map;
  }, []);

  async function refreshSlots() {
    const q = filterSlug ? `?slug=${encodeURIComponent(filterSlug)}` : "";
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

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const today = lisbonToday();
    if (form.date < today) {
      setError("Pick a date today or in the future (Lisbon time).");
      return;
    }
    const res = await adminApi<{ slot: AdminSlot }>("/api/admin/slots", {
      method: "POST",
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setMessage(`Added ${formatSlotLabel(res.data.slot.startsAt)}`);
    setForm((f) => ({ ...f, date: "" }));
    setRepeatPrompt(res.data.slot);
    setRepeatWeekdays([isoWeekday(res.data.slot.day)]);
    setRepeatWeeks(4);
    await refreshSlots();
  }

  async function onRepeat() {
    if (!repeatPrompt || repeatWeekdays.length === 0) return;
    setRepeatBusy(true);
    setMessage(null);
    setError(null);
    const time = repeatPrompt.startsAt.slice(11, 16);
    const res = await adminApi<{
      created: AdminSlot[];
      skipped: { day: string; reason: string }[];
      summary: { created: number; skipped: number };
    }>("/api/admin/slots/repeat", {
      method: "POST",
      body: JSON.stringify({
        experienceSlug: repeatPrompt.experienceSlug,
        time,
        fromDate: repeatPrompt.day,
        weekdays: repeatWeekdays,
        weeks: repeatWeeks,
      }),
    });
    setRepeatBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    const { summary, skipped } = res.data;
    const skipNote =
      skipped.length > 0
        ? ` Skipped ${summary.skipped}: ${skipped
            .slice(0, 5)
            .map((s) => `${s.day} (${s.reason})`)
            .join("; ")}${skipped.length > 5 ? "…" : ""}`
        : "";
    setMessage(
      `Duplicated: created ${summary.created}.${skipNote}`,
    );
    setRepeatPrompt(null);
    await refreshSlots();
  }

  function toggleRepeatWeekday(iso: number) {
    setRepeatWeekdays((prev) =>
      prev.includes(iso) ? prev.filter((d) => d !== iso) : [...prev, iso].sort(),
    );
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
            Overlapping offers are OK until booked · then conflicting times
            (session + 75 min buffer) are blocked · Lisbon time · soft hold{" "}
            {siteConfig.scheduleHoldMinutes} min
          </p>
        </div>
        <AdminNav active="schedule" onLogout={() => void onLogout()} />
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
            min={lisbonToday()}
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
                    <span className={slotStatusBadgeClass(slot.status)}>
                      {slot.status}
                    </span>
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
              Conflicting open/held slots in the same time window (session
              length + 75 min buffer) will be blocked
              {siblingsOnBookDay.length > 0
                ? ` — up to ${siblingsOnBookDay.length} other slot${siblingsOnBookDay.length === 1 ? "" : "s"} on this day may be affected`
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

      {repeatPrompt ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-4"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !repeatBusy) {
              setRepeatPrompt(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="repeat-slot-title"
            className="w-full max-w-md rounded-t-2xl border border-sand-dark bg-cream p-6 shadow-lg sm:rounded-2xl"
          >
            <h2 id="repeat-slot-title" className="text-xl text-forest">
              Duplicate this slot?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink">
              Repeat{" "}
              <span className="font-medium">
                {titleBySlug.get(repeatPrompt.experienceSlug) ??
                  repeatPrompt.experienceSlug}
              </span>{" "}
              at{" "}
              <span className="font-medium">
                {repeatPrompt.startsAt.slice(11, 16)}
              </span>{" "}
              on selected weekdays for the next N weeks (seed day already
              created — skipped).
            </p>

            <fieldset className="mt-5">
              <legend className="text-sm font-medium text-ink">Weekdays</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {WEEKDAYS.map((d) => {
                  const on = repeatWeekdays.includes(d.iso);
                  return (
                    <button
                      key={d.iso}
                      type="button"
                      onClick={() => toggleRepeatWeekday(d.iso)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                        on
                          ? "bg-forest text-cream"
                          : "border border-sand-dark bg-white text-ink hover:bg-sand"
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="mt-4">
              <label htmlFor="repeat-weeks" className="text-sm font-medium text-ink">
                Weeks ahead
              </label>
              <input
                id="repeat-weeks"
                type="number"
                min={1}
                max={26}
                value={repeatWeeks}
                onChange={(e) => setRepeatWeeks(Number(e.target.value) || 1)}
                className="mt-1.5 w-24 rounded-xl border border-sand-dark bg-white px-3 py-2 text-sm"
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={repeatBusy || repeatWeekdays.length === 0}
                onClick={() => void onRepeat()}
                className="rounded-full bg-clay px-5 py-2.5 text-sm font-semibold text-cream hover:bg-clay-dark disabled:opacity-60"
              >
                {repeatBusy ? "Creating…" : "Create duplicates"}
              </button>
              <button
                type="button"
                disabled={repeatBusy}
                onClick={() => setRepeatPrompt(null)}
                className="rounded-full border border-sand-dark px-5 py-2.5 text-sm font-semibold text-ink hover:bg-sand disabled:opacity-60"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Container>
  );
}
