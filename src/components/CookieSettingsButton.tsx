"use client";

import { openCookieSettings } from "@/lib/consent";

export function CookieSettingsButton({
  className = "hover:text-clay",
}: {
  className?: string;
}) {
  return (
    <button type="button" onClick={openCookieSettings} className={className}>
      Cookie settings
    </button>
  );
}
