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
  const cover = experience.images[0];
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-sand-dark bg-white shadow-sm transition-shadow hover:shadow-md">
      {cover ? (
        <div
          className={`relative overflow-hidden ${compact ? "aspect-[3/2]" : "aspect-[4/3]"}`}
        >
          <ZoomableImage
            src={cover}
            alt={experience.title}
            href={href}
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
      ) : null}
      <div className={`flex flex-1 flex-col ${compact ? "p-4" : "p-6"}`}>
        <p
          className={`flex items-center gap-1.5 text-xs font-semibold text-sage-dark ${
            compact ? "min-w-0 truncate" : ""
          }`}
        >
          <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
          <span className={compact ? "truncate" : undefined}>
            {experience.locationLabel}
          </span>
        </p>
        <h3
          className={`text-forest ${compact ? "mt-1.5 text-lg" : "mt-2 text-xl"}`}
        >
          <Link href={href} className="hover:text-clay-dark">
            {experience.title}
          </Link>
        </h3>
        <p
          className={`text-sm text-muted ${
            compact
              ? "mt-1.5 line-clamp-2 leading-snug"
              : "mt-2 flex-1 leading-relaxed"
          }`}
        >
          {experience.summary}
        </p>
        <div
          className={`mt-auto flex items-end justify-between gap-3 border-t border-sand ${compact ? "pt-3" : "pt-4"}`}
        >
          <div className="min-w-0">
            <PriceTag price={experience.price} />
            {experience.groupPricing?.whatsappOnly ? (
              <p className="mt-0.5 text-xs text-muted">WhatsApp booking</p>
            ) : experience.group === "experiences" && experience.groupPricing ? (
              <p className="mt-0.5 text-xs text-muted">Book online · deposit</p>
            ) : null}
          </div>
          <Link
            href={href}
            className="shrink-0 py-1 text-sm font-semibold text-clay-dark hover:underline"
          >
            View details →
          </Link>
        </div>
      </div>
    </article>
  );
}
