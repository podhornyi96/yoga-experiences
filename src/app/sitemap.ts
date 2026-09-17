import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { experiences, experiencePagePath } from "@/data/experiences";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url;
  const staticRoutes = [
    "/",
    "/experiences/",
    "/private/",
    "/corporate/",
    "/about/",
    "/contact/",
    "/privacy/",
    "/terms/",
  ].map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "/" ? 1 : 0.8,
  }));

  const experienceRoutes = experiences
    .filter((e) => e.group !== "corporate")
    .map((e) => ({
      url: `${base}${experiencePagePath(e)}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

  return [...staticRoutes, ...experienceRoutes];
}
