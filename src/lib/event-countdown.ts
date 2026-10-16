/** Show a live countdown only inside this window before start. */
export const COUNTDOWN_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

const TIMEZONE = "Europe/Lisbon";

/**
 * Convert Lisbon wall time `YYYY-MM-DDTHH:mm` to a UTC epoch ms.
 * Matches the project's Europe/Lisbon schedule convention.
 */
export function lisbonWallTimeToUtcMs(startsAt: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(startsAt);
  if (!m) return null;

  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const hour = Number(m[4]);
  const minute = Number(m[5]);
  const desiredAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0);

  let utcMs = desiredAsUtc;
  for (let i = 0; i < 3; i++) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(utcMs));
    const get = (type: string) =>
      Number(parts.find((p) => p.type === type)?.value ?? "0");
    const shownAsUtc = Date.UTC(
      get("year"),
      get("month") - 1,
      get("day"),
      get("hour"),
      get("minute"),
      get("second"),
    );
    utcMs += desiredAsUtc - shownAsUtc;
  }

  return utcMs;
}

/** Compact remaining time, e.g. `3d 14h`, `5h 20m`, `12m`. */
export function formatCountdownRemaining(ms: number): string | null {
  if (ms <= 0) return null;

  const totalMinutes = Math.max(1, Math.floor(ms / 60_000));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

/** `in 3d 14h`, or null when outside the 14-day window / already started. */
export function countdownLabel(
  startsAt: string,
  now = new Date(),
): string | null {
  const targetMs = lisbonWallTimeToUtcMs(startsAt);
  if (targetMs == null) return null;

  const remainingMs = targetMs - now.getTime();
  if (remainingMs <= 0 || remainingMs > COUNTDOWN_WINDOW_MS) return null;

  const compact = formatCountdownRemaining(remainingMs);
  return compact ? `in ${compact}` : null;
}
