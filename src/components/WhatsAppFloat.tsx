"use client";

import { siteConfig, whatsappLink } from "@/config/site";
import { useConsent } from "@/lib/use-consent";
import { WhatsAppIcon } from "./BookingCTA";

export function WhatsAppFloat() {
  const { bannerVisible } = useConsent();
  const href = whatsappLink(
    `Hi ${siteConfig.teacher.name}! I'd like to book a yoga experience in Lisbon.`,
  );

  if (bannerVisible) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Book on WhatsApp"
      className="fixed bottom-5 right-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105"
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  );
}
