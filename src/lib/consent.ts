export const CONSENT_STORAGE_KEY = "ivanna-cookie-consent";
export const CONSENT_VERSION = 1;
export const COOKIE_SETTINGS_EVENT = "ivanna-open-cookie-settings";

export type ConsentState = {
  analytics: boolean;
  v: typeof CONSENT_VERSION;
};

type Listener = () => void;

const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener();
}

export function getConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("analytics" in parsed) ||
      !("v" in parsed)
    ) {
      return null;
    }
    const record = parsed as { analytics: unknown; v: unknown };
    if (
      record.v !== CONSENT_VERSION ||
      typeof record.analytics !== "boolean"
    ) {
      return null;
    }
    return { analytics: record.analytics, v: CONSENT_VERSION };
  } catch {
    return null;
  }
}

export function setConsent(analytics: boolean) {
  if (typeof window === "undefined") return;
  const previous = getConsent();
  const next: ConsentState = { analytics, v: CONSENT_VERSION };
  window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(next));
  emit();
  // Drop already-injected trackers when the visitor revokes analytics.
  if (previous?.analytics === true && analytics === false) {
    window.location.reload();
  }
}

export function subscribeConsent(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Re-open the cookie banner after a choice has already been stored. */
export function openCookieSettings() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(COOKIE_SETTINGS_EVENT));
}
