/**
 * Homepage “behind the scenes” reels — self-hosted mp4s, Flytographer-style cards.
 * `url` is the original Instagram Reel; the card header links there.
 */
export interface BehindTheScenesReel {
  url: string;
  video: string;
  poster: string;
  title: string;
  audio: string;
}

export const behindTheScenes: BehindTheScenesReel[] = [
  {
    url: "https://www.instagram.com/reel/DPKLo6CAjRF/",
    video: "/videos/sunrise-yoga-lisbon.mp4",
    poster: "/videos/sunrise-yoga-lisbon.jpg",
    title: "Sunrise yoga in Lisbon",
    audio: "Original audio",
  },
  {
    url: "https://www.instagram.com/reel/DMuZqFsirP7/",
    video: "/videos/sunset-yoga-ocean.mp4",
    poster: "/videos/sunset-yoga-ocean.jpg",
    title: "Sunset yoga by the ocean",
    audio: "Original audio",
  },
  {
    url: "https://www.instagram.com/reel/DX6aVGZCnEU/",
    video: "/videos/hatha-yoga-parque-tejo.mp4",
    poster: "/videos/hatha-yoga-parque-tejo.jpg",
    title: "Hatha yoga by the river",
    audio: "Original audio",
  },
];
