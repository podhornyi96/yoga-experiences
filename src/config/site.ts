/**
 * Central site configuration. Edit placeholder values here once you have the
 * real contact details and geo data. Everything (SEO, structured
 * data, booking links, footer) reads from this file.
 */

export const siteConfig = {
  name: "Ivanna Yoga Lisbon",
  // Short tagline used in hero / OG.
  tagline: "Yoga experiences in Lisbon — sunrise, sunset by the ocean & in the parks",
  description:
    "Book unforgettable yoga experiences in Lisbon: sunrise and sunset sessions, forest immersions in Sintra, corporate yoga for IT teams, and private 1:1 sessions in person.",
  // Production URL — update before launch. Used for canonical URLs, sitemap and OG.
  url: "https://ivanna-yoga.com",
  locale: "en",
  // Default Open Graph image (1200×630 JPG) for link previews.
  ogImage: "/og.jpg",

  // Teacher / brand
  teacher: {
    name: "Ivanna",
    role: "Certified Yoga Teacher (RYT-300)",
    languages: ["English", "Ukrainian", "Russian"],
  },

  // Contact & booking
  contact: {
    email: "ivannapylypchuk@gmail.com",
    // International format without "+" or spaces, used for wa.me links.
    whatsapp: "351964275367",
    // Pretty version for display.
    whatsappDisplay: "+351 964 275 367",
    instagram: "https://instagram.com/ivanna.yoga.guide",
    instagramHandle: "@ivanna.yoga.guide",
    telegram: "https://t.me/ivanna_pylypchuk",
    telegramHandle: "@ivanna_pylypchuk",
  },

  // Geo / local SEO data for Lisbon.
  geo: {
    city: "Lisbon",
    region: "Lisbon",
    country: "Portugal",
    countryCode: "PT",
    // Approximate Lisbon center — update with your actual base location.
    latitude: 38.7223,
    longitude: -9.1393,
    // Areas served — used for local SEO copy and structured data.
    areasServed: [
      "Lisbon",
      "Sintra",
      "Alfama",
      "Príncipe Real",
      "Cascais",
      "Costa da Caparica",
    ],
    priceRange: "€€",
  },

  // Currency used across pricing.
  currency: "EUR" as const,

  // Group experiences with slots: soft-hold → Stripe deposit checkout.
  paymentsEnabled: true,

  /** Soft-hold length when a guest selects a schedule slot (minutes). */
  scheduleHoldMinutes: 20,

  /** Wall-clock timezone for schedule slots shown to guests and set by admin. */
  scheduleTimezone: "Europe/Lisbon" as const,

  // Meta (Facebook) Pixel ID from Events Manager. Leave empty to skip loading.
  // Can also be overridden via NEXT_PUBLIC_META_PIXEL_ID (Cloudflare Pages build env).
  metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "1674795200888489",

  // Microsoft Clarity project ID. Leave empty to skip loading.
  // Can also be overridden via NEXT_PUBLIC_CLARITY_ID (Cloudflare Pages build env).
  clarityId: process.env.NEXT_PUBLIC_CLARITY_ID ?? "yc4t014jn9",

  // Cloudflare Web Analytics token (cookieless pageviews). Leave empty to skip.
  // Override via NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN in Pages build env if needed.
  cfWebAnalyticsToken:
    process.env.NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN ??
    "17f2f796ec024b94937b4962236cbdcd",

  // Google Ads tag (gtag.js). Leave empty to skip loading.
  // Conversion label is the send_to suffix from the Purchase action tag setup.
  googleAdsId: process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? "AW-18460763664",
  googleAdsPurchaseLabel:
    process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL ?? "",
};

export type SiteConfig = typeof siteConfig;

/** Build a WhatsApp deep link with a pre-filled message. */
export function whatsappLink(message: string): string {
  const base = `https://wa.me/${siteConfig.contact.whatsapp}`;
  return `${base}?text=${encodeURIComponent(message)}`;
}
