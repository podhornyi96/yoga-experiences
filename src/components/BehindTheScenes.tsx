"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { siteConfig } from "@/config/site";
import {
  behindTheScenes,
  type BehindTheScenesReel,
} from "@/data/behind-the-scenes";

const handle = siteConfig.contact.instagramHandle.replace(/^@/, "");

export function BehindTheScenes() {
  const [unmutedId, setUnmutedId] = useState<string | null>(null);

  if (!behindTheScenes.length) return null;

  return (
    <div>
      <div className="mt-12 flex justify-start gap-4 overflow-x-auto pb-2 snap-x snap-mandatory lg:justify-center lg:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {behindTheScenes.map((reel) => (
          <ReelCard
            key={reel.video}
            reel={reel}
            muted={unmutedId !== reel.video}
            onToggleMute={() =>
              setUnmutedId((current) =>
                current === reel.video ? null : reel.video,
              )
            }
          />
        ))}
      </div>
      <p className="mt-6 text-center text-sm text-muted">
        More on{" "}
        <a
          href={siteConfig.contact.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-clay-dark hover:underline"
        >
          {siteConfig.contact.instagramHandle}
        </a>
      </p>
    </div>
  );
}

function ReelCard({
  reel,
  muted,
  onToggleMute,
}: {
  reel: BehindTheScenesReel;
  muted: boolean;
  onToggleMute: () => void;
}) {
  return (
    <article className="w-[min(86vw,20.5rem)] shrink-0 overflow-hidden rounded-xl border border-sand-dark bg-white shadow-sm snap-center">
      <header className="flex items-center gap-3 px-3 py-2.5">
        <a
          href={reel.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0"
        >
          <Image
            src="/images/me/ivanna-avatar.jpg"
            alt={siteConfig.teacher.name}
            width={32}
            height={32}
            className="h-8 w-8 rounded-full object-cover"
          />
        </a>
        <a
          href={reel.url}
          target="_blank"
          rel="noopener noreferrer"
          className="min-w-0 flex-1 leading-tight"
        >
          <p className="truncate text-[14px] font-semibold text-forest">
            {handle}
          </p>
          <p className="mt-0.5 flex items-center gap-1 truncate text-[12px] text-muted">
            <AudioNoteIcon />
            {reel.audio}
          </p>
        </a>
      </header>
      <HostedReel reel={reel} muted={muted} onToggleMute={onToggleMute} />
    </article>
  );
}

function HostedReel({
  reel,
  muted,
  onToggleMute,
}: {
  reel: BehindTheScenesReel;
  muted: boolean;
  onToggleMute: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (el) el.muted = muted;
  }, [muted]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void el.play().catch(() => undefined);
        else el.pause();
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reel.video]);

  return (
    <div className="relative aspect-[9/16] bg-forest">
      <video
        ref={videoRef}
        src={reel.video}
        poster={reel.poster}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={reel.title}
        className="h-full w-full cursor-pointer object-cover"
        onClick={onToggleMute}
      />
      <button
        type="button"
        onClick={onToggleMute}
        className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white"
        aria-label={muted ? "Unmute video" : "Mute video"}
      >
        {muted ? <SpeakerOffIcon /> : <SpeakerOnIcon />}
      </button>
    </div>
  );
}

function AudioNoteIcon() {
  return (
    <svg
      viewBox="0 0 12 12"
      className="h-3 w-3 shrink-0"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M10 1.2v6.55a2.15 2.15 0 1 1-.9-1.74V3.15L5.4 4.25v4.5A2.15 2.15 0 1 1 4.5 7V2.55L10 1.2Z" />
    </svg>
  );
}

function SpeakerOnIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18 6a8 8 0 0 1 0 12" />
    </svg>
  );
}

function SpeakerOffIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="m22 9-6 6" />
      <path d="m16 9 6 6" />
    </svg>
  );
}
