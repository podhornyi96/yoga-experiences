import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/Container";
import { Section, SectionHeading } from "@/components/Section";
import { BookingCTA } from "@/components/BookingCTA";
import { ExperienceGallery } from "@/components/ExperienceGallery";
import { Faq } from "@/components/Faq";
import { ExperienceDetails } from "@/components/ExperienceDetails";
import { PriceTag } from "@/components/PriceTag";
import { JsonLd } from "@/components/JsonLd";
import { getExperiencesByGroup, groups } from "@/data/experiences";
import { pageSeo } from "@/lib/seo";
import {
  breadcrumbSchema,
  experienceSchema,
  faqSchema,
} from "@/lib/structured-data";

const benefits = [
  {
    title: "Less stress, more focus",
    text: "Short, regular sessions help your team reset, reducing burnout and sick days.",
  },
  {
    title: "On-site in Lisbon",
    text: "We come to your Lisbon office for live, in-person sessions with your team.",
  },
  {
    title: "Simple for HR",
    text: "Flexible weekly or monthly plans with clean invoicing for your company.",
  },
];

const formats = [
  {
    title: "Weekly office sessions",
    text: "A recurring slot in your Lisbon office — the easiest wellbeing habit to build.",
  },
  {
    title: "Monthly wellbeing slots",
    text: "A regular in-office rhythm that keeps wellbeing easy to maintain.",
  },
  {
    title: "Events & offsites",
    text: "One-off sessions for team days, offsites, conferences and launches.",
  },
];

export function generateMetadata(): Metadata {
  const exp = getExperiencesByGroup("corporate")[0];
  if (!exp) {
    return pageSeo({
      title: "Corporate Yoga for IT Teams | Lisbon",
      description:
        "On-site yoga for companies in Lisbon. A simple wellbeing benefit for tech teams.",
      path: "/corporate/",
      absolute: true,
    });
  }
  return pageSeo({
    title: "Corporate Yoga for IT Teams | Lisbon",
    description: exp.summary,
    path: "/corporate/",
    image: exp.images[0],
    absolute: true,
  });
}

export default function CorporatePage() {
  const exp = getExperiencesByGroup("corporate")[0];
  if (!exp) notFound();

  const g = groups.corporate;

  return (
    <>
      <JsonLd data={experienceSchema(exp)} />
      <JsonLd data={faqSchema(exp.faq)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Corporate", path: "/corporate/" },
        ])}
      />

      <section className="bg-gradient-to-b from-sand to-cream">
        <Container className="py-6 sm:py-8 lg:py-10">
          <SectionHeading
            as="h1"
            eyebrow="Corporate wellbeing · Lisbon"
            title={g.tagline}
            description={g.description}
          />

          <div className="mt-6 grid min-w-0 gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start">
            <div className="min-w-0">
              <ExperienceGallery
                images={exp.images}
                title={exp.title}
                coverImagePosition={exp.cardImagePosition ?? exp.coverImagePosition}
              />

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
          </div>
        </Container>
      </section>

      <Section>
        <SectionHeading
          eyebrow="Why teams love it"
          title="A high-impact, low-effort benefit"
          description={g.description}
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="rounded-2xl border border-sand-dark bg-white p-6"
            >
              <h3 className="text-lg text-forest">{b.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{b.text}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section className="bg-sand/50">
        <SectionHeading eyebrow="Formats" title="Flexible to your team" />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {formats.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-sand-dark bg-white p-7"
            >
              <h3 className="text-xl text-forest">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.text}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <div className="rounded-[2rem] bg-forest px-8 py-16 text-center text-cream sm:px-16">
          <h2 className="mx-auto max-w-2xl text-3xl text-cream sm:text-4xl">
            Let&apos;s design a plan for your team
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-cream/80">
            Tell us your team size and goals — we&apos;ll send a simple proposal
            with pricing and invoicing.
          </p>
          <div className="mt-8 flex justify-center">
            <BookingCTA experience={exp} size="lg" label="Start the conversation" />
          </div>
        </div>
      </Section>
    </>
  );
}
