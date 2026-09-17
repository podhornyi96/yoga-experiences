"use client";

import { useEffect, useMemo, useState } from "react";
import { AvailabilityBooking } from "@/components/AvailabilityBooking";
import { ExperienceDetails } from "@/components/ExperienceDetails";
import { siteConfig } from "@/config/site";
import type { Experience } from "@/data/experiences";
import {
  MAT_MAX,
  MAT_PRICE_EUR,
  priceForSchedule,
} from "@/lib/group-pricing";

function clampInt(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

function NumberField({
  id,
  label,
  hint,
  value,
  min,
  max,
  error,
  clampMax = true,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  error?: string;
  /** When false, values above `max` stay in the field so a validation error can be shown. */
  clampMax?: boolean;
  onChange: (value: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  const errorId = `${id}-error`;

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  function parse(raw: string) {
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return min;
    const truncated = Math.trunc(parsed);
    return clampMax ? clampInt(truncated, min, max) : Math.max(min, truncated);
  }

  function commit(raw: string) {
    const next = raw === "" ? min : parse(raw);
    onChange(next);
    setDraft(String(next));
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
        {hint ? <span className="text-xs text-muted">{hint}</span> : null}
      </div>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={1}
        value={draft}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => {
          const raw = event.target.value;
          setDraft(raw);
          if (raw === "") return;
          const parsed = Number(raw);
          if (!Number.isFinite(parsed)) return;
          onChange(parse(raw));
        }}
        onBlur={() => commit(draft)}
        className={`mt-1.5 w-full rounded-xl border bg-cream px-3 py-2.5 text-base font-medium text-ink outline-none transition-colors focus:ring-2 sm:text-sm ${
          error
            ? "border-red-600 focus:border-red-600 focus:ring-red-600/20"
            : "border-sand-dark focus:border-clay focus:ring-clay/25"
        }`}
      />
      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function SelectField({
  id,
  label,
  hint,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  value: number;
  options: { value: number; label: string }[];
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
        {hint ? <span className="text-xs text-muted">{hint}</span> : null}
      </div>
      <div className="relative mt-1.5">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="w-full appearance-none rounded-xl border border-sand-dark bg-cream px-3 py-2.5 pr-10 text-base font-medium text-ink outline-none transition-colors focus:border-clay focus:ring-2 focus:ring-clay/25 sm:text-sm"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    </div>
  );
}

export function GroupBookingPanel({ experience }: { experience: Experience }) {
  const groupPricing = experience.groupPricing;
  const showMats = Boolean(experience.matRental || groupPricing?.mats);
  const [people, setPeople] = useState(1);
  const [mats, setMats] = useState(0);
  const peopleCount = groupPricing ? people : (experience.fixedGuests ?? 1);
  const matSelectMax = Math.min(MAT_MAX, peopleCount);
  const matsOverPeople = showMats && mats > peopleCount;
  const matsOverLimit = showMats && mats > MAT_MAX;
  const matsError = matsOverPeople
    ? "You can't request more mats than people."
    : matsOverLimit
      ? `Maximum ${MAT_MAX} yoga mats.`
      : undefined;
  const effectiveMats = showMats ? Math.min(mats, MAT_MAX, peopleCount) : 0;
  const sessionPrice = groupPricing
    ? priceForSchedule(groupPricing.schedule, people)
    : experience.price.amount;
  const total = sessionPrice + effectiveMats * MAT_PRICE_EUR;

  const summary = useMemo(() => {
    const sessionLabel = groupPricing
      ? people === 1
        ? "1 person"
        : `${people} people`
      : experience.price.unit === "per_session"
        ? "per session"
        : null;
    if (!showMats || effectiveMats === 0) return sessionLabel;
    const matLabel = effectiveMats === 1 ? "1 mat" : `${effectiveMats} mats`;
    return sessionLabel ? `${sessionLabel} · ${matLabel}` : matLabel;
  }, [groupPricing, people, showMats, effectiveMats, experience.price.unit]);

  const message = useMemo(() => {
    const who = groupPricing
      ? people === 1
        ? " for 1 person"
        : ` for ${people} people`
      : "";
    const matSuffix = !showMats
      ? ""
      : effectiveMats === 0
        ? " (No yoga mats)"
        : effectiveMats === 1
          ? " (1 yoga mat)"
          : ` (${effectiveMats} yoga mats)`;
    return `Hi ${siteConfig.teacher.name}! I'd like to book "${experience.title}"${who}${matSuffix}. Total: €${total}. Could you share the next available dates?`;
  }, [experience.title, groupPricing, people, showMats, effectiveMats, total]);

  return (
    <>
      <p className="text-2xl font-semibold text-forest">€{total}</p>
      <p className="mt-1 text-sm text-muted">{summary}</p>

      <div className="mt-5 space-y-4">
        {groupPricing ? (
          <NumberField
            id={`${experience.slug}-people`}
            label="People"
            value={people}
            min={1}
            max={groupPricing.maxGuests}
            onChange={setPeople}
          />
        ) : null}

        {showMats ? (
          groupPricing ? (
            <NumberField
              id={`${experience.slug}-mats`}
              label="Yoga mats"
              hint={`€${MAT_PRICE_EUR} each · max ${MAT_MAX}`}
              value={mats}
              min={0}
              max={MAT_MAX}
              clampMax={false}
              error={matsError}
              onChange={setMats}
            />
          ) : (
            <SelectField
              id={`${experience.slug}-mats`}
              label="Yoga mats"
              hint={`€${MAT_PRICE_EUR} each`}
              value={mats}
              options={Array.from({ length: matSelectMax + 1 }, (_, count) => ({
                value: count,
                label:
                  count === 0
                    ? "None"
                    : count === 1
                      ? "1 mat"
                      : `${count} mats`,
              }))}
              onChange={setMats}
            />
          )
        ) : null}
      </div>

      <ExperienceDetails experience={experience} />
      <AvailabilityBooking
        experience={experience}
        bookingMessageBase={message}
        className="mt-6"
      />
    </>
  );
}
