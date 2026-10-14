import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { GiftSuccessClient } from "@/components/GiftSuccessClient";
import { SectionHeading } from "@/components/Section";
import { pageSeo } from "@/lib/seo";

export const metadata: Metadata = pageSeo({
  title: "Gift certificate",
  description: "Your yoga gift certificate.",
  path: "/gift/success/",
  noIndex: true,
});

export default function GiftSuccessPage() {
  return (
    <section className="bg-gradient-to-b from-sand to-cream">
      <Container className="py-10 sm:py-14">
        <SectionHeading
          as="h1"
          eyebrow="Gift"
          title="Certificate ready"
          description="Keep this page or the email. The code is used only when a date is booked."
        />
        <GiftSuccessClient />
        <p className="mt-8 text-center text-sm">
          <Link
            href="/gift/"
            className="font-medium text-forest underline-offset-2 hover:underline"
          >
            Back to gifts
          </Link>
        </p>
      </Container>
    </section>
  );
}
