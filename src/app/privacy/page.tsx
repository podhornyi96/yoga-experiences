import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { SectionHeading } from "@/components/Section";
import { CookieSettingsButton } from "@/components/CookieSettingsButton";
import { JsonLd } from "@/components/JsonLd";
import { siteConfig } from "@/config/site";
import { pageSeo } from "@/lib/seo";
import { breadcrumbSchema } from "@/lib/structured-data";

export const metadata: Metadata = pageSeo({
  title: "Privacy Policy | Yoga in Lisbon",
  description:
    "How Ivanna Yoga Lisbon uses cookies and analytics: Meta Pixel, Microsoft Clarity, and how to change your consent.",
  path: "/privacy/",
  absolute: true,
});

export default function PrivacyPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Privacy", path: "/privacy/" },
        ])}
      />
      <section className="bg-gradient-to-b from-sand to-cream">
        <Container className="py-6 sm:py-8 lg:py-10">
          <SectionHeading
            as="h1"
            eyebrow="Privacy"
            title="Privacy & cookies"
            description={`How ${siteConfig.name} uses analytics on this site, and how you can change your choice.`}
            align="left"
          />
        </Container>
      </section>

      <section className="pb-16 sm:pb-24">
        <Container>
          <div className="max-w-2xl space-y-8 text-sm leading-relaxed text-muted sm:text-base">
            <div>
              <h2 className="text-xl text-forest sm:text-2xl">Who we are</h2>
              <p className="mt-3">
                This website is run by {siteConfig.teacher.name} ({siteConfig.name})
                in {siteConfig.geo.city}, {siteConfig.geo.country}. For questions
                about privacy, write to{" "}
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="font-medium text-forest underline decoration-sand-dark underline-offset-2 hover:text-clay-dark"
                >
                  {siteConfig.contact.email}
                </a>
                .
              </p>
            </div>

            <div>
              <h2 className="text-xl text-forest sm:text-2xl">
                What we collect without cookies
              </h2>
              <p className="mt-3">
                Booking happens on WhatsApp, email or Instagram. Messages you send
                there are handled by those apps under their own policies. This
                site does not run an account system or a contact form that stores
                your details on our servers.
              </p>
            </div>

            <div>
              <h2 className="text-xl text-forest sm:text-2xl">
                Analytics cookies
              </h2>
              <p className="mt-3">
                If you accept cookies, we load two analytics tools. They are not
                loaded until you choose Accept. Declining leaves the site fully
                usable.
              </p>
              <ul className="mt-4 list-disc space-y-3 pl-5">
                <li>
                  <span className="font-medium text-ink">Meta Pixel</span>{" "}
                  (Meta Platforms Ireland) helps us understand how people find
                  the site from ads and social posts, and which pages they visit.
                </li>
                <li>
                  <span className="font-medium text-ink">Microsoft Clarity</span>{" "}
                  helps us see how the site is used through heatmaps and
                  anonymised session recordings (mouse movement, clicks and
                  scrolling). Recordings can include pages you visit on this
                  site; they are used only to improve the experience.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl text-forest sm:text-2xl">Your choice</h2>
              <p className="mt-3">
                We store your Accept or Decline choice in the browser
                (localStorage). You can change it anytime from the footer or
                here:
              </p>
              <p className="mt-4">
                <CookieSettingsButton className="font-medium text-forest underline decoration-sand-dark underline-offset-2 hover:text-clay-dark" />
              </p>
            </div>

            <div>
              <h2 className="text-xl text-forest sm:text-2xl">
                How long this applies
              </h2>
              <p className="mt-3">
                Your stored choice stays until you change it or clear site data
                in your browser. Analytics providers keep data according to their
                own retention rules.
              </p>
              <p className="mt-3">
                <Link
                  href="/"
                  className="font-medium text-forest underline decoration-sand-dark underline-offset-2 hover:text-clay-dark"
                >
                  Back to home
                </Link>
              </p>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
