/**
 * Bookable *event* templates (trainer-organised).
 * Instant-book inventory (Sunrise / Sunset / Private) stays on experience pages + Schedule.
 */

export type EventTemplate = {
  slug: string;
  title: string;
  summary: string;
  description: string;
  locationLabel: string;
  locationUrl?: string;
  /** Step-by-step how to enter the venue (shown in a details modal). */
  accessDirections?: string[];
  durationMinutes: number;
  maxGuests: number;
  images: string[];
  includes: string[];
  /** Fixed € per person. */
  pricePerPersonEur: number;
  mats: boolean;
  /** Always full pay for events. */
  depositRate: 1;
  /** Optional marketing page (WhatsApp request flow — not instant event book). */
  marketingSlug?: string;
};

const SALDANHA_MAPS =
  "https://www.google.com/maps/place//data=!4m2!3m1!1s0xd19330267ebcd11:0x1e1e5d6ced79b02e?sa=X&ved=1t:8290&ictx=111";

export const EVENT_TEMPLATES: EventTemplate[] = [
  {
    slug: "yoga-studio-saldanha",
    title: "Yoga Studio Saldanha",
    summary:
      "A grounded studio session in Lisbon — accessible yoga for all levels.",
    description:
      "A one-hour yoga class at Yoga Studio Saldanha. Clear guidance, steady pacing, and a calm room to move and breathe. All levels welcome.",
    locationLabel: "Yoga Studio Saldanha, Lisbon",
    locationUrl: SALDANHA_MAPS,
    accessDirections: [
      "Enter the building — at the entrance there’s a round button; just touch it and the main door will open.",
      "Then take the elevator to floor 5C (the elevator opens the same way as the main door).",
    ],
    durationMinutes: 60,
    maxGuests: 7,
    pricePerPersonEur: 20,
    images: [
      "/images/corporate-yoga-it/corporate-yoga-it-3.jpg",
      "/images/corporate-yoga-it/corporate-yoga-it-4.jpg",
    ],
    includes: [
      "Studio space",
      "Yoga mats included",
      "Dynamic morning Hatha yoga",
      "Guided yoga class",
      "All levels welcome",
    ],
    mats: false,
    depositRate: 1,
  },
  {
    slug: "yoga-cascais-wooden-house",
    title: "Wooden House Yoga in Cascais",
    summary:
      "A 2-hour immersion in a cosy wooden house — movement, breathwork, meditation and sound healing by the coast.",
    description:
      "Step into a warm wooden house in Cascais for a slow, nourishing yoga experience. Small group, all equipment provided.",
    locationLabel: "Cascais",
    durationMinutes: 120,
    maxGuests: 6,
    pricePerPersonEur: 35,
    images: [
      "/images/experiences/cascais/cascais-3.jpg",
      "/images/experiences/cascais/cascais-1.jpg",
      "/images/experiences/cascais/cascais-2.jpg",
      "/images/experiences/cascais/cascais-4.jpg",
    ],
    includes: [
      "All equipment (yoga mats)",
      "Guided movement & breathwork",
      "Meditation",
      "Sound healing session",
    ],
    mats: false,
    depositRate: 1,
    marketingSlug: "yoga-cascais-wooden-house",
  },
  {
    slug: "yoga-sintra-forest",
    title: "Yoga in Sintra Forest",
    summary:
      "A 2.5-hour forest immersion — meditation, breathwork, movement and sound healing in Sintra.",
    description:
      "An immersive experience in the Sintra forest combining deep meditation, conscious breathwork, mindful movement and sound healing.",
    locationLabel: "Sintra",
    durationMinutes: 150,
    maxGuests: 20,
    pricePerPersonEur: 40,
    images: [
      "/images/experiences/sintra/sintra-cover.jpg",
      "/images/experiences/sintra/sintra-1.jpg",
      "/images/experiences/sintra/sintra-2.jpg",
      "/images/experiences/sintra/sintra-3.jpg",
    ],
    includes: [
      "Yoga mat & equipment",
      "Guided meditation & breathwork",
      "Sound healing session",
      "2.5-hour forest immersion",
    ],
    mats: false,
    depositRate: 1,
    marketingSlug: "yoga-sintra-forest",
  },
];

export function getEventTemplate(slug: string): EventTemplate | undefined {
  return EVENT_TEMPLATES.find((t) => t.slug === slug);
}

export function getEventTemplates(): EventTemplate[] {
  return EVENT_TEMPLATES;
}

export function eventPagePath(slotId: string): string {
  return `/events/?id=${encodeURIComponent(slotId)}`;
}
