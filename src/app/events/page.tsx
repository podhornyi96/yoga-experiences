import type { Metadata } from "next";
import { EventPageClient } from "@/components/EventPageClient";
import { pageSeo } from "@/lib/seo";

export const metadata: Metadata = pageSeo({
  title: "Scheduled yoga session",
  description:
    "View date, location and book a scheduled yoga session with Ivanna in Lisbon.",
  path: "/events/",
  noIndex: true,
});

export default function EventsPage() {
  return (
    <section className="bg-gradient-to-b from-sand to-cream">
      <EventPageClient />
    </section>
  );
}
