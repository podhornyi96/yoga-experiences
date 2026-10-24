import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { SectionHeading } from "@/components/Section";
import { ExperiencesGrid } from "@/components/ExperiencesGrid";
import { JsonLd } from "@/components/JsonLd";
import { getExperiencesByGroup, groups } from "@/data/experiences";
import { pageSeo } from "@/lib/seo";
import { breadcrumbSchema } from "@/lib/structured-data";

export const metadata: Metadata = pageSeo({
  title: "Yoga Experiences in Lisbon | Ivanna Yoga",
  description:
    "Private yoga experiences in Lisbon — sunrise, sunset, Cascais and Sintra. Book for yourself or your party. English-friendly.",
  path: "/experiences/",
  absolute: true,
});

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
            eyebrow="English-friendly · book online"
            title="Yoga experiences in Lisbon"
            description={g.description}
          />
          <div className="mt-6">
            <ExperiencesGrid items={items} />
          </div>
        </Container>
      </section>
    </>
  );
}
