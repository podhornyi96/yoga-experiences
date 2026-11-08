"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  DEPOSIT_POLICY_SUCCESS,
  EVENT_POLICY_SUCCESS,
} from "@/lib/booking-policy";

function IntroLine() {
  const kind = useSearchParams().get("kind");
  const text =
    kind === "event"
      ? "Thank you — your place is reserved. Check your email for confirmation details."
      : "Thank you — your date is reserved. Check your email for confirmation details.";
  return (
    <p className="mx-auto mt-4 max-w-2xl text-center text-lg leading-relaxed text-muted">
      {text}
    </p>
  );
}

function PolicyLine() {
  const kind = useSearchParams().get("kind");
  return (
    <p className="text-muted">
      {kind === "event" ? EVENT_POLICY_SUCCESS : DEPOSIT_POLICY_SUCCESS}
    </p>
  );
}

export function BookingSuccessIntro() {
  return (
    <Suspense
      fallback={
        <p className="mx-auto mt-4 max-w-2xl text-center text-lg leading-relaxed text-muted">
          Thank you. Check your email for confirmation details.
        </p>
      }
    >
      <IntroLine />
    </Suspense>
  );
}

export function BookingSuccessPolicy() {
  return (
    <Suspense
      fallback={<p className="text-muted">Your payment is non-refundable.</p>}
    >
      <PolicyLine />
    </Suspense>
  );
}
