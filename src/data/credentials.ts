export interface Credential {
  title: string;
  school: string;
  hours: string;
  year: string;
  src: string;
  alt: string;
}

export const credentials: Credential[] = [
  {
    title: "Yoga Instructor",
    school: "ADHOyoga",
    hours: "200 hours",
    year: "2020",
    src: "/images/credentials/adhoyoga-ryt-200-2020.jpg",
    alt: "ADHOyoga Yoga Instructor certificate, 200 hours, 2020 — Ivanna Pylypchuk",
  },
  {
    title: "Yoga Teacher Training",
    school: "Manu School of Yoga",
    hours: "200 hours",
    year: "2024",
    src: "/images/credentials/manu-school-ytt-200-2024.jpg",
    alt: "Manu School of Yoga 200-hour teacher training certificate, Lisbon, 2024 — Ivanna Pylypchuk",
  },
  {
    title: "Intro to Elemental Yin",
    school: "the yoga people",
    hours: "20 hours",
    year: "2023",
    src: "/images/credentials/yoga-people-elemental-yin-2023.jpg",
    alt: "the yoga people Intro to Elemental Yin certificate, 20 hours, 2023 — Ivanna Pylypchuk",
  },
];

export function credentialCaption(credential: Credential): string {
  return `${credential.school} · ${credential.hours} · ${credential.year}`;
}
