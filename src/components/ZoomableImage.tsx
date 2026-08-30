"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Image from "next/image";
import type { ImageFocalPoint } from "@/data/experiences";

const presetObjectPosition: Record<"top" | "center" | "bottom", string> = {
  top: "center top",
  center: "center center",
  bottom: "center bottom",
};

const presetObjectPositionClass: Record<"top" | "center" | "bottom", string> = {
  top: "object-top",
  center: "object-center",
  bottom: "object-bottom",
};

function objectPositionStyle(
  position: ImageFocalPoint = "center",
): CSSProperties | undefined {
  if (position in presetObjectPosition) {
    return {
      objectPosition:
        presetObjectPosition[position as keyof typeof presetObjectPosition],
    };
  }
  return { objectPosition: position };
}

function objectPositionClass(position: ImageFocalPoint = "center"): string {
  if (position in presetObjectPositionClass) {
    return presetObjectPositionClass[
      position as keyof typeof presetObjectPositionClass
    ];
  }
  return "";
}

export type ImageObjectPosition = ImageFocalPoint;

export function ZoomableImage({
  src,
  alt,
  sizes,
  priority = false,
  objectPosition = "center",
  className = "",
}: {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  objectPosition?: ImageFocalPoint;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const positionStyle = objectPositionStyle(objectPosition);
  const positionClass = objectPositionClass(objectPosition);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
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
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`relative block h-full w-full cursor-zoom-in overflow-hidden ${className}`}
        aria-label={`View larger: ${alt}`}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={`object-cover ${positionClass}`.trim()}
          style={positionStyle}
        />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 sm:p-8"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Zoomed image"
        >
          <button
            type="button"
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-lg text-cream transition-colors hover:bg-white/25"
            onClick={() => setOpen(false)}
            aria-label="Close"
          >
            ×
          </button>
          <div
            className="relative h-full w-full max-h-[90vh] max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={src}
              alt={alt}
              fill
              sizes="100vw"
              className="object-contain"
              style={positionStyle}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
