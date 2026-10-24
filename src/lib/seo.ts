import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

/** Shared title / description / canonical / Open Graph / Twitter for one page. */
export function pageSeo({
  title,
  description,
  path,
  image,
  absolute = false,
  noIndex = false,
  omitCanonicalUrl = false,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  /** Skip the root title template (`%s — Ivanna Yoga Lisbon`). */
  absolute?: boolean;
  /** Hide from search engines (booking success/cancel, admin helpers). */
  noIndex?: boolean;
  /**
   * Skip canonical + og:url. Needed for `/events/{id}/` (one static HTML for many
   * URLs) so Meta/Instagram keep the pasted path instead of collapsing to `/events/`.
   */
  omitCanonicalUrl?: boolean;
}): Metadata {
  const ogImage = image ?? siteConfig.ogImage;
  return {
    title: absolute ? { absolute: title } : title,
    description,
    ...(omitCanonicalUrl ? {} : { alternates: { canonical: path } }),
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      type: "website",
      locale: "en_US",
      ...(omitCanonicalUrl ? {} : { url: path }),
      siteName: siteConfig.name,
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}
