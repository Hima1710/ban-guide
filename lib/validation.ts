/**
 * Returns true only if the value looks like a valid place/UUID id.
 * Rejects undefined, null, empty string, and the literal "undefined".
 */
export function isValidPlaceId(id: string | undefined | null): boolean {
  if (id == null || typeof id !== 'string') return false
  if (id.trim() === '' || id === 'undefined') return false
  return true
}
