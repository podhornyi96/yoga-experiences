"use client";

import { useEffect, useState } from "react";
import {
  COOKIE_SETTINGS_EVENT,
  getConsent,
  setConsent,
  subscribeConsent,
  type ConsentState,
} from "./consent";

export function useConsent() {
  const [consent, setConsentState] = useState<ConsentState | null>(null);
  const [ready, setReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    setConsentState(getConsent());
    setReady(true);

    const unsubscribe = subscribeConsent(() => {
      setConsentState(getConsent());
      setSettingsOpen(false);
    });

    const onOpenSettings = () => setSettingsOpen(true);
    window.addEventListener(COOKIE_SETTINGS_EVENT, onOpenSettings);

    return () => {
      unsubscribe();
      window.removeEventListener(COOKIE_SETTINGS_EVENT, onOpenSettings);
    };
  }, []);

  return {
    consent,
    ready,
    bannerVisible: ready && (consent === null || settingsOpen),
    analyticsAllowed: ready && consent?.analytics === true,
    accept: () => setConsent(true),
    decline: () => setConsent(false),
  };
}
