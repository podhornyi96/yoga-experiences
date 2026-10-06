"use client";

import { useId, useState } from "react";
import type { Experience } from "@/data/experiences";
import { BookingCTA } from "@/components/BookingCTA";
import { siteConfig } from "@/config/site";

export function IntroPackPanel({ experience }: { experience: Experience }) {
  const pack = experience.introPack;
  const [open, setOpen] = useState(false);
  const panelId = useId();

  if (!pack) return null;

  const singleTotal = experience.price.amount * pack.sessions;
  const savings = singleTotal - pack.amount;
  const forTwo = experience.fixedGuests === 2;
  const who = forTwo ? " for two" : "";

  return (
    <div className="mt-4 rounded-2xl border border-sand bg-sand/40 p-4 sm:p-5">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-3 text-left"
      >
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sage-dark">
            Prefer a pack?
          </p>
          <p className="mt-1 font-medium text-forest">
            Intro pack · {pack.sessions} practices{who}
          </p>
          <p className="mt-0.5 text-sm text-muted">
            €{pack.amount}{" "}
            <span className="line-through">€{singleTotal}</span>
            <span className="text-muted"> · save €{savings}</span>
          </p>
        </div>
        <span
          aria-hidden
          className={`mt-1 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
        >
          ▾
        </span>
      </button>

      {open ? (
        <div id={panelId} className="mt-4 border-t border-sand-dark/40 pt-4">
          <p className="text-sm text-muted">
            Get started and find a good practice fit. Valid {pack.validityDays}{" "}
            days from the first practice.
          </p>
          <p className="mt-1 text-sm text-muted">{pack.note}</p>
          {pack.onceOnly ? (
            <p className="mt-0.5 text-sm text-muted">Available once per guest.</p>
          ) : null}

          <div className="mt-4">
            <p className="text-sm font-semibold text-forest">Pack terms</p>
            <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-muted">
              {pack.policies.map((policy) => (
                <li key={policy} className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-clay-dark" />
                  <span>{policy}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5">
            <BookingCTA
              experience={experience}
              size="lg"
              className="w-full"
              variant="secondary"
              label="Message about Intro pack"
              message={`Hi ${siteConfig.teacher.name}! I'm interested in the Intro pack (${pack.sessions} practices${who}, €${pack.amount}) for "${experience.title}". Could we arrange a schedule?`}
            />
          </div>
          <p className="mt-3 text-center text-xs text-muted">
            WhatsApp to agree times, then payment.
          </p>
        </div>
      ) : null}
    </div>
  );
}
