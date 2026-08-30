"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  credentials,
  credentialCaption,
  type Credential,
} from "@/data/credentials";

function wrapIndex(index: number, delta: number) {
  return (index + delta + credentials.length) % credentials.length;
}

export function CredentialsGallery() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const open = openIndex !== null;
  const current: Credential | undefined =
    openIndex === null ? undefined : credentials[openIndex];

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenIndex(null);
        return;
      }
      if (e.key === "ArrowLeft") {
        setOpenIndex((i) => (i === null ? i : wrapIndex(i, -1)));
      }
      if (e.key === "ArrowRight") {
        setOpenIndex((i) => (i === null ? i : wrapIndex(i, 1)));
      }
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
      <ul className="grid gap-5 sm:grid-cols-3">
        {credentials.map((credential, index) => (
          <li key={credential.src}>
            <button
              type="button"
              onClick={() => setOpenIndex(index)}
              className="group flex w-full cursor-zoom-in flex-col text-left"
              aria-label={`View diploma: ${credential.alt}`}
            >
              <span className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-sand-dark bg-white shadow-sm transition-shadow group-hover:shadow-md">
                <Image
                  src={credential.src}
                  alt={credential.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-contain p-3"
                />
              </span>
              <span className="mt-3">
                <span className="block text-base font-medium text-forest sm:text-lg">
                  {credential.title}
                </span>
                <span className="mt-1 block text-xs text-muted sm:text-sm">
                  {credentialCaption(credential)}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {open && current ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 sm:p-8"
          onClick={() => setOpenIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`${current.title} diploma`}
        >
          <button
            type="button"
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-lg text-cream transition-colors hover:bg-white/25"
            onClick={() => setOpenIndex(null)}
            aria-label="Close"
          >
            ×
          </button>

          <button
            type="button"
            className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-cream transition-colors hover:bg-white/25 sm:left-4 sm:h-12 sm:w-12"
            onClick={(e) => {
              e.stopPropagation();
              setOpenIndex((i) => (i === null ? i : wrapIndex(i, -1)));
            }}
            aria-label="Previous diploma"
          >
            ‹
          </button>
          <button
            type="button"
            className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-cream transition-colors hover:bg-white/25 sm:right-4 sm:h-12 sm:w-12"
            onClick={(e) => {
              e.stopPropagation();
              setOpenIndex((i) => (i === null ? i : wrapIndex(i, 1)));
            }}
            aria-label="Next diploma"
          >
            ›
          </button>

          <div
            className="flex h-full w-full max-w-5xl flex-col items-center justify-center gap-3 sm:gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative min-h-0 w-full flex-1">
              <Image
                src={current.src}
                alt={current.alt}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>
            <p className="shrink-0 text-center text-sm text-cream/90">
              {current.title}
              <span className="mt-1 block text-cream/70">
                {credentialCaption(current)} · {(openIndex ?? 0) + 1} of{" "}
                {credentials.length}
              </span>
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
