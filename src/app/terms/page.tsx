import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { SectionHeading } from "@/components/Section";
import { JsonLd } from "@/components/JsonLd";
import { siteConfig } from "@/config/site";
import { RESCHEDULE_NOTICE_HOURS, PRIVATE_CANCEL_NOTICE_HOURS } from "@/lib/booking-policy";
import { DEPOSIT_RATE } from "@/lib/group-pricing";
import { pageSeo } from "@/lib/seo";
import { breadcrumbSchema } from "@/lib/structured-data";

const depositPercent = Math.round(DEPOSIT_RATE * 100);

export const metadata: Metadata = pageSeo({
  title: "Terms of Booking | Yoga in Lisbon",
  description:
    "Booking terms for Ivanna Yoga Lisbon: deposits, remaining balance, and how to reschedule with 48 hours’ notice.",
  path: "/terms/",
  absolute: true,
});

export default function TermsPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Terms", path: "/terms/" },
        ])}
      />
      <section className="bg-gradient-to-b from-sand to-cream">
        <Container className="py-6 sm:py-8 lg:py-10">
          <SectionHeading
            as="h1"
            eyebrow="Terms"
            title="Terms of booking"
            description={`How deposits, balances and rescheduling work when you book with ${siteConfig.name}.`}
            align="left"
          />
        </Container>
      </section>

      <section className="pb-16 sm:pb-24">
        <Container>
          <div className="max-w-2xl space-y-8 text-sm leading-relaxed text-muted sm:text-base">
            <div>
              <h2 className="text-xl text-forest sm:text-2xl">Who these cover</h2>
              <p className="mt-3">
                These terms apply to yoga experiences and sessions booked through{" "}
                {siteConfig.name} ({siteConfig.teacher.name}) in{" "}
                {siteConfig.geo.city}, {siteConfig.geo.country}. Questions:{" "}
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="font-medium text-forest underline decoration-sand-dark underline-offset-2 hover:text-clay-dark"
                >
                  {siteConfig.contact.email}
                </a>{" "}
                or WhatsApp.
              </p>
            </div>

            <div>
              <h2 className="text-xl text-forest sm:text-2xl">Deposits</h2>
              <p className="mt-3">
                For experiences with online booking, a deposit of about{" "}
                {depositPercent}% of the total is paid via Stripe Checkout to hold
                your date. The deposit is non-refundable once payment succeeds.
              </p>
              <p className="mt-3">
                Completing Stripe checkout means you accept these terms and our{" "}
                <Link
                  href="/privacy/"
                  className="font-medium text-forest underline decoration-sand-dark underline-offset-2 hover:text-clay-dark"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </div>

            <div>
              <h2 className="text-xl text-forest sm:text-2xl">
                Rescheduling &amp; cancellation
              </h2>
              <p className="mt-3">
                You may reschedule to another available date at no extra charge if
                you notify us at least {RESCHEDULE_NOTICE_HOURS} hours before the
                scheduled start (Europe/Lisbon time). Contact us on WhatsApp or
                email; we will confirm a new date subject to availability.
              </p>
              <p className="mt-3">
                If you cancel, reschedule with less than{" "}
                {RESCHEDULE_NOTICE_HOURS} hours’ notice, or do not attend, the
                deposit is forfeited. We do not offer cash or card refunds of the
                deposit in those cases.
              </p>
              <p className="mt-3">
                If we must cancel or move a session (weather, illness, or similar),
                we will offer a new date or, if that is not possible, a refund of
                the deposit.
              </p>
            </div>

            <div>
              <h2 className="text-xl text-forest sm:text-2xl">
                Remaining balance
              </h2>
              <p className="mt-3">
                The balance after the deposit is due later — typically on arrival
                or as agreed when you book. Payment methods for the balance are
                confirmed on WhatsApp.
              </p>
            </div>

            <div>
              <h2 className="text-xl text-forest sm:text-2xl">
                Private &amp; tandem (full payment)
              </h2>
              <p className="mt-3">
                Private and tandem park sessions booked online are paid in full
                at checkout. You may cancel for a full refund or reschedule if
                you notify us at least {PRIVATE_CANCEL_NOTICE_HOURS} hours before
                the start (Europe/Lisbon). Contact us on WhatsApp or email — we
                will confirm a new date subject to availability.
              </p>
              <p className="mt-3">
                With less than {PRIVATE_CANCEL_NOTICE_HOURS} hours’ notice, or if
                you do not attend, no refund or reschedule is offered.
              </p>
              <p className="mt-3">
                Sessions are outdoors at the park you choose. If weather makes
                the spot unsafe, we will contact you to reschedule or refund.
                Custom locations (home or elsewhere) are arranged on WhatsApp
                and are not available for instant booking.
              </p>
            </div>

            <div>
              <h2 className="text-xl text-forest sm:text-2xl">
                Corporate bookings
              </h2>
              <p className="mt-3">
                Corporate sessions are arranged without an online checkout.
                Timing, fees and changes are agreed in writing (WhatsApp or
                email) for that booking.
              </p>
            </div>

            <div>
              <h2 className="text-xl text-forest sm:text-2xl">Updates</h2>
              <p className="mt-3">
                We may update these terms from time to time. The version on this
                page applies to new bookings made after it is published.
              </p>
              <p className="mt-3">
                <Link
                  href="/privacy/"
                  className="font-medium text-forest underline decoration-sand-dark underline-offset-2 hover:text-clay-dark"
                >
                  Privacy Policy
                </Link>
                {" · "}
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
