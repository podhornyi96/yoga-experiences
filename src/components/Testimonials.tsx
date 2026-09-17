"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { testimonials, type Testimonial } from "@/data/testimonials";

export function Testimonials() {
  const [open, setOpen] = useState<Testimonial | null>(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <div className="grid gap-6 md:grid-cols-3">
        {testimonials.map((t) => (
          <figure
            key={`${t.name}-${t.originalSrc}-${t.quote.slice(0, 24)}`}
            className="flex flex-col rounded-2xl border border-sand-dark bg-white p-7 shadow-sm"
          >
            <blockquote className="flex-1 text-base leading-relaxed text-ink">
              “{t.quote}”
            </blockquote>
            <figcaption className="mt-5 border-t border-sand pt-4">
              <span className="block font-semibold text-forest">{t.name}</span>
              <span className="text-sm text-muted">{t.role}</span>
              {t.translatedFrom ? (
                <span className="mt-1 block text-xs text-muted">
                  Translated from Ukrainian
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => setOpen(t)}
                className="mt-3 text-sm font-semibold text-clay underline-offset-4 transition-colors hover:text-clay-dark hover:underline"
              >
                View original review
              </button>
            </figcaption>
          </figure>
        ))}
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 sm:p-8"
          onClick={() => setOpen(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`Original review from ${open.name}`}
        >
          <button
            type="button"
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-lg text-cream transition-colors hover:bg-white/25"
            onClick={() => setOpen(null)}
            aria-label="Close"
          >
            ×
          </button>

          <div
            className="flex h-full w-full max-w-lg flex-col items-center justify-center gap-3 sm:gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative min-h-0 w-full flex-1">
              <Image
                src={open.originalSrc}
                alt={open.originalAlt}
                fill
                sizes="(max-width: 640px) 100vw, 32rem"
                className="object-contain"
              />
            </div>
            <p className="shrink-0 text-center text-sm text-cream/90">
              {open.name}
              <span className="mt-1 block text-cream/70">{open.role}</span>
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
