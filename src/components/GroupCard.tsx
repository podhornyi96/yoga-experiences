import Link from "next/link";
import type { Group } from "@/data/experiences";
import { getExperiencesByGroup, groups } from "@/data/experiences";
import { ZoomableImage } from "@/components/ZoomableImage";

const groupHref: Record<Group, string> = {
  experiences: "/experiences/",
  private: "/private/",
  corporate: "/corporate/",
};

export function GroupCard({ group }: { group: Group }) {
  const g = groups[group];
  const cover =
    getExperiencesByGroup(group).find((e) => e.featured) ??
    getExperiencesByGroup(group)[0];
  const imageSrc = cover?.images[0];

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-sand-dark bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
      {imageSrc ? (
        <div className="relative aspect-[4/3] overflow-hidden">
          <ZoomableImage
            src={imageSrc}
            alt={g.label}
            sizes="(max-width: 768px) 100vw, 33vw"
            objectPosition={cover?.coverImagePosition}
          />
        </div>
      ) : null}
      <Link href={groupHref[group]} className="flex flex-1 flex-col p-8">
        <div className="flex-1">
          <h3 className="text-2xl text-forest">{g.label}</h3>
          <p className="mt-3 text-sm leading-relaxed text-muted">{g.tagline}</p>
        </div>
        <span className="mt-8 inline-flex items-center text-sm font-semibold text-clay-dark">
          Explore
          <span className="ml-1 transition-transform group-hover:translate-x-1">
            →
          </span>
        </span>
      </Link>
    </article>
  );
}
