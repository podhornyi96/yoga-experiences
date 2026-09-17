export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  /** When set, show a “Translated from …” note on the card. */
  translatedFrom?: "uk";
  originalSrc: string;
  originalAlt: string;
}

export const testimonials: Testimonial[] = [
  {
    quote:
      "Ivanna, I realized I come to your classes more for your personality and the atmosphere than for yoga itself. Thank you.",
    name: "Yana",
    role: "via Instagram",
    translatedFrom: "uk",
    originalSrc: "/images/reviews/review-ua-collage.jpg",
    originalAlt: "Instagram message thanking Ivanna for the class atmosphere",
  },
  {
    quote:
      "It was a wonderful practice. I've practised for many years — the last two with breaks — and today the intensity was simply perfect. I'll definitely come again.",
    name: "Oksana",
    role: "via Instagram",
    translatedFrom: "uk",
    originalSrc: "/images/reviews/review-ua-collage.jpg",
    originalAlt: "Instagram message about a perfectly paced yoga practice",
  },
  {
    quote:
      "Hi Ivanna — it's Anya. I was in your Tuesday class at Parque Eduardo VII. I want to thank you again for the practice!! I still feel so warm from it.",
    name: "Anya",
    role: "via Instagram",
    translatedFrom: "uk",
    originalSrc: "/images/reviews/review-ua-collage.jpg",
    originalAlt: "Instagram message from Anya after a park yoga class",
  },
  {
    quote:
      "Yoga started for us in the fog — wet hair, sand all over, goosebumps from the wind. But that feeling can't be put into words; you can only live it. Ivanna's meditative voice, the sound of the waves, singing bowls, and just us on the beach. Total calm and lightness.",
    name: "An. V.",
    role: "via Instagram · Praia do Guincho",
    translatedFrom: "uk",
    originalSrc: "/images/reviews/review-ua-guincho.jpg",
    originalAlt: "Instagram post about beach yoga at Praia do Guincho",
  },
  {
    quote:
      "Last November I fell in love with yoga — right here with Ivanna.",
    name: "Anna",
    role: "via Instagram",
    translatedFrom: "uk",
    originalSrc: "/images/reviews/review-ua-love.jpg",
    originalAlt: "Instagram story about falling in love with yoga with Ivanna",
  },
  {
    quote:
      "Starting practice with shavasana is such a joy — I'd never experienced that before. My body responds beautifully to every movement and stretch. Thank you!",
    name: "Ganna B.",
    role: "via Instagram",
    translatedFrom: "uk",
    originalSrc: "/images/reviews/review-ua-shavasana.jpg",
    originalAlt: "Instagram message about starting practice with shavasana",
  },
  {
    quote: "What a beautiful morning. Thank you — I'm sitting here happy, not moving.",
    name: "Mia",
    role: "via Instagram",
    translatedFrom: "uk",
    originalSrc: "/images/reviews/review-ua-morning.jpg",
    originalAlt: "Instagram message after a morning yoga practice",
  },
  {
    quote:
      "Thank you so much again! It was so nice with the good weather under the trees. We loved it.",
    name: "Guest",
    role: "via Instagram",
    originalSrc: "/images/reviews/review-en-trees.jpg",
    originalAlt: "Instagram message praising an outdoor yoga session under the trees",
  },
  {
    quote:
      "Your class was amazing! I'll let you know if I can come again on Thursday :)",
    name: "Guest",
    role: "via Instagram",
    originalSrc: "/images/reviews/review-en-welcome.jpg",
    originalAlt: "Instagram message calling Ivanna's yoga class amazing",
  },
];
