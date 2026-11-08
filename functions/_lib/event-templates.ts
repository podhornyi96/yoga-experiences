/**
 * Server-side event templates for /api/events and /api/upcoming.
 * Keep in sync with src/data/event-templates.ts.
 */

export type ServerEventTemplate = {
  slug: string;
  title: string;
  summary: string;
  description: string;
  locationLabel: string;
  locationUrl?: string;
  /** Meeting point in guest emails only. Not returned on the public page. */
  emailMapsUrl?: string;
  /** Location line in guest emails. Falls back to locationLabel. */
  emailLocationLabel?: string;
  /** Extra paragraph in the guest confirmation and reminder emails. */
  emailNote?: string;
  /** Replaces the default “taught in English” line in the confirmation email. */
  languageLine?: string;
  accessDirections?: string[];
  durationMinutes: number;
  maxGuests: number;
  images: string[];
  includes: string[];
  pricePerPersonEur: number;
  mats: boolean;
  depositRate: number;
  marketingSlug?: string;
};

const SALDANHA_MAPS =
  "https://www.google.com/maps/place//data=!4m2!3m1!1s0xd19330267ebcd11:0x1e1e5d6ced79b02e?sa=X&ved=1t:8290&ictx=111";

export const SERVER_EVENT_TEMPLATES: Record<string, ServerEventTemplate> = {
  "yoga-studio-saldanha": {
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
  "yoga-cascais-wooden-house": {
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
  "yoga-sintra-forest": {
    slug: "yoga-sintra-forest",
    title: "Yoga in Sintra Forest",
    summary:
      "A 2.5-hour forest immersion — meditation, breathwork, movement and sound healing in Sintra.",
    description:
      "Jala Sadhana, a water practice: breath and inner observation, a soft warm-up and Jala Namaskar, hip-opening postures, then Nadi Shodhana and Shavasana with Divya, a brook chime, and Koshi chimes.",
    locationLabel: "Sintra",
    emailLocationLabel: "Sintra — 5-minute walk from the train station",
    emailMapsUrl: "https://maps.app.goo.gl/rPB4P8r11A8NxiUh8?g_st=ipc",
    emailNote:
      "We add you to a Telegram channel for this group for any updates before the day.",
    languageLine:
      "The session is beginner-friendly and guided in Ukrainian. If someone in the group needs English, the main instructions are repeated in English.",
    durationMinutes: 150,
    maxGuests: 20,
    pricePerPersonEur: 40,
    images: [
      "/images/experiences/sintra/sintra-cover.jpg",
      "/images/experiences/sintra/sintra-1.jpg",
      "/videos/sintra/sintra-5736.mp4",
      "/images/experiences/sintra/sintra-3.jpg",
      "/videos/sintra/sintra-5744.mp4",
      "/images/experiences/sintra/sintra-11.jpg",
      "/images/experiences/sintra/sintra-2.jpg",
      "/images/experiences/sintra/sintra-5.jpg",
      "/images/experiences/sintra/sintra-6.jpg",
      "/images/experiences/sintra/sintra-7.jpg",
      "/images/experiences/sintra/sintra-8.jpg",
      "/images/experiences/sintra/sintra-9.jpg",
      "/images/experiences/sintra/sintra-10.jpg",
    ],
    includes: [
      "2.5-hour forest immersion",
      "Sound healing session",
      "Guided meditation & breathwork",
      "All equipment included",
      "Heated room",
      "Parking for cars",
    ],
    mats: false,
    depositRate: 1,
    marketingSlug: "yoga-sintra-forest",
  },
};

export function getServerEventTemplate(
  slug: string,
): ServerEventTemplate | undefined {
  return SERVER_EVENT_TEMPLATES[slug];
}

export function effectivePricePerPerson(
  template: ServerEventTemplate,
  slotPriceEur: number | null,
): number {
  if (
    slotPriceEur != null &&
    Number.isFinite(slotPriceEur) &&
    slotPriceEur > 0
  ) {
    return slotPriceEur;
  }
  return template.pricePerPersonEur;
}

export function effectiveDurationMinutes(
  template: ServerEventTemplate,
  slotDuration: number | null,
): number {
  if (
    slotDuration != null &&
    Number.isFinite(slotDuration) &&
    slotDuration > 0
  ) {
    return Math.floor(slotDuration);
  }
  return template.durationMinutes;
}
