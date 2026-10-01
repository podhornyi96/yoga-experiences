"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Container } from "@/components/Container";
import { EventDetailClient } from "@/components/EventDetailClient";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function readPathSlotId(): string | null {
  if (typeof window === "undefined") return null;
  const parts = window.location.pathname.split("/").filter(Boolean);
  if (parts[0] === "events" && parts[1] && UUID_RE.test(parts[1])) {
    return parts[1];
  }
  return null;
}

function EventPageInner() {
  const searchParams = useSearchParams();
  const queryId = searchParams.get("id")?.trim() ?? "";
  const [pathId, setPathId] = useState<string | null>(null);

  useEffect(() => {
    setPathId(readPathSlotId());
  }, []);

  const id = queryId || pathId || "";

  if (!id) {
    return (
      <Container className="py-16 text-center">
        <h1 className="text-3xl text-forest">Choose a session</h1>
        <p className="mt-2 text-muted">
          Open a scheduled session from the home page or experiences list.
        </p>
      </Container>
    );
  }

  return <EventDetailClient slotId={id} />;
}

export function EventPageClient() {
  return (
    <Suspense
      fallback={
        <Container className="py-16">
          <p className="text-muted">Loading session…</p>
        </Container>
      }
    >
      <EventPageInner />
    </Suspense>
  );
}
