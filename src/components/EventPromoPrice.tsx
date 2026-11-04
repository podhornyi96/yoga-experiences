/** Shared early-bird price display for event detail + upcoming cards. */

export function formatPromoEndsOn(endsOn: string): string {
  const [y, m, d] = endsOn.split("-").map(Number);
  if (!y || !m || !d) return endsOn;
  const utc = new Date(Date.UTC(y, m - 1, d, 12));
  const day = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    timeZone: "UTC",
  }).format(utc);
  const month = new Intl.DateTimeFormat("en-GB", {
    month: "short",
    timeZone: "UTC",
  }).format(utc);
  return `${day} ${month}`;
}

function money(amount: number): string {
  return Number.isInteger(amount) ? `€${amount}` : `€${amount.toFixed(2)}`;
}

export type EventPromoPriceProps = {
  regularPriceEur: number;
  promoPriceEur: number;
  promoEndsOn: string;
  /** Dark card (upcoming) vs light detail page. */
  tone?: "light" | "dark";
  className?: string;
};

export function EventPromoPrice({
  regularPriceEur,
  promoPriceEur,
  promoEndsOn,
  tone = "light",
  className = "",
}: EventPromoPriceProps) {
  const isDark = tone === "dark";

  // Upcoming banner: one row only — same height as the regular price line.
  if (isDark) {
    return (
      <p className={`min-w-0 truncate ${className}`}>
        <span className="text-cream/55 line-through">
          {money(regularPriceEur)}
        </span>{" "}
        <span className="font-semibold text-sand">{money(promoPriceEur)}</span>
        <span className="text-sm font-normal text-cream/70"> / person</span>
        <span className="text-xs font-semibold uppercase tracking-wide text-sand">
          {" "}
          · Limited offer
        </span>
        <span className="text-xs text-cream/70">
          {" "}
          · until {formatPromoEndsOn(promoEndsOn)}
        </span>
      </p>
    );
  }

  return (
    <div className={className}>
      <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="text-sm text-muted line-through">
          {money(regularPriceEur)}
        </span>
        <span className="text-lg font-semibold text-clay-dark">
          {money(promoPriceEur)}
          <span className="text-sm font-normal text-muted"> / person</span>
        </span>
      </p>
      <p className="mt-1 text-xs text-muted">
        Early bird until {formatPromoEndsOn(promoEndsOn)}
      </p>
      <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-sm bg-clay px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-cream">
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-cream/90" />
        Limited spots
      </p>
    </div>
  );
}
