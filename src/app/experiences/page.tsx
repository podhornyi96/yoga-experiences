import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { SectionHeading } from "@/components/Section";
import { ExperienceCard } from "@/components/ExperienceCard";
import { JsonLd } from "@/components/JsonLd";
import { getExperiencesByGroup, groups } from "@/data/experiences";
import { breadcrumbSchema } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Yoga Experiences in Lisbon — Sunrise, Sunset & Park Sessions",
  description:
    "Book drop-in yoga experiences: sunrise yoga, sunset by the ocean, and forest immersions in Sintra. All levels welcome.",
  alternates: { canonical: "/experiences/" },
};

export default function ExperiencesPage() {
  const items = getExperiencesByGroup("experiences");
  const g = groups.experiences;

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Experiences", path: "/experiences/" },
        ])}
      />
      <section className="bg-gradient-to-b from-sand to-cream">
        <Container className="max-w-7xl py-6 sm:py-8 lg:min-h-[calc(100dvh-4.5rem)] lg:py-10">
          <SectionHeading
            as="h1"
            eyebrow="Lisbon · Outdoor & ocean"
            title="Yoga experiences across Lisbon"
            description={g.tagline}
          />
          <div className="mt-6 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 lg:gap-4">
            {items.map((exp) => (
              <ExperienceCard key={exp.slug} experience={exp} compact />
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
