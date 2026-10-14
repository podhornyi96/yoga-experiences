import type { Metadata } from "next";
import { GiftPurchaseForm } from "@/components/GiftPurchaseForm";
import { Container } from "@/components/Container";
import { JsonLd } from "@/components/JsonLd";
import { SectionHeading } from "@/components/Section";
import { pageSeo } from "@/lib/seo";
import { breadcrumbSchema } from "@/lib/structured-data";

export const metadata: Metadata = pageSeo({
  title: "Give a yoga gift | Ivanna Yoga",
  description:
    "Buy a yoga experience in Lisbon as a gift. Sunrise, sunset, or a private session for one or two people. The recipient chooses the date.",
  path: "/gift/",
  absolute: true,
});

export default function GiftPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Gifts", path: "/gift/" },
        ])}
      />
      <section className="bg-gradient-to-b from-sand to-cream">
        <Container className="py-6 sm:py-8 lg:py-10">
          <SectionHeading
            as="h1"
            eyebrow="Gift certificate"
            title="Give a yoga experience"
            description="Pay in full now. They pick a sunrise, sunset, or private session when it suits them — nothing more to pay."
          />
          <GiftPurchaseForm />
        </Container>
      </section>
    </>
  );
}
