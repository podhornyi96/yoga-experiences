import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/Container";
import { BookingCTA } from "@/components/BookingCTA";
import { ExperienceGallery } from "@/components/ExperienceGallery";
import { Faq } from "@/components/Faq";
import { ExperienceDetails } from "@/components/ExperienceDetails";
import { MapPinIcon } from "@/components/icons";
import { PriceTag } from "@/components/PriceTag";
import { JsonLd } from "@/components/JsonLd";
import {
  getExperienceBySlug,
  getExperienceDetailPages,
  groups,
} from "@/data/experiences";
import { pageSeo } from "@/lib/seo";
import {
  breadcrumbSchema,
  experienceSchema,
  faqSchema,
} from "@/lib/structured-data";

export function generateStaticParams() {
  return getExperienceDetailPages().map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const exp = getExperienceBySlug(slug);
  if (!exp) return {};
  return pageSeo({
    title: `${exp.title} in Lisbon`,
    description: exp.summary,
    path: `/experiences/${exp.slug}/`,
    image: exp.images[0],
  });
}

export default async function ExperienceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const exp = getExperienceBySlug(slug);
  if (!exp) notFound();

  const group = groups[exp.group];

  return (
    <>
      <JsonLd data={experienceSchema(exp)} />
      <JsonLd data={faqSchema(exp.faq)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: group.label, path: `/${group.slug}/` },
          { name: exp.title, path: `/experiences/${exp.slug}/` },
        ])}
      />

      <Container className="py-10">
        <nav className="text-sm text-muted">
          <Link href="/" className="hover:text-clay-dark">
            Home
          </Link>
          <span className="px-2">/</span>
          <Link href={`/${group.slug}/`} className="hover:text-clay-dark">
            {group.label}
          </Link>
          <span className="px-2">/</span>
          <span className="text-ink">{exp.title}</span>
        </nav>
      </Container>

      <Container className="grid gap-10 pb-16 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <div>
          <ExperienceGallery
            images={exp.images}
            title={exp.title}
            coverImagePosition={exp.cardImagePosition ?? exp.coverImagePosition}
          />

          <p className="mt-8 flex items-center gap-1.5 text-sm font-semibold text-sage-dark">
            <MapPinIcon className="h-4 w-4 shrink-0" />
            {exp.locationUrl ? (
              <a
                href={exp.locationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-clay-dark hover:underline"
              >
                {exp.locationLabel}
              </a>
            ) : (
              exp.locationLabel
            )}
          </p>
          <h1 className="mt-2 text-4xl text-forest">
            {exp.title} in Lisbon
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-muted">
            {exp.description}
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div>
              <h2 className="text-xl text-forest">Highlights</h2>
              <ul className="mt-3 space-y-2 text-sm text-ink">
                {exp.highlights.map((h) => (
                  <li key={h} className="flex gap-2">
                    <span className="text-clay-dark">◦</span>
                    {h}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-xl text-forest">What&apos;s included</h2>
              <ul className="mt-3 space-y-2 text-sm text-ink">
                {exp.includes.map((h) => (
                  <li key={h} className="flex gap-2">
                    <span className="text-clay-dark">✓</span>
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {exp.faq.length ? (
            <div className="mt-10">
              <h2 className="mb-4 text-2xl text-forest">
                Frequently asked questions
              </h2>
              <Faq items={exp.faq} />
            </div>
          ) : null}
        </div>

        {/* Booking sidebar */}
        <aside className="lg:sticky lg:top-24">
          <div className="rounded-2xl border border-sand-dark bg-white p-7 shadow-sm">
            <div className="flex items-baseline justify-between">
              <PriceTag price={exp.price} className="text-2xl" />
            </div>
            <ExperienceDetails experience={exp} />
            <div className="mt-6">
              <BookingCTA experience={exp} size="lg" className="w-full" />
            </div>
            <p className="mt-3 text-center text-xs text-muted">
              You&apos;ll be redirected to WhatsApp to confirm a date.
            </p>
          </div>
        </aside>
      </Container>
    </>
  );
}
