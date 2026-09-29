/**
 * Instant-book spots for Sunrise Yoga (group).
 * Custom locations stay WhatsApp-only.
 */

export const SUNRISE_INVENTORY_SLUG = "sunrise-yoga-lisbon" as const;

export type SunriseLocationId = "portas-do-sol" | "beato" | "vasco-da-gama";

export type SunriseLocation = {
  id: SunriseLocationId;
  label: string;
  /** Official / Maps place name. */
  placeName: string;
  vibe: string;
  image: string;
  mapsUrl: string;
};

export const SUNRISE_LOCATIONS: SunriseLocation[] = [
  {
    id: "portas-do-sol",
    label: "Portas do Sol",
    placeName: "Largo Portas do Sol",
    vibe: "Alfama viewpoint — rooftops and river light at dawn",
    image: "/images/locations/sunrise-portas-do-sol.jpg",
    mapsUrl: "https://maps.app.goo.gl/NyVbTeYwjc7KskRX8?g_st=ic",
  },
  {
    id: "beato",
    label: "Beato",
    placeName: "Park by the river Tejo (Beato)",
    vibe: "Quiet riverside park — simple, calm, close to the water",
    image: "/images/locations/sunrise-beato.jpg",
    mapsUrl: "https://maps.app.goo.gl/GgxSx1faztYB6xmx9?g_st=ic",
  },
  {
    id: "vasco-da-gama",
    label: "Vasco da Gama",
    placeName: "By the river Tejo (near Vasco da Gama tower)",
    vibe: "Open riverfront near the tower — big sky and water",
    image: "/images/locations/sunrise-vasco-da-gama.jpg",
    mapsUrl: "https://maps.app.goo.gl/oTBnX8WdYdHDsAL17?g_st=ic",
  },
];

export function getSunriseLocation(
  id: string | null | undefined,
): SunriseLocation | null {
  if (!id) return null;
  return SUNRISE_LOCATIONS.find((loc) => loc.id === id) ?? null;
}

export function isSunriseLocationId(id: string): id is SunriseLocationId {
  return SUNRISE_LOCATIONS.some((loc) => loc.id === id);
}
