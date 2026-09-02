import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/Container";
import { Section, SectionHeading } from "@/components/Section";
import { GroupCard } from "@/components/GroupCard";
import { ExperienceCard } from "@/components/ExperienceCard";
import { Testimonials } from "@/components/Testimonials";
import { BehindTheScenes } from "@/components/BehindTheScenes";
import { BookingCTA } from "@/components/BookingCTA";
import { getFeatured } from "@/data/experiences";
import { siteConfig } from "@/config/site";

const steps = [
  {
    title: "Choose your experience",
    text: "Browse sunrise, sunset, forest, private or corporate yoga and pick what fits you.",
  },
  {
    title: "Message on WhatsApp",
    text: "Tap “Book on WhatsApp” and we’ll confirm the next available date together.",
  },
  {
    title: "Secure your spot",
    text: "Confirm your spot on WhatsApp — then just show up and breathe.",
  },
];

export default function HomePage() {
  const featured = getFeatured().filter((e) => e.group === "experiences");

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sand to-cream">
        <Container className="relative grid gap-8 py-10 sm:py-14 lg:grid-cols-2 lg:items-center lg:gap-10 lg:py-16 lg:min-h-[calc(100dvh-4.5rem)]">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-sage-dark">
              Yoga in {siteConfig.geo.city}, {siteConfig.geo.country}
            </p>
            <h1 className="text-3xl leading-tight text-forest sm:text-4xl lg:text-5xl">
              Yoga in Lisbon — from the city to the ocean
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              Sunrise flows, sunset yoga by the ocean, forest immersions in
              Sintra, plus private and corporate sessions. Reconnect with your
              body in the most beautiful corners of {siteConfig.geo.city}.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3 sm:gap-4">
              <BookingCTA size="lg" />
              <Link
                href="/experiences/"
                className="inline-flex items-center justify-center rounded-full border border-forest px-6 py-3.5 text-sm font-semibold text-forest transition-colors hover:bg-forest hover:text-cream sm:px-7 sm:py-4 sm:text-base"
              >
                Browse experiences
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted">
              All levels welcome · Groups of any size · Book by WhatsApp
            </p>
          </div>

          <div className="relative -mx-5 w-[calc(100%+2.5rem)] sm:mx-auto sm:w-4/5 lg:mx-0">
            <div className="relative mx-auto aspect-[2/3] w-full overflow-hidden shadow-xl sm:rounded-[2rem]">
              <Image
                src="/images/me/ivanna-hero-portrait.jpg"
                alt="Ivanna, yoga teacher in Lisbon"
                fill
                priority
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 50vw"
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/15" />
            </div>
          </div>
        </Container>
      </section>

      {/* Groups */}
      <Section>
        <SectionHeading
          eyebrow="What we offer"
          title="Find the right experience for you"
          description="Three ways to practise, each tailored to a different need and moment."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <GroupCard group="experiences" />
          <GroupCard group="private" />
          <GroupCard group="corporate" />
        </div>
      </Section>

      {/* Featured */}
      <Section className="bg-sand/50">
        <SectionHeading
          eyebrow="Most loved"
          title="Featured experiences"
          description="Popular sessions across Lisbon — book your spot before they fill up."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {featured.map((exp) => (
            <ExperienceCard key={exp.slug} experience={exp} compact />
          ))}
        </div>
      </Section>

      {/* How it works */}
      <Section>
        <SectionHeading
          eyebrow="How it works"
          title="Booking is simple"
          description="No accounts, no friction — just a quick message away."
        />
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.title} className="relative rounded-2xl p-2">
              <span className="font-display text-5xl text-sand-dark">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 text-xl text-forest">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeading
          eyebrow="Behind the scenes"
          title="Take a peek behind the scenes"
          description="Real sessions around Lisbon — sunrise, the river, and sunset by the ocean."
        />
        <BehindTheScenes />
      </Section>

      {/* Testimonials */}
      <Section className="bg-sand/50">
        <SectionHeading
          eyebrow="Kind words"
          title="What people say"
        />
        <div className="mt-12">
          <Testimonials />
        </div>
      </Section>

      {/* Final CTA */}
      <Section>
        <div className="rounded-[2rem] bg-forest px-8 py-16 text-center text-cream sm:px-16">
          <h2 className="mx-auto max-w-2xl text-3xl text-cream sm:text-4xl">
            Ready to roll out your mat in Lisbon?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-cream/80">
            Message me on WhatsApp and let’s find the perfect session for you.
          </p>
          <div className="mt-8 flex justify-center">
            <BookingCTA size="lg" variant="primary" />
          </div>
        </div>
      </Section>
    </>
  );
}
