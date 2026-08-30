import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

/** Shared title / description / canonical / Open Graph / Twitter for one page. */
export function pageSeo({
  title,
  description,
  path,
  image,
  absolute = false,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  /** Skip the root title template (`%s — Ivanna Yoga Lisbon`). */
  absolute?: boolean;
}): Metadata {
  const ogImage = image ?? siteConfig.ogImage;
  return {
    title: absolute ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: path,
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
