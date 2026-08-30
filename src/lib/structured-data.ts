import { siteConfig } from "@/config/site";
import type { Experience } from "@/data/experiences";
import { experiencePagePath } from "@/data/experiences";

/**
 * LocalBusiness schema for the whole site (rendered in the root layout).
 * Helps Google associate the brand with Lisbon for local search.
 */
export function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "SportsActivityLocation", "HealthClub"],
    "@id": `${siteConfig.url}/#business`,
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    email: siteConfig.contact.email,
    telephone: `+${siteConfig.contact.whatsapp}`,
    image: `${siteConfig.url}${siteConfig.ogImage}`,
    priceRange: siteConfig.geo.priceRange,
    currenciesAccepted: siteConfig.currency,
    address: {
      "@type": "PostalAddress",
      addressLocality: siteConfig.geo.city,
      addressRegion: siteConfig.geo.region,
      addressCountry: siteConfig.geo.countryCode,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: siteConfig.geo.latitude,
      longitude: siteConfig.geo.longitude,
    },
    areaServed: siteConfig.geo.areasServed.map((name) => ({
      "@type": "City",
      name,
    })),
    sameAs: [siteConfig.contact.instagram],
  };
}

/**
 * Service schema for a bookable offering. Not Event: Google Event rich
 * results require a real startDate, and these sessions are booked on request
 * rather than dated occurrences.
 */
export function experienceSchema(exp: Experience) {
  const url = `${siteConfig.url}${experiencePagePath(exp)}`;
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: exp.title,
    name: exp.title,
    description: exp.summary,
    image: `${siteConfig.url}${exp.images[0]}`,
    areaServed: { "@type": "City", name: siteConfig.geo.city },
    provider: {
      "@type": "LocalBusiness",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    offers: {
      "@type": "Offer",
      price: exp.price.amount || undefined,
      priceCurrency: exp.price.currency,
      availability: "https://schema.org/InStock",
      url,
    },
  };
}

/** FAQPage schema built from an experience's FAQ list. */
export function faqSchema(faq: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

/** BreadcrumbList schema. */
export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${siteConfig.url}${item.path}`,
    })),
  };
}
