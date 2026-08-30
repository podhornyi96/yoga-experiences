import Link from "next/link";
import type { Experience } from "@/data/experiences";
import { experiencePagePath } from "@/data/experiences";
import { MapPinIcon } from "@/components/icons";
import { PriceTag } from "./PriceTag";
import { ZoomableImage } from "@/components/ZoomableImage";

export function ExperienceCard({
  experience,
  compact = false,
}: {
  experience: Experience;
  compact?: boolean;
}) {
  const href = experiencePagePath(experience);
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-sand-dark bg-white shadow-sm transition-shadow hover:shadow-md">
      <div
        className={`relative overflow-hidden ${compact ? "aspect-[3/2]" : "aspect-[4/3]"}`}
      >
        <ZoomableImage
          src={experience.images[0]}
          alt={experience.title}
          sizes={
            compact
              ? "(max-width: 1024px) 50vw, 25vw"
              : "(max-width: 768px) 100vw, 33vw"
          }
          objectPosition={
            experience.cardImagePosition ?? experience.coverImagePosition
          }
        />
      </div>
      <div className={`flex flex-1 flex-col ${compact ? "p-4" : "p-6"}`}>
        <p className="flex items-center gap-1.5 text-xs font-semibold text-sage-dark">
          <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
          {experience.locationLabel}
        </p>
        <h3
          className={`text-forest ${compact ? "mt-1.5 text-lg" : "mt-2 text-xl"}`}
        >
          <Link href={href} className="hover:text-clay-dark">
            {experience.title}
          </Link>
        </h3>
        <p
          className={`flex-1 text-sm leading-relaxed text-muted ${compact ? "mt-1.5 line-clamp-2" : "mt-2"}`}
        >
          {experience.summary}
        </p>
        <div
          className={`flex items-center justify-between border-t border-sand ${compact ? "mt-3 pt-3" : "mt-5 pt-4"}`}
        >
          <PriceTag price={experience.price} />
          <Link
            href={href}
            className="text-sm font-semibold text-clay-dark hover:underline"
          >
            View details →
          </Link>
        </div>
      </div>
    </article>
  );
}
