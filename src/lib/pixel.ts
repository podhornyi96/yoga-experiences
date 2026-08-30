export type PixelEvent =
  | "PageView"
  | "Contact"
  | "Lead"
  | "Schedule"
  | "ViewContent";

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  loaded?: boolean;
  version?: string;
  push: Fbq;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

/** Meta Pixel IDs are numeric; reject anything else before injecting into HTML. */
export function isValidPixelId(id: string): boolean {
  return /^\d+$/.test(id);
}

export function isLocalHostname(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname === "::1" ||
    hostname.endsWith(".local")
  );
}

export function trackPixelEvent(
  event: PixelEvent,
  params?: Record<string, unknown>,
) {
  if (typeof window === "undefined" || !window.fbq) return;
  if (isLocalHostname(window.location.hostname)) return;
  window.fbq("track", event, params);
}
