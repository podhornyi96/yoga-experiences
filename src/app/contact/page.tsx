import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { SectionHeading } from "@/components/Section";
import { BookingCTA } from "@/components/BookingCTA";
import { JsonLd } from "@/components/JsonLd";
import { siteConfig } from "@/config/site";
import { pageSeo } from "@/lib/seo";
import { breadcrumbSchema } from "@/lib/structured-data";

export const metadata: Metadata = pageSeo({
  title: "Contact & Booking | Yoga in Lisbon",
  description:
    "Book a yoga experience in Lisbon via WhatsApp or email. Sunrise, sunset, park, private and corporate sessions.",
  path: "/contact/",
  absolute: true,
});

export default function ContactPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact/" },
        ])}
      />
      <section className="bg-gradient-to-b from-sand to-cream">
        <Container className="py-6 sm:py-8 lg:min-h-[calc(100dvh-4.5rem)] lg:py-10">
          <SectionHeading
            as="h1"
            eyebrow="Contact & booking"
            title="Book yoga in Lisbon"
            description="Message on WhatsApp with the experience you want — I'll share the next available dates and payment details."
          />
          <div className="mx-auto mt-6 w-full max-w-xl rounded-2xl border border-sand-dark bg-white p-6 shadow-sm sm:p-7">
            <h2 className="text-xl text-forest sm:text-2xl">Get in touch</h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-center justify-between border-b border-sand pb-3">
                <span className="text-muted">WhatsApp</span>
                <span className="font-medium text-ink">
                  {siteConfig.contact.whatsappDisplay}
                </span>
              </li>
              <li className="flex items-center justify-between border-b border-sand pb-3">
                <span className="text-muted">Email</span>
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="font-medium text-ink hover:text-clay-dark"
                >
                  {siteConfig.contact.email}
                </a>
              </li>
              <li className="flex items-center justify-between border-b border-sand pb-3">
                <span className="text-muted">Instagram</span>
                <a
                  href={siteConfig.contact.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-ink hover:text-clay-dark"
                >
                  {siteConfig.contact.instagramHandle}
                </a>
              </li>
              <li className="flex items-center justify-between border-b border-sand pb-3">
                <span className="text-muted">Telegram</span>
                <a
                  href={siteConfig.contact.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-ink hover:text-clay-dark"
                >
                  {siteConfig.contact.telegramHandle}
                </a>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted">Based in</span>
                <span className="font-medium text-ink">
                  {siteConfig.geo.city}, {siteConfig.geo.country}
                </span>
              </li>
            </ul>
            <div className="mt-5">
              <BookingCTA size="lg" className="w-full" />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
