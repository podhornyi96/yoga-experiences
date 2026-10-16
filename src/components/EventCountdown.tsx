"use client";

import { useEffect, useState } from "react";
import { countdownLabel } from "@/lib/event-countdown";

/**
 * Live “in 3d 14h” next to a date — only within 14 days of start.
 * Renders nothing outside that window (or before mount).
 */
export function EventCountdown({
  startsAt,
  className,
}: {
  startsAt: string;
  className?: string;
}) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setLabel(countdownLabel(startsAt));
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [startsAt]);

  if (!label) return null;

  return (
    <span className={className} aria-live="polite">
      <span className="mx-1.5 opacity-45" aria-hidden>
        ·
      </span>
      {label}
    </span>
  );
}
