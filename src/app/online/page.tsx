import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { SectionHeading } from "@/components/Section";
import { ExperienceCard } from "@/components/ExperienceCard";
import { JsonLd } from "@/components/JsonLd";
import { getExperiencesByGroup, groups } from "@/data/experiences";
import { pageSeo } from "@/lib/seo";
import { breadcrumbSchema } from "@/lib/structured-data";

const group = groups.online;

export const metadata: Metadata = pageSeo({
  title: "Online Yoga | Ivanna Yoga",
  description: group.description,
  path: "/online/",
  absolute: true,
});

export default function OnlinePage() {
  const items = getExperiencesByGroup("online");

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Online", path: "/online/" },
        ])}
      />
      <section className="bg-gradient-to-b from-sand to-cream">
        <Container className="py-6 sm:py-8 lg:min-h-[calc(100dvh-4.5rem)] lg:py-10">
          <SectionHeading
            as="h1"
            eyebrow="Online yoga · live video"
            title="Online yoga"
            description="1:1 or tandem sessions from anywhere — single practices or packs."
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
