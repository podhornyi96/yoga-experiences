/** Cloudflare Web Analytics tokens are 32 hex chars. */
export function isValidCfWebAnalyticsToken(token: string): boolean {
  return /^[a-f0-9]{32}$/i.test(token);
}
