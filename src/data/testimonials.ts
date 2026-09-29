export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  source: "google" | "instagram";
  /** Star rating 1–5. Shown on Google cards. */
  rating?: number;
  /** Direct Google Maps link to this review. */
  url?: string;
  /** When set, show a “Translated from …” note on the card. */
  translatedFrom?: "uk";
  /** Instagram screenshot — only for Instagram testimonials. */
  originalSrc?: string;
  originalAlt?: string;
}

/** Short Maps link — “read more Google reviews”. */
export const googleReviewsUrl = "https://maps.app.goo.gl/9kZwmvQkx3mPZ6rh8";

export const testimonials: Testimonial[] = [
  {
    quote:
      "Finding Ivanna was one of the best things about living in Lisbon. Her classes in the park feel like a small community, calm, warm and never rushed. She pays attention to each person and gives great adjustments. I come for the yoga and leave with a better mood every single time. Thank you, Ivanna!",
    name: "Valentyna Havryliuk",
    role: "Google review",
    source: "google",
    rating: 5,
    url: "https://maps.app.goo.gl/LGx1a8vHAek4yUjW7",
  },
  {
    quote:
      "Ivanna is the reason I fell in love with yoga again. After years of searching for my teacher, I finally found her. Thanks to her, my back pain is gone, and I've learned how to listen to my body during our practices, so I feel more confident and strong.",
    name: "Nataliia Marchenko",
    role: "Google review",
    source: "google",
    rating: 5,
    url: "https://maps.app.goo.gl/NE16YZ6f3d3qTjb16",
  },
  {
    quote:
      "Yoga started for us in the fog — wet hair, sand all over, goosebumps from the wind. But that feeling can't be put into words; you can only live it. Ivanna's meditative voice, the sound of the waves, singing bowls, and just us on the beach. Total calm and lightness.",
    name: "An. V.",
    role: "via Instagram · Praia do Guincho",
    source: "instagram",
    translatedFrom: "uk",
    originalSrc: "/images/reviews/review-ua-guincho.jpg",
    originalAlt: "Instagram post about beach yoga at Praia do Guincho",
  },
  {
    quote:
      "I've been practicing with Ivanna for 3 years now, and it has honestly become such a special part of my routine. She creates such a warm, calm atmosphere, and every class feels like a little reset. My favorite sessions are the evening ones by the ocean and in Estrela Park — they always feel extra special. And coffee together afterwards is honestly the perfect ending. So grateful for these 3 years and all the beautiful moments along the way.",
    name: "Bohdana Moskvita",
    role: "Google review",
    source: "google",
    rating: 5,
    url: "https://maps.app.goo.gl/zH2qDy9jbmMAEaGf7",
  },
  {
    quote:
      "Absolutely amazing yoga classes (especially by the ocean)! Ivanna is a wonderful instructor, attentive, and very professional. The atmosphere is always very peaceful and welcoming, and the whole experience leaves me feeling relaxed, refreshed, and full of positive energy. Every movement is explained clearly, and I feel supported throughout the entire session. Highly recommend these classes to anyone looking for a truly wonderful yoga experience in Lisbon!",
    name: "Anna Zhukovska",
    role: "Google review",
    source: "google",
    rating: 5,
    url: "https://maps.app.goo.gl/A7dHAuwrkxnsg63b7",
  },
  {
    quote:
      "Starting practice with shavasana is such a joy — I'd never experienced that before. My body responds beautifully to every movement and stretch. Thank you!",
    name: "Ganna B.",
    role: "via Instagram",
    source: "instagram",
    translatedFrom: "uk",
    originalSrc: "/images/reviews/review-ua-shavasana.jpg",
    originalAlt: "Instagram message about starting practice with shavasana",
  },
  {
    quote:
      "Yoga with Ivanna is the best! You can tell she's a teacher with years of experience — not a 'yoga in 3 weeks' instructor. What matters most to me: grounding, focus on body and breath, the calming sound of singing bowls, and touches of aromatherapy. I also love how she combines practice with sessions in nature. I recommend Ivanna with all my heart — she's sincere, genuine, and a wonderful yoga teacher.",
    name: "Katya Ksondzyk",
    role: "Google review",
    source: "google",
    rating: 5,
    url: "https://maps.app.goo.gl/PNyeyWg2gGuBtWDV6",
    translatedFrom: "uk",
  },
  {
    quote:
      "Ivanna is a kind, encouraging and highly professional teacher who adapts each practice to the level of her students. She is creative, brings an exceptional attention to detail and builds every lesson around a certain idea/goal which helps to focus on the practice better and advance quicker. I attended her group classes and also asked her to create a lesson for my birthday for me and a group of friends, and it was an amazing experience! Highly recommended.",
    name: "Nataliia Pn",
    role: "Google review",
    source: "google",
    rating: 5,
    url: "https://maps.app.goo.gl/8sBbLALG1CMiofN46",
  },
];
