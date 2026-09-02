/** Microsoft Clarity project IDs are alphanumeric; reject anything else. */
export function isValidClarityId(id: string): boolean {
  return /^[a-z0-9]+$/i.test(id);
}
