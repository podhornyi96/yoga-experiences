"use client";

import { useEffect, useState } from "react";
import {
  formatGiftExpiry,
  giftMatchesPage,
  lookupGift,
  type PublicGift,
} from "@/lib/gifts";

export type ExperienceGiftState =
  | { phase: "idle" }
  | { phase: "problem"; message: string }
  | { phase: "redirect"; title: string; href: string }
  | { phase: "match"; gift: PublicGift };

export function useExperienceGift(pageSlug: string): ExperienceGiftState {
  const [state, setState] = useState<ExperienceGiftState>({ phase: "idle" });

  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("gift")?.trim() ?? "";
    if (!raw) return;

    let cancelled = false;
    void lookupGift(raw).then((result) => {
      if (cancelled) return;
      if (!result) {
        setState({
          phase: "problem",
          message: "Couldn't check this gift code. Refresh the page and try again.",
        });
        return;
      }
      if (result.status === "not_found") {
        setState({ phase: "problem", message: "This gift code was not found." });
        return;
      }
      if (result.status === "redeemed") {
        setState({ phase: "problem", message: "This gift has already been used." });
        return;
      }
      if (result.status === "expired") {
        setState({
          phase: "problem",
          message: `This gift expired on ${formatGiftExpiry(result.expiresAt)}.`,
        });
        return;
      }
      if (!giftMatchesPage(pageSlug, result)) {
        const params = new URLSearchParams({ gift: result.code });
        setState({
          phase: "redirect",
          title: result.title,
          href: `${result.pagePath}?${params}`,
        });
        return;
      }
      setState({ phase: "match", gift: result });
    });

    return () => {
      cancelled = true;
    };
  }, [pageSlug]);

  return state;
}
