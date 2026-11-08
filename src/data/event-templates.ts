/**
 * Bookable *event* templates (trainer-organised).
 * Instant-book inventory (Sunrise / Sunset / Private) stays on experience pages + Schedule.
 */

import type { Faq } from "@/data/experiences";

export type EventStory = {
  kicker: string;
  title: string;
  gloss: string;
  during: string;
  steps: { title: string; detail: string }[];
  closingBefore: string;
  closingStrong: string;
  closingAfter: string;
};

export type EventTemplate = {
  slug: string;
  title: string;
  summary: string;
  description: string;
  /** Longer story on the event page, shown below the date and price. */
  story?: {
    en: EventStory;
    uk: EventStory;
  };
  locationLabel: string;
  /** Extra line under the pin on the event page. Not shown on cards. */
  locationNote?: string;
  locationUrl?: string;
  /** Step-by-step how to enter the venue (shown in a details modal). */
  accessDirections?: string[];
  faq?: Faq[];
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
      "Jala Sadhana, a water practice: breath and inner observation, a soft warm-up and Jala Namaskar, hip-opening postures, then Nadi Shodhana and Shavasana with Divya, a brook chime, and Koshi chimes.",
    story: {
      en: {
        kicker: "Water",
        title: "Jala Sadhana",
        gloss: "jala — water · sādhana — spiritual practice",
        during: "During this time we",
        steps: [
          {
            title: "Settle in",
            detail:
              "breath (Dirgha Pranayama) and observation (Antar Mauna)",
          },
          {
            title: "Wake the body",
            detail:
              "a gentle warm-up and Jala Namaskar (Salutation to Water)",
          },
          {
            title: "Open the hips",
            detail: "static postures",
          },
          {
            title: "Close",
            detail:
              "Nadi Shodhana Pranayama and Shavasana, with Divya, a brook chime, and Koshi chimes",
          },
        ],
        closingBefore:
          "A gentle shift from the active summer-and-autumn state into a quieter winter one. Through movement and concentration we learn to slow down, so the session holds both ",
        closingStrong: "an active part and a calm one",
        closingAfter: ".",
      },
      uk: {
        kicker: "Вода",
        title: "Джала садхана",
        gloss: "jala — вода · sādhana — духовна практика",
        during: "Протягом цього часу ми",
        steps: [
          {
            title: "Налаштовуємося",
            detail:
              "дихання (Дірґха Пранаяма) та спостереження (Антар Мауна)",
          },
          {
            title: "Запускаємо тіло",
            detail:
              "м’яка розминка та Джала Намаскар (Привітання Воді)",
          },
          {
            title: "Закріплюємо",
            detail: "статичні асани на розкриття тазу",
          },
          {
            title: "Завершуємо",
            detail:
              "Наді Шодхана Пранаяма та шавасана з Дів’єю, струмочком і коші",
          },
        ],
        closingBefore:
          "М’який перехід від активного літньо-осіннього стану до спокійного зимового. Через рух і концентрацію ми вчимося уповільнюватися, тож практика поєднує ",
        closingStrong: "і активний блок, і спокійний",
        closingAfter: ".",
      },
    },
    locationLabel: "Sintra",
    locationNote: "Sintra (5-minute walk from train station)",
    faq: [
      {
        question: "What happens after I pay?",
        answer:
          "You get a confirmation email straight away. It includes the date, start time (Lisbon time), duration, number of places, the amount paid, a Google Maps link to the meeting point, and a link to join the Telegram group, where the latest details and any updates are posted.",
      },
      {
        question: "How do I get there?",
        answer:
          "Take the train to Sintra station, then walk about 5 minutes. There is parking for cars. The pin is not on this page. Right after you pay, we email you a Google Maps link to the location and the rest of the event details.",
      },
      {
        question: "What should I bring?",
        answer:
          "All the equipment for the practice is included, and the room is heated. Wear clothes you can move in and bring water.",
      },
      {
        question: "Do I need experience?",
        answer:
          "No. It is open to all levels, including complete beginners, if you have no medical contraindications.",
      },
      {
        question: "Can I cancel or change the date?",
        answer:
          "Payment is non-refundable, and a scheduled event cannot be moved to another date. Online booking closes 3 hours before the start.",
      },
      {
        question: "What language is the session in?",
        answer:
          "Ukrainian. If someone in the group needs English, the main instructions are repeated in English.",
      },
    ],
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
];

export function getEventTemplate(slug: string): EventTemplate | undefined {
  return EVENT_TEMPLATES.find((t) => t.slug === slug);
}

export function getEventTemplates(): EventTemplate[] {
  return EVENT_TEMPLATES;
}

/** Public share URL — path segment (Instagram-safe). `?id=` still works via rewrite. */
export function eventPagePath(slotId: string): string {
  return `/events/${encodeURIComponent(slotId)}/`;
}
