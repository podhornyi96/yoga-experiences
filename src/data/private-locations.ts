/**
 * Instant-book parks for Private / Tandem sessions.
 * Custom / home locations stay WhatsApp-only (price & travel negotiated).
 */

export type PrivateLocationId =
  | "estrela"
  | "graca"
  | "nacoes"
  | "eduardo-vii";

export type PrivateLocation = {
  id: PrivateLocationId;
  label: string;
  /** Official / Maps place name. */
  placeName: string;
  vibe: string;
  image: string;
  mapsUrl: string;
};

export const PRIVATE_LOCATIONS: PrivateLocation[] = [
  {
    id: "estrela",
    label: "Park Estrela",
    placeName: "Jardim da Estrela",
    vibe: "Leafy romantic garden opposite the basilica",
    image: "/images/locations/park-estrela.jpg",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Jardim+da+Estrela%2C+Lisbon",
  },
  {
    id: "graca",
    label: "Park Graça",
    placeName: "Jardim da Cerca da Graça",
    vibe: "Hillside lawns with city views",
    image: "/images/locations/park-graca.jpg",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Jardim+da+Cerca+da+Gra%C3%A7a%2C+Lisbon",
  },
  {
    id: "nacoes",
    label: "Park Nações",
    placeName: "Parque das Nações",
    vibe: "Modern waterfront park by the river",
    image: "/images/locations/park-nacoes.jpg",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Parque+das+Na%C3%A7%C3%B5es%2C+Lisbon",
  },
  {
    id: "eduardo-vii",
    label: "Park Eduardo VII",
    placeName: "Parque Eduardo VII",
    vibe: "Open lawns looking down toward the city",
    image: "/images/locations/park-eduardo-vii.jpg",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Parque+Eduardo+VII%2C+Lisbon",
  },
];

export function getPrivateLocation(
  id: string | null | undefined,
): PrivateLocation | null {
  if (!id) return null;
  return PRIVATE_LOCATIONS.find((loc) => loc.id === id) ?? null;
}

export function isPrivateLocationId(id: string): id is PrivateLocationId {
  return PRIVATE_LOCATIONS.some((loc) => loc.id === id);
}

/** Slot inventory slug used for both Private (1) and Tandem (2). */
export const PRIVATE_INVENTORY_SLUG = "private-yoga-session" as const;

export const PRIVATE_SESSION_EUR = 45;
export const TANDEM_SESSION_EUR = 80;
