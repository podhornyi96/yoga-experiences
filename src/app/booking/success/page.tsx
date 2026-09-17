import type { Metadata } from "next";
import Link from "next/link";
import { BookingCTA } from "@/components/BookingCTA";
import { ClearPendingHold } from "@/components/ClearPendingHold";
import { Container } from "@/components/Container";
import { SectionHeading } from "@/components/Section";
import { siteConfig } from "@/config/site";
import { DEPOSIT_POLICY_SUCCESS } from "@/lib/booking-policy";
import { pageSeo } from "@/lib/seo";

export const metadata: Metadata = pageSeo({
  title: "Booking confirmed",
  description:
    "Your deposit is paid. We'll confirm meeting details and the remaining balance.",
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
          title="Deposit received"
          description="Thank you — your date is reserved. The remaining balance is due later (on arrival or as agreed)."
        />
        <div className="mx-auto mt-8 max-w-xl space-y-4 text-center text-sm text-ink">
          <p>
            You’ll get meeting details from {siteConfig.teacher.name} on
            WhatsApp. If anything looks off, message right away.
          </p>
          <p className="text-muted">
            {DEPOSIT_POLICY_SUCCESS}{" "}
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
              message={`Hi ${siteConfig.teacher.name}! I just paid the deposit for my yoga booking. Looking forward to it!`}
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
