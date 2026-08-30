"use client";

import type { ImageObjectPosition } from "@/components/ZoomableImage";
import { ZoomableImage } from "@/components/ZoomableImage";

export function ExperienceGallery({
  images,
  title,
  coverImagePosition = "center",
}: {
  images: string[];
  title: string;
  coverImagePosition?: ImageObjectPosition;
}) {
  return (
    <>
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl">
        <ZoomableImage
          src={images[0]}
          alt={title}
          sizes="(max-width: 1024px) 100vw, 60vw"
          priority
          objectPosition={coverImagePosition}
        />
      </div>

      {images.length > 1 ? (
        <div className="mt-10">
          <h2 className="mb-4 text-2xl text-forest">Gallery</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {images.slice(1).map((src, i) => (
              <div
                key={src}
                className="relative aspect-square overflow-hidden rounded-xl"
              >
                <ZoomableImage
                  src={src}
                  alt={`${title} — photo ${i + 2}`}
                  sizes="(max-width: 640px) 50vw, 33vw"
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
