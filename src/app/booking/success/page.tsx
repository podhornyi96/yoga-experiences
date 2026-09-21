import type { Metadata } from "next";
import Link from "next/link";
import { BookingCTA } from "@/components/BookingCTA";
import { ClearPendingHold } from "@/components/ClearPendingHold";
import { Container } from "@/components/Container";
import { SectionHeading } from "@/components/Section";
import { siteConfig } from "@/config/site";
import {
  DEPOSIT_POLICY_SUCCESS,
  PRIVATE_FULL_PAY_POLICY_SUCCESS,
} from "@/lib/booking-policy";
import { pageSeo } from "@/lib/seo";

export const metadata: Metadata = pageSeo({
  title: "Booking confirmed",
  description:
    "Your payment is received. Check your email for session details, or message us on WhatsApp.",
  path: "/booking/success/",
  noIndex: true,
});

export default function BookingSuccessPage() {
  return (
    <section className="bg-gradient-to-b from-sand to-cream">
      <ClearPendingHold />
      <Container className="py-10 sm:py-14">
        <SectionHeading
          as="h1"
          eyebrow="Booking"
          title="Payment received"
          description="Thank you — your date is reserved. Check your email for confirmation details."
        />
        <div className="mx-auto mt-8 max-w-xl space-y-4 text-center text-sm text-ink">
          <p>
            You’ll also hear from {siteConfig.teacher.name} on WhatsApp if
            anything needs confirming. If anything looks off, message right
            away.
          </p>
          <p className="text-muted">
            <span className="font-medium text-ink">Group experiences:</span>{" "}
            {DEPOSIT_POLICY_SUCCESS}
          </p>
          <p className="text-muted">
            <span className="font-medium text-ink">Private / Tandem:</span>{" "}
            {PRIVATE_FULL_PAY_POLICY_SUCCESS}
          </p>
          <p className="text-muted">
            <Link
              href="/terms/"
              className="font-medium text-forest underline-offset-2 hover:underline"
            >
              Full terms
            </Link>
          </p>
          <div className="flex justify-center pt-1">
            <BookingCTA
              label="Message on WhatsApp"
              message={`Hi ${siteConfig.teacher.name}! I just paid for my yoga booking. Looking forward to it!`}
            />
          </div>
          <p className="pt-2">
            <Link
              href="/experiences/"
              className="font-medium text-forest underline-offset-2 hover:text-clay-dark hover:underline"
            >
              Back to experiences
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}
