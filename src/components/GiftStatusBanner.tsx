import Link from "next/link";
import { formatGiftExpiry } from "@/lib/gifts";
import type { ExperienceGiftState } from "@/lib/use-experience-gift";

export function GiftStatusBanner({ state }: { state: ExperienceGiftState }) {
  if (state.phase === "idle") return null;

  if (state.phase === "problem") {
    return (
      <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {state.message}
      </p>
    );
  }

  if (state.phase === "redirect") {
    return (
      <p className="mb-4 rounded-xl border border-sand-dark bg-sand/50 px-4 py-3 text-sm text-ink">
        This certificate is for {state.title}.{" "}
        <Link
          href={state.href}
          className="font-medium text-forest underline-offset-2 hover:underline"
        >
          Open it
        </Link>
      </p>
    );
  }

  const { gift } = state;
  const who = gift.people === 1 ? "1 person" : "2 people";
  return (
    <div className="mb-4 rounded-xl border border-clay/30 bg-sand/50 px-4 py-3 text-sm text-ink">
      <p className="font-medium text-forest">
        Gift · {gift.title} · {who}
      </p>
      <p className="mt-1 text-muted">
        Paid · valid until {formatGiftExpiry(gift.expiresAt)}. Choose a date —
        there&apos;s nothing more to pay. Mats are not included.
      </p>
    </div>
  );
}
