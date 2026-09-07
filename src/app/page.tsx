import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/Container";
import { Section, SectionHeading } from "@/components/Section";
import { GroupCard } from "@/components/GroupCard";
import { ExperienceCard } from "@/components/ExperienceCard";
import { BehindTheScenes } from "@/components/BehindTheScenes";
import { BookingCTA } from "@/components/BookingCTA";
import { getFeatured } from "@/data/experiences";
import { siteConfig } from "@/config/site";

const steps = [
  {
    title: "Choose your experience",
    text: "Sunrise, sunset, forest, private or corporate — pick what fits you.",
  },
  {
    title: "Message on WhatsApp",
    text: "Tap “Book on WhatsApp” and we’ll confirm the next available date.",
  },
  {
    title: "Show up and breathe",
    text: "Your spot is confirmed. Just arrive — I’ll take it from there.",
  },
];

export default function HomePage() {
  const featured = getFeatured().filter((e) => e.group === "experiences");

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-sand to-cream">
        <div className="absolute inset-0 lg:hidden">
          <Image
            src="/images/me/ivanna-hero-portrait.jpg"
            alt="Ivanna, yoga teacher in Lisbon"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_18%]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-forest from-[12%] via-forest/55 to-forest/20" />
        </div>

        <Container className="relative flex min-h-[calc(100svh-4.5rem)] flex-col justify-end py-8 sm:py-10 lg:grid lg:min-h-[calc(100dvh-4.5rem)] lg:grid-cols-2 lg:items-center lg:gap-10 lg:py-16">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-cream/90 lg:text-sage-dark">
              Yoga in {siteConfig.geo.city}, {siteConfig.geo.country}
            </p>
            <h1 className="text-3xl leading-tight text-cream sm:text-4xl lg:text-5xl lg:text-forest">
              Sunrise over the city. Sunset by the Atlantic.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-cream/85 sm:text-lg lg:text-muted">
              Forest immersions in Sintra, private sessions, and yoga for teams.
              Practise in the most beautiful corners of {siteConfig.geo.city}.
            </p>
            <div className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <BookingCTA size="lg" className="w-full sm:w-auto" />
              <Link
                href="/experiences/"
                className="inline-flex w-full items-center justify-center rounded-full border border-cream px-6 py-3.5 text-sm font-semibold text-cream transition-colors hover:bg-cream hover:text-forest sm:w-auto sm:px-7 sm:py-4 sm:text-base lg:border-forest lg:text-forest lg:hover:bg-forest lg:hover:text-cream"
              >
                Browse experiences
              </Link>
            </div>
            <p className="mt-4 text-sm text-cream/75 lg:text-muted">
              All levels welcome · Groups of any size · Book by WhatsApp
            </p>
          </div>

          <div className="relative hidden lg:block">
            <div className="relative mx-auto aspect-[2/3] w-full overflow-hidden shadow-xl sm:rounded-[2rem]">
              <Image
                src="/images/me/ivanna-hero-portrait.jpg"
                alt="Ivanna, yoga teacher in Lisbon"
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/15" />
            </div>
          </div>
        </Container>
      </section>

      <Section>
        <SectionHeading
          eyebrow="Behind the scenes"
          title="This is what it feels like"
          description="Real sessions around Lisbon — sunrise, the river, and sunset by the ocean."
        />
        <BehindTheScenes />
        <div className="mt-8 flex justify-center">
          <Link
            href="/experiences/"
            className="inline-flex items-center justify-center rounded-full bg-clay px-8 py-4 text-base font-semibold text-cream shadow-sm transition-colors hover:bg-clay-dark"
          >
            View experiences
          </Link>
        </div>
      </Section>

      <Section className="bg-sand/50">
        <SectionHeading
          eyebrow="Most loved"
          title="Featured experiences"
          description="Popular sessions across Lisbon — book your spot before they fill up."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {featured.map((exp) => (
            <ExperienceCard key={exp.slug} experience={exp} />
          ))}
        </div>
      </Section>

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

      <Section className="bg-sand/50">
        <SectionHeading
          eyebrow="How it works"
          title="Booking is simple"
          description="Pick a session, message me, show up."
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
