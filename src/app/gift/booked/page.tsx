import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { SectionHeading } from "@/components/Section";
import { pageSeo } from "@/lib/seo";

export const metadata: Metadata = pageSeo({
  title: "Gift booked",
  description: "Your gifted yoga session is booked.",
  path: "/gift/booked/",
  noIndex: true,
});

export default function GiftBookedPage() {
  return (
    <section className="bg-gradient-to-b from-sand to-cream">
      <Container className="py-10 sm:py-14">
        <SectionHeading
          as="h1"
          eyebrow="Booking"
          title="You're booked"
          description="The gift covered the session. Check your email for the time and meeting point."
        />
        <p className="mt-8 text-center text-sm">
          <Link
            href="/experiences/"
            className="font-medium text-forest underline-offset-2 hover:underline"
          >
            Back to experiences
          </Link>
        </p>
      </Container>
    </section>
  );
}
