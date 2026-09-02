import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/Container";
import { Section, SectionHeading } from "@/components/Section";
import { BookingCTA } from "@/components/BookingCTA";
import { CredentialsGallery } from "@/components/CredentialsGallery";
import { JsonLd } from "@/components/JsonLd";
import { siteConfig } from "@/config/site";
import { pageSeo } from "@/lib/seo";
import { breadcrumbSchema } from "@/lib/structured-data";

export const metadata: Metadata = pageSeo({
  title: "About Ivanna | Yoga Teacher in Lisbon",
  description:
    "Meet Ivanna — RYT-300 certified Hatha yoga teacher in Lisbon with 8+ years of experience. Breathwork, meditation, sound healing and outdoor sessions across the city.",
  path: "/about/",
  image: "/images/me/ivanna-hero-portrait.jpg",
  absolute: true,
});

const values = [
  {
    title: "Accessible",
    text: "Yoga for every body. All sessions are adapted so everyone feels welcome.",
  },
  {
    title: "Rooted in place",
    text: "Practising outdoors in Lisbon — its parks, viewpoints and ocean — is part of the magic.",
  },
  {
    title: "Mindful",
    text: "Breath, presence and a calm nervous system matter as much as the poses.",
  },
];

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "About", path: "/about/" },
        ])}
      />
      <section className="bg-gradient-to-b from-sand to-cream">
        <Container className="py-6 sm:py-8 lg:min-h-[calc(100dvh-4.5rem-9rem)] lg:py-10">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_1.15fr] lg:items-start lg:gap-8">
            <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-[2rem] shadow-lg lg:mx-0">
              <Image
                src="/images/team/ivanna-portrait-3.jpg"
                alt={`${siteConfig.teacher.name}, yoga teacher in Lisbon`}
                fill
                priority
                sizes="(max-width: 1024px) 80vw, 360px"
                className="object-cover object-center"
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-sage-dark">
                About
              </p>
              <h1 className="text-3xl text-forest sm:text-4xl">
                Hi, I&apos;m {siteConfig.teacher.name} — yoga teacher in Lisbon
              </h1>
              <p className="mt-2 text-sm text-sage-dark sm:text-base">
                {siteConfig.teacher.role}
              </p>
              <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted sm:text-base">
                <p>
                  I&apos;m a certified RYT-300 yoga teacher with 8+ years of
                  experience guiding beginners, busy professionals and travellers
                  in {siteConfig.geo.city}. I teach Hatha yoga with a focus on
                  the physical coordination of body and mind — helping you move
                  with intention, breathe with awareness, and find balance on and
                  off the mat.
                </p>
                <p>
                  My sessions blend accessible poses with breathwork, meditation
                  and sound healing. Practising outdoors — at sunrise, by the
                  ocean, or in the forest — is part of what makes the experience
                  special.
                </p>
              </div>
              <div className="mt-4 rounded-xl border border-sand-dark bg-white/70 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-sage-dark">
                  Languages
                </p>
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                  {siteConfig.teacher.languages.map((language) => (
                    <li
                      key={language}
                      className="rounded-full bg-sand/80 px-2.5 py-0.5 text-xs font-medium text-forest sm:text-sm"
                    >
                      {language}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <BookingCTA size="md" />
                <Link
                  href="#certificates"
                  className="inline-flex items-center justify-center rounded-full border border-forest px-6 py-3 text-sm font-semibold text-forest transition-colors hover:bg-forest hover:text-cream"
                >
                  View certificates
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section
        id="certificates"
        className="scroll-mt-24 bg-sand/50 pt-6 pb-16 sm:pt-8 sm:pb-24"
      >
        <Container>
          <SectionHeading
            title="Training & certificates"
            description="The training behind the sessions in Lisbon — tap a diploma to open it."
          />
          <div className="mt-12">
            <CredentialsGallery />
          </div>
        </Container>
      </section>

      <Section>
        <SectionHeading
          eyebrow="What guides me"
          title="My approach"
        />
        <div className="mt-12 grid gap-3 sm:grid-cols-3">
          {values.map((v) => (
            <div
              key={v.title}
              className="rounded-xl border border-sand-dark bg-white p-4"
            >
              <h3 className="text-base font-medium text-forest sm:text-lg">
                {v.title}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted sm:text-sm">
                {v.text}
              </p>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
