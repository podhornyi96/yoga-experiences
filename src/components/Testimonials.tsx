"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  googleReviewsUrl,
  testimonials,
  type Testimonial,
} from "@/data/testimonials";
import { GoogleIcon, InstagramIcon, TelegramIcon } from "@/components/icons";

/** Google Maps star gold */
const GOOGLE_STAR = "#fbbc04";

function StarRating({ rating }: { rating: number }) {
  return (
    <p
      className="text-[15px] leading-none tracking-[0.12em]"
      style={{ color: GOOGLE_STAR }}
      aria-label={`${rating} out of 5 stars`}
    >
      {"★".repeat(rating)}
      <span className="text-sand-dark" aria-hidden>
        {"★".repeat(Math.max(0, 5 - rating))}
      </span>
    </p>
  );
}

function SourceMark({ source }: { source: Testimonial["source"] }) {
  if (source === "google") {
    return (
      <span className="inline-flex items-center gap-1.5" title="Google review">
        <GoogleIcon className="h-4 w-4 shrink-0" />
        <span className="sr-only">Google review</span>
      </span>
    );
  }

  if (source === "telegram") {
    return (
      <span className="inline-flex items-center gap-1.5" title="Telegram">
        <TelegramIcon className="h-4 w-4 shrink-0 text-[#2AABEE]" />
        <span className="sr-only">Telegram</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5" title="Instagram">
      <InstagramIcon className="h-4 w-4 shrink-0 text-muted" />
      <span className="sr-only">Instagram</span>
    </span>
  );
}

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
      <div className="mb-10 flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-center sm:gap-5">
        <p className="text-sm font-semibold text-forest">
          <span style={{ color: GOOGLE_STAR }} aria-hidden>
            ★
          </span>{" "}
          5.0 on Google
        </p>
        <a
          href={googleReviewsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-clay underline-offset-4 transition-colors hover:text-clay-dark hover:underline"
        >
          Read reviews on Google
        </a>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {testimonials.map((t) => (
          <figure
            key={`${t.name}-${t.source}-${t.quote.slice(0, 24)}`}
            className="flex flex-col rounded-2xl border border-sand-dark bg-white p-7 shadow-sm"
          >
            <div className="mb-3 flex items-center gap-2">
              <SourceMark source={t.source} />
              {t.source === "google" && t.rating ? (
                <StarRating rating={t.rating} />
              ) : null}
            </div>
            <blockquote className="flex-1 text-base leading-relaxed text-ink">
              “{t.quote}”
            </blockquote>
            <figcaption className="mt-5 border-t border-sand pt-4">
              <span className="block font-semibold text-forest">{t.name}</span>
              {t.source !== "google" ? (
                <span className="text-sm text-muted">{t.role}</span>
              ) : null}
              {t.translatedFrom ? (
                <span className="mt-1 block text-xs text-muted">
                  Translated from Ukrainian
                </span>
              ) : null}
              {t.source === "google" && t.url ? (
                <a
                  href={t.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-clay"
                >
                  View on Google
                  <span aria-hidden className="text-clay">
                    ↗
                  </span>
                </a>
              ) : null}
              {t.source !== "google" && t.originalSrc ? (
                <button
                  type="button"
                  onClick={() => setOpen(t)}
                  className="mt-2 text-sm text-muted transition-colors hover:text-clay"
                >
                  View original
                </button>
              ) : null}
            </figcaption>
          </figure>
        ))}
      </div>

      {open?.originalSrc ? (
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
                alt={open.originalAlt ?? `Original review from ${open.name}`}
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
