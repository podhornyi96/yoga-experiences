import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { SectionHeading } from "@/components/Section";
import { ExperienceCard } from "@/components/ExperienceCard";
import { JsonLd } from "@/components/JsonLd";
import { getExperiencesByGroup } from "@/data/experiences";
import { breadcrumbSchema } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Private Yoga in Lisbon — 1:1 & Tandem Sessions",
  description:
    "Personalised private yoga in Lisbon. One-to-one and tandem sessions tailored to your body, goals and schedule. For beginners and experienced practitioners alike.",
  alternates: { canonical: "/private/" },
};

export default function PrivatePage() {
  const items = getExperiencesByGroup("private");

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Private", path: "/private/" },
        ])}
      />
      <section className="bg-gradient-to-b from-sand to-cream">
        <Container className="py-6 sm:py-8 lg:min-h-[calc(100dvh-4.5rem)] lg:py-10">
          <SectionHeading
            as="h1"
            eyebrow="Private yoga · Lisbon"
            title="Private yoga in Lisbon"
            description="1:1 or tandem sessions in person across Lisbon."
          />
          <div className="mx-auto mt-6 grid max-w-4xl gap-5 sm:grid-cols-2 sm:gap-6">
            {items.map((exp) => (
              <ExperienceCard key={exp.slug} experience={exp} />
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
