import type { Metadata } from "next";
import { BookingCancelActions } from "@/components/BookingCancelActions";
import { Container } from "@/components/Container";
import { SectionHeading } from "@/components/Section";
import { siteConfig } from "@/config/site";
import { pageSeo } from "@/lib/seo";

export const metadata: Metadata = pageSeo({
  title: "Checkout cancelled",
  description:
    "Payment was cancelled. Your date hold may expire — try again or message on WhatsApp.",
  path: "/booking/cancel/",
  noIndex: true,
});

export default function BookingCancelPage() {
  return (
    <section className="bg-gradient-to-b from-sand to-cream">
      <Container className="py-10 sm:py-14">
        <SectionHeading
          as="h1"
          eyebrow="Booking"
          title="Checkout cancelled"
          description="No deposit was taken. If your soft-hold is still active, you can resume payment below — or pick the date again on the experience page."
        />
        <div className="mx-auto mt-8 max-w-xl space-y-4 text-center text-sm text-ink">
          <p>
            Prefer to book without paying online? Message{" "}
            {siteConfig.teacher.name} on WhatsApp and we’ll sort a date.
          </p>
          <BookingCancelActions />
        </div>
      </Container>
    </section>
  );
}
