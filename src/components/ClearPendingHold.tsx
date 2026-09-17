"use client";

import { useEffect } from "react";
import { clearPendingHold } from "@/lib/schedule-api";

/** Clears the soft-hold resume cookie after a successful deposit. */
export function ClearPendingHold() {
  useEffect(() => {
    clearPendingHold();
  }, []);
  return null;
}
