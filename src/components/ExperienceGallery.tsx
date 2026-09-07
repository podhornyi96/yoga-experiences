"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import type { ImageFocalPoint } from "@/data/experiences";
import { ZoomableImage } from "@/components/ZoomableImage";

function Chevron({
  direction,
  className = "",
}: {
  direction: "left" | "right";
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {direction === "left" ? (
        <path d="M15 6 9 12l6 6" />
      ) : (
        <path d="m9 6 6 6-6 6" />
      )}
    </svg>
  );
}

function objectPosition(position: ImageFocalPoint = "center") {
  if (position === "top") return "center top";
  if (position === "bottom") return "center bottom";
  if (position === "center") return "center center";
  return position;
}

function slideIndexFromScroll(el: HTMLElement) {
  const width = el.clientWidth;
  if (width <= 0) return 0;
  return Math.round(el.scrollLeft / width);
}

const stripScrollClass =
  "flex gap-2 overflow-x-auto overscroll-x-contain px-1.5 py-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

export function ExperienceGallery({
  images,
  title,
  coverImagePosition = "center",
}: {
  images: string[];
  title: string;
  coverImagePosition?: ImageFocalPoint;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);
  const pointerStartX = useRef<number | null>(null);
  const lightboxPointerX = useRef(0);
  const lightboxDragged = useRef(false);
  const ignoreScrollIndex = useRef(false);
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const multiple = images.length > 1;
  const rest = images.slice(1);

  const scrollTo = useCallback(
    (next: number, behavior: ScrollBehavior = "smooth") => {
      const el = scrollerRef.current;
      if (!el) return;
      const clamped = Math.max(0, Math.min(next, images.length - 1));
      ignoreScrollIndex.current = behavior !== "instant";
      el.scrollTo({ left: clamped * el.clientWidth, behavior });
      setIndex(clamped);
    },
    [images.length],
  );

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !multiple) return;
    let settle = 0;
    const onScroll = () => {
      if (ignoreScrollIndex.current) {
        window.clearTimeout(settle);
        settle = window.setTimeout(() => {
          ignoreScrollIndex.current = false;
        }, 80);
        return;
      }
      setIndex(slideIndexFromScroll(el));
    };
    const onScrollEnd = () => {
      ignoreScrollIndex.current = false;
      window.clearTimeout(settle);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("scrollend", onScrollEnd);
    return () => {
      window.clearTimeout(settle);
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("scrollend", onScrollEnd);
    };
  }, [multiple]);

  useEffect(() => {
    if (lightbox === null) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (!multiple) return;
      if (e.key === "ArrowLeft") {
        setLightbox((i) => (i === null ? i : Math.max(0, i - 1)));
      }
      if (e.key === "ArrowRight") {
        setLightbox((i) =>
          i === null ? i : Math.min(images.length - 1, i + 1),
        );
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [lightbox, multiple, images.length]);

  useLayoutEffect(() => {
    const el = lightboxRef.current;
    if (lightbox === null || !el) return;
    if (slideIndexFromScroll(el) !== lightbox) {
      el.scrollTo({ left: lightbox * el.clientWidth });
    }
  }, [lightbox]);

  if (!images.length) return null;

  if (!multiple) {
    return (
      <div className="relative aspect-[16/10] w-full max-w-full overflow-hidden rounded-2xl">
        <ZoomableImage
          src={images[0]}
          alt={title}
          sizes="(max-width: 1024px) 100vw, 60vw"
          priority
          objectPosition={coverImagePosition}
        />
      </div>
    );
  }

  return (
    <>
      <div className="relative w-full min-w-0 max-w-full">
        <div
          ref={scrollerRef}
          className="flex w-full max-w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-2xl [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="region"
          aria-roledescription="carousel"
          aria-label={`${title} photos`}
        >
          {images.map((src, i) => (
            <div
              key={src}
              className="relative aspect-[16/10] w-full min-w-0 shrink-0 basis-full snap-center"
              onPointerDown={(event) => {
                pointerStartX.current = event.clientX;
              }}
              onPointerUp={(event) => {
                const start = pointerStartX.current;
                pointerStartX.current = null;
                if (start === null) return;
                if (Math.abs(event.clientX - start) < 12) setLightbox(i);
              }}
            >
              <Image
                src={src}
                alt={i === 0 ? title : `${title} — photo ${i + 1}`}
                fill
                sizes="(max-width: 1024px) 100vw, 60vw"
                priority={i === 0}
                draggable={false}
                className="cursor-zoom-in object-cover select-none"
                style={
                  i === 0
                    ? { objectPosition: objectPosition(coverImagePosition) }
                    : undefined
                }
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-cream backdrop-blur-sm transition-colors hover:bg-black/55 disabled:pointer-events-none disabled:opacity-30 sm:flex"
          onClick={() => scrollTo(index - 1)}
          disabled={index === 0}
          aria-label="Previous photo"
        >
          <Chevron direction="left" className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-cream backdrop-blur-sm transition-colors hover:bg-black/55 disabled:pointer-events-none disabled:opacity-30 sm:flex"
          onClick={() => scrollTo(index + 1)}
          disabled={index === images.length - 1}
          aria-label="Next photo"
        >
          <Chevron direction="right" className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-3 flex justify-center gap-1.5">
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => scrollTo(i)}
            className={`h-2 rounded-full transition-all ${
              i === index
                ? "w-6 bg-clay"
                : "w-2 bg-sand-dark hover:bg-clay/60"
            }`}
            aria-label={`Go to photo ${i + 1}`}
            aria-current={i === index}
          />
        ))}
      </div>

      <div className={`mt-4 min-w-0 max-w-full ${stripScrollClass}`}>
        {rest.map((src, i) => {
          const photoIndex = i + 1;
          return (
            <button
              key={src}
              type="button"
              onClick={() => scrollTo(photoIndex)}
              className={`shrink-0 rounded-lg outline-none [-webkit-tap-highlight-color:transparent] ${
                photoIndex === index
                  ? "ring-2 ring-clay ring-offset-2 ring-offset-cream"
                  : ""
              }`}
              aria-label={`Show ${title} — photo ${photoIndex + 1}`}
            >
              <span className="relative block h-20 w-28 overflow-hidden rounded-lg sm:h-24 sm:w-32">
                <Image
                  src={src}
                  alt={`${title} — photo ${photoIndex + 1}`}
                  fill
                  sizes="128px"
                  className="object-cover"
                />
              </span>
            </button>
          );
        })}
      </div>

      {lightbox !== null ? (
        <div
          className="fixed inset-0 z-50 bg-black/90"
          role="dialog"
          aria-modal="true"
          aria-label="Photo gallery"
          onClick={() => {
            if (lightboxDragged.current) return;
            setLightbox(null);
          }}
          onPointerDown={(event) => {
            lightboxPointerX.current = event.clientX;
            lightboxDragged.current = false;
          }}
          onPointerMove={(event) => {
            if (Math.abs(event.clientX - lightboxPointerX.current) > 10) {
              lightboxDragged.current = true;
            }
          }}
        >
          <button
            type="button"
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-lg text-cream transition-colors hover:bg-white/25"
            onClick={(event) => {
              event.stopPropagation();
              setLightbox(null);
            }}
            aria-label="Close"
          >
            ×
          </button>
          <p className="pointer-events-none absolute left-4 top-5 z-10 text-sm text-cream/80">
            {lightbox + 1}/{images.length}
          </p>
          <div
            ref={lightboxRef}
            className="flex h-full w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ touchAction: "pan-x pinch-zoom" }}
            onScroll={(event) => {
              const next = slideIndexFromScroll(event.currentTarget);
              setLightbox(next);
            }}
          >
            {images.map((src, i) => (
              <div
                key={src}
                className="flex h-full w-full min-w-full shrink-0 snap-center items-center justify-center p-4 sm:p-8"
              >
                <Image
                  src={src}
                  alt={i === 0 ? title : `${title} — photo ${i + 1}`}
                  width={2400}
                  height={1800}
                  sizes="100vw"
                  className="max-h-[90vh] w-auto max-w-full object-contain"
                  draggable={false}
                  onClick={(event) => event.stopPropagation()}
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
