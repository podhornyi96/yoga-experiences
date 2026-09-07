"use client";

import { useEffect, useState } from "react";
import { siteConfig, whatsappLink } from "@/config/site";
import { useConsent } from "@/lib/use-consent";
import { WhatsAppIcon } from "./BookingCTA";

export function WhatsAppFloat() {
  const { bannerVisible } = useConsent();
  const [pastHero, setPastHero] = useState(false);
  const href = whatsappLink(
    `Hi ${siteConfig.teacher.name}! I'd like to book a yoga experience in Lisbon.`,
  );

  useEffect(() => {
    const hero = document.getElementById("home-hero");
    if (!hero) {
      setPastHero(true);
      return;
    }

    const target = document.getElementById("home-feel-title") ?? hero;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const titleVisible = entry.isIntersecting;
        const scrolledPast = entry.boundingClientRect.top < 0;
        setPastHero(titleVisible || scrolledPast);
      },
      { threshold: 0 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  if (bannerVisible) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Book on WhatsApp"
      aria-hidden={!pastHero}
      tabIndex={pastHero ? 0 : -1}
      className={`fixed right-5 bottom-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-[opacity,transform] duration-300 hover:scale-105 ${
        pastHero
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  );
}
