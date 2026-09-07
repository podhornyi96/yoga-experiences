/**
 * Single source of truth for all offerings (experiences, private, corporate).
 * Placeholder content — replace text, prices and images with the real ones.
 *
 * The data model is intentionally structured (typed price, booking type, tags)
 * so that adding online payments later is a small, localized change.
 */

import type { GroupPriceSchedule } from "@/lib/group-pricing";

export type Group = "experiences" | "private" | "corporate";

export type PriceUnit =
  | "per_person"
  | "per_session"
  | "per_group"
  | "per_month"
  | "from";

export type BookingType = "whatsapp" | "request"; // future: | "checkout"

export type TimeOfDay = "sunrise" | "day" | "sunset";
export type Location =
  | "ocean"
  | "estrela"
  | "graca"
  | "sintra"
  | "cascais"
  | "studio"
  | "online"
  | "onsite";
export type Level = "all-levels" | "beginner" | "intermediate";

export interface Price {
  amount: number;
  currency: "EUR";
  unit: PriceUnit;
  /** Prefix display with "From", e.g. From €50 per session */
  from?: boolean;
}

export interface Faq {
  question: string;
  answer: string;
}

export type ImageFocalPoint = "top" | "center" | "bottom" | `${number}% ${number}%`;

export interface Experience {
  slug: string;
  group: Group;
  title: string;
  /** Short one-liner for cards and meta descriptions. */
  summary: string;
  /** Full paragraph(s) for the detail page. */
  description: string;
  price: Price;
  bookingType: BookingType;
  duration: string;
  groupSize: string;
  /** Human-readable location label for display + local SEO. */
  locationLabel: string;
  /** Optional Google Maps (or other) link for the meeting point. */
  locationUrl?: string;
  tags: {
    timeOfDay?: TimeOfDay;
    location: Location;
    level: Level;
  };
  highlights: string[];
  includes: string[];
  /** Image paths under /public. First image is the cover. */
  images: string[];
  /** Focal point for cover image cropping (default: center). */
  coverImagePosition?: ImageFocalPoint;
  /** Focal point on listing cards; falls back to coverImagePosition. */
  cardImagePosition?: ImageFocalPoint;
  faq: Faq[];
  featured?: boolean;
  /**
   * When set, the detail page shows a people selector and a live group price.
   */
  groupPricing?: {
    maxGuests: number;
    schedule: GroupPriceSchedule;
    /** Offer optional yoga-mat rental (€5 each, max 6). */
    mats?: boolean;
  };
  /** Yoga-mat add-on on the detail page (€5 each, max 6). Implied by groupPricing. */
  matRental?: boolean;
  /** Fixed party size when people aren't selectable (Private / Tandem). */
  fixedGuests?: number;
}

export const groups: Record<
  Group,
  { slug: string; label: string; tagline: string; description: string }
> = {
  experiences: {
    slug: "experiences",
    label: "Experiences",
    tagline: "Sunrise, sunset, forest & Cascais immersions near Lisbon",
    description:
      "Book unforgettable yoga experiences — sunrise flows in the city, sunset sessions by the ocean, forest immersions in Sintra, and intimate retreats in a wooden house in Cascais. Perfect for locals, expats and travellers.",
  },
  private: {
    slug: "private",
    label: "Private",
    tagline: "Personalised 1:1 or tandem sessions in Lisbon",
    description:
      "Personalised private yoga in Lisbon. Whether you are starting out, recovering, or deepening your practice, sessions are fully adapted to your body and goals.",
  },
  corporate: {
    slug: "corporate",
    label: "Corporate",
    tagline: "Yoga & wellbeing for IT teams in Lisbon",
    description:
      "On-site yoga for companies in Lisbon. A simple, high-impact wellbeing benefit that reduces stress and boosts focus for your tech team.",
  },
};

export const experiences: Experience[] = [
  // ---------------- EXPERIENCES (ticketed events) ----------------
  {
    slug: "sunrise-yoga-lisbon",
    group: "experiences",
    title: "Sunrise Yoga",
    summary:
      "Start your day with a gentle sunrise flow and the city waking up around you.",
    description:
      "Greet the day with a calming Vinyasa flow as the sun rises over Lisbon. This sunrise yoga session blends mindful movement and breathwork to leave you grounded, energised and clear-headed before the city wakes up. Suitable for all levels — modifications offered throughout.",
    price: { amount: 50, currency: "EUR", unit: "from" },
    bookingType: "whatsapp",
    duration: "60 min",
    groupSize: "Up to 30 people",
    groupPricing: { maxGuests: 30, schedule: "coastal", mats: true },
    locationLabel: "Largo Portas do Sol",
    locationUrl:
      "https://maps.app.goo.gl/NyVbTeYwjc7KskRX8?g_st=ic",
    tags: { timeOfDay: "sunrise", location: "graca", level: "all-levels" },
    highlights: [
      "Beat the heat and the crowds",
      "Breathwork + gentle Vinyasa",
      "Stunning early-morning city light",
    ],
    includes: ["Yoga mat (€5, on request)", "Guided breathwork"],
    images: [
      "/images/experiences/sunrise-yoga-lisbon/sunrise-yoga-lisbon-1.jpg",
      "/images/experiences/sunrise-yoga-lisbon/sunrise-yoga-lisbon-2.jpg",
      "/images/experiences/sunrise-yoga-lisbon/sunrise-yoga-lisbon-3.jpg",
      "/images/experiences/sunrise-yoga-lisbon/sunrise-yoga-lisbon-4.jpg",
      "/images/experiences/sunrise-yoga-lisbon/sunrise-yoga-lisbon-5.jpg",
      "/images/experiences/sunrise-yoga-lisbon/sunrise-yoga-lisbon-6.jpg",
      "/images/experiences/sunrise-yoga-lisbon/sunrise-yoga-lisbon-7.jpg",
    ],
    faq: [
      {
        question: "Do I need to bring a mat?",
        answer:
          "You can rent a yoga mat for €5 — choose how many you need when you book. You're also welcome to bring your own.",
      },
      {
        question: "What if I'm a complete beginner?",
        answer:
          "Perfect — sunrise sessions are gentle and all-levels, with modifications offered for every pose.",
      },
    ],
    featured: true,
  },
  {
    slug: "sunset-yoga-ocean",
    group: "experiences",
    title: "Sunset Yoga by the Ocean",
    summary:
      "Unwind with a slow flow on the sand as the sun sets over the Atlantic.",
    description:
      "Roll out your mat at Praia das Avencas (Parede) and flow with the sound of the waves. This sunset yoga experience by the ocean combines a slow, restorative practice with golden-hour views over the Atlantic — the perfect way to end the day.",
    price: { amount: 50, currency: "EUR", unit: "from" },
    bookingType: "whatsapp",
    duration: "60 min",
    groupSize: "Up to 8 people",
    groupPricing: { maxGuests: 8, schedule: "coastal", mats: true },
    locationLabel: "Praia das Avencas (Parede)",
    locationUrl:
      "https://maps.app.goo.gl/C7LJKA8XEhHEnFdg8?g_st=ic",
    tags: { timeOfDay: "sunset", location: "ocean", level: "all-levels" },
    highlights: [
      "Golden-hour ocean views",
      "Slow, restorative flow",
      "Sound of the waves",
    ],
    includes: [
      "Guided relaxation",
      "Beach-friendly sequence",
      "Small group",
      "Yoga mat (€5, on request)",
    ],
    images: [
      "/images/experiences/sunset-yoga-ocean/sunset-yoga-ocean-1.jpg",
      "/images/experiences/sunset-yoga-ocean/sunset-yoga-ocean-2.jpg",
      "/images/experiences/sunset-yoga-ocean/sunset-yoga-ocean-3.jpg",
      "/images/experiences/sunset-yoga-ocean/sunset-yoga-ocean-4.jpg",
      "/images/experiences/sunset-yoga-ocean/sunset-yoga-ocean-5.jpg",
      "/images/experiences/sunset-yoga-ocean/sunset-yoga-ocean-6.jpg",
      "/images/experiences/sunset-yoga-ocean/sunset-yoga-ocean-7.jpg",
    ],
    cardImagePosition: "50% 70%",
    coverImagePosition: "50% 70%",
    faq: [
      {
        question: "Where exactly do we meet?",
        answer:
          "We meet at Praia das Avencas (Parede). The exact spot on the beach is shared on WhatsApp after booking.",
      },
      {
        question: "What should I bring?",
        answer:
          "Water and something warm for the relaxation at the end. You can rent a yoga mat for €5 when you book, or bring your own towel or mat.",
      },
    ],
    featured: true,
  },
  {
    slug: "yoga-cascais-wooden-house",
    group: "experiences",
    title: "Wooden House Yoga in Cascais",
    summary:
      "A 2-hour immersion in a cosy wooden house — movement, breathwork, meditation and sound healing by the coast.",
    description:
      "Step into a warm wooden house in Cascais for a slow, nourishing yoga experience designed for a small group. Over two hours you'll move through mindful Hatha-inspired sequences, conscious breathwork and guided meditation, ending with a calming sound healing session. All mats and equipment are provided — just arrive, settle in, and let the natural wood and coastal calm do the rest. An intimate alternative to the city — perfect if you want depth, quiet and personal attention.",
    price: { amount: 180, currency: "EUR", unit: "per_session" },
    bookingType: "whatsapp",
    duration: "2 hrs",
    groupSize: "Up to 6 people",
    locationLabel: "Cascais",
    tags: { timeOfDay: "day", location: "cascais", level: "all-levels" },
    highlights: [
      "Cosy wooden house setting",
      "Small group — up to 6 people",
      "Movement, breath, meditation & sound healing",
    ],
    includes: [
      "All equipment (yoga mats)",
      "Guided movement & breathwork",
      "Meditation",
      "Sound healing session",
    ],
    images: [
      "/images/experiences/cascais/cascais-3.jpg",
      "/images/experiences/cascais/cascais-1.jpg",
      "/images/experiences/cascais/cascais-2.jpg",
      "/images/experiences/cascais/cascais-4.jpg",
      "/images/experiences/cascais/cascais-5.jpg",
      "/images/experiences/cascais/cascais-6.jpg",
    ],
    coverImagePosition: "50% 70%",
    cardImagePosition: "50% 70%",
    faq: [
      {
        question: "Is equipment included?",
        answer:
          "Yes — yoga mats and everything you need for the session are provided. Just wear comfortable clothes and bring water.",
      },
      {
        question: "How do I get to Cascais?",
        answer:
          "Cascais is an easy train ride from Lisbon. The exact address is shared on WhatsApp after you book, along with directions.",
      },
    ],
    featured: true,
  },
  {
    slug: "yoga-sintra-forest",
    group: "experiences",
    title: "Yoga in Sintra Forest",
    summary:
      "A 2.5-hour forest immersion — meditation, breathwork, movement and sound healing in Sintra.",
    description:
      "An immersive 2.5-hour experience in the Sintra forest combining deep meditation, conscious breathwork, mindful movement and sound healing. Step away from the city and reconnect with yourself among the trees. All equipment is included — just bring yourself.",
    price: { amount: 299, currency: "EUR", unit: "from" },
    bookingType: "whatsapp",
    duration: "2.5 hrs",
    groupSize: "Up to 20 people",
    groupPricing: { maxGuests: 20, schedule: "sintra" },
    locationLabel: "Sintra",
    tags: { timeOfDay: "day", location: "sintra", level: "all-levels" },
    highlights: [
      "Deep meditation & breathwork",
      "Sound healing in nature",
      "All equipment included",
    ],
    includes: [
      "Yoga mat & equipment",
      "Guided meditation & breathwork",
      "Sound healing session",
      "2.5-hour forest immersion",
    ],
    images: [
      "/images/experiences/sintra/sintra-cover.jpg",
      "/images/experiences/sintra/sintra-1.jpg",
      "/images/experiences/sintra/sintra-2.jpg",
      "/images/experiences/sintra/sintra-3.jpg",
      "/images/experiences/sintra/sintra-5.jpg",
      "/images/experiences/sintra/sintra-6.jpg",
      "/images/experiences/sintra/sintra-7.jpg",
      "/images/experiences/sintra/sintra-8.jpg",
      "/images/experiences/sintra/sintra-9.jpg",
      "/images/experiences/sintra/sintra-10.jpg",
    ],
    cardImagePosition: "50% 70%",
    coverImagePosition: "50% 70%",
    faq: [
      {
        question: "Is equipment really included?",
        answer:
          "Yes — mats and everything you need for the session are provided. Just wear comfortable clothes and bring water.",
      },
      {
        question: "How do I get to Sintra?",
        answer:
          "The exact meeting point in Sintra is shared on WhatsApp after you book, along with directions and transport tips.",
      },
    ],
    featured: true,
  },

  // ---------------- PRIVATE ----------------
  {
    slug: "private-yoga-session",
    group: "private",
    title: "Private Yoga Session",
    summary:
      "A one-off 1:1 session, fully tailored to your body and goals.",
    description:
      "A single private yoga session in Lisbon, designed entirely around you. Ideal if you want focused attention on alignment, a specific goal, or simply a calm, personalised practice. We'll talk through your needs beforehand and shape the session accordingly.",
    price: { amount: 45, currency: "EUR", unit: "per_session" },
    bookingType: "request",
    duration: "75 min",
    groupSize: "1:1",
    locationLabel: "Outdoor or your custom place in Lisbon",
    tags: { location: "onsite", level: "all-levels" },
    highlights: [
      "Fully personalised",
      "In person across Lisbon",
      "Flexible scheduling",
    ],
    includes: [
      "Pre-session consultation",
      "Tailored sequence",
      "Follow-up tips",
      "Yoga mat (€5, on request)",
    ],
    images: [
      "/images/experiences/private-yoga-session/private-yoga-session-1.jpg",
    ],
    faq: [
      {
        question: "Can the session take place at my home?",
        answer:
          "Yes — sessions can take place at your home, in a park, or at another location we agree on in the Lisbon area.",
      },
      {
        question: "Do I need to bring a mat?",
        answer:
          "You can rent a yoga mat for €5 — choose how many you need when you book. You're also welcome to bring your own.",
      },
    ],
    featured: true,
    matRental: true,
    fixedGuests: 1,
  },
  {
    slug: "private-yoga-tandem",
    group: "private",
    title: "Tandem",
    summary:
      "Private yoga for two — practise together with full guidance.",
    description:
      "A private yoga session for exactly two people in Lisbon. Perfect for couples, friends or family who want to share the experience while still getting personalised attention. We'll shape the session around both of your levels and goals.",
    price: { amount: 80, currency: "EUR", unit: "per_session" },
    bookingType: "request",
    duration: "75 min",
    groupSize: "2 people",
    locationLabel: "Outdoor or your custom place in Lisbon",
    tags: { location: "onsite", level: "all-levels" },
    highlights: [
      "Just the two of you",
      "In person across Lisbon",
      "Tailored to both levels",
    ],
    includes: [
      "Pre-session consultation",
      "Shared tailored sequence",
      "Follow-up tips",
      "Yoga mat (€5, on request)",
    ],
    images: ["/images/tandem/tandem-1.jpg"],
    cardImagePosition: "50% 70%",
    coverImagePosition: "50% 70%",
    faq: [
      {
        question: "Do we need to be at the same level?",
        answer:
          "Not at all — I'll adapt the session so you both feel supported and challenged in the right way.",
      },
      {
        question: "Do we need to bring mats?",
        answer:
          "You can rent yoga mats for €5 each — choose how many you need when you book. You're also welcome to bring your own.",
      },
    ],
    matRental: true,
    fixedGuests: 2,
  },

  // ---------------- CORPORATE ----------------
  {
    slug: "corporate-yoga-it",
    group: "corporate",
    title: "Corporate Yoga for IT Teams",
    summary:
      "Recurring on-site yoga to keep your tech team focused and calm.",
    description:
      "A turnkey wellbeing benefit for IT companies in Lisbon. I bring accessible yoga and mobility sessions to your office. Sessions are designed for people who sit at a desk all day — easing back, neck and wrist tension while boosting focus and morale.",
    price: { amount: 50, currency: "EUR", unit: "per_session", from: true },
    bookingType: "request",
    duration: "60 min",
    groupSize: "Whole team",
    locationLabel: "Your office in Lisbon",
    tags: { location: "onsite", level: "all-levels" },
    highlights: [
      "Desk-friendly sessions",
      "Yoga mats needed on site",
      "On-site in your office",
      "Flexible weekly or monthly plans",
    ],
    includes: [
      "Custom plan for your team",
      "All levels & abilities",
      "Invoicing for companies",
    ],
    images: [
      "/images/corporate-yoga-it/corporate-yoga-it-2.jpg",
      "/images/corporate-yoga-it/corporate-yoga-it-1.jpg",
      "/images/corporate-yoga-it/corporate-yoga-it-3.jpg",
      "/images/corporate-yoga-it/corporate-yoga-it-4.jpg",
      "/images/corporate-yoga-it/corporate-yoga-it-5.jpg",
      "/images/corporate-yoga-it/corporate-yoga-it-6.jpg",
    ],
    coverImagePosition: "50% 80%",
    faq: [
      {
        question: "Do you offer invoices for companies?",
        answer:
          "Yes — corporate sessions are invoiced. Tell me your team size and goals on WhatsApp or by email for a quote.",
      },
      {
        question: "What space do we need in the office?",
        answer:
          "A quiet room or open area where the team can spread out on mats — I'll share simple setup tips when we plan your sessions.",
      },
    ],
    featured: true,
  },
];

// ---------------- Helpers ----------------

export function getExperienceBySlug(slug: string): Experience | undefined {
  return experiences.find((e) => e.slug === slug);
}

export function getExperiencesByGroup(group: Group): Experience[] {
  return experiences.filter((e) => e.group === group);
}

export function getFeatured(): Experience[] {
  return experiences.filter((e) => e.featured);
}

/** Public URL path for an offering (corporate lives on /corporate/, not /experiences/). */
export function experiencePagePath(exp: Experience): string {
  if (exp.group === "corporate") return "/corporate/";
  return `/experiences/${exp.slug}/`;
}

/** Offerings that get a dedicated /experiences/[slug]/ page. */
export function getExperienceDetailPages(): Experience[] {
  return experiences.filter((e) => e.group !== "corporate");
}

export function hasLiveBooking(exp: Experience): boolean {
  return Boolean(exp.groupPricing || exp.matRental);
}

const unitLabels: Record<PriceUnit, string> = {
  per_person: "per person",
  per_session: "per session",
  per_group: "per group",
  per_month: "per month",
  from: "",
};

/** Format a price for display, e.g. "€18 per person" or "From €270". */
export function formatPrice(price: Price): string {
  if (price.amount === 0) {
    return "On request";
  }
  const amount = `€${price.amount}`;
  if (price.unit === "from") {
    return `From ${amount}`;
  }
  const unit = unitLabels[price.unit];
  const base = unit ? `${amount} ${unit}` : amount;
  return price.from ? `From ${base}` : base;
}
