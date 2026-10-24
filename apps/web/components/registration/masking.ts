/**
 * Display-only masking helpers for sensitive identifiers in review UIs.
 * Masking is presentational: the backend remains authoritative for all
 * verification, and full values still travel only inside the existing
 * authenticated submit payloads they were collected for.
 */
export function maskPanDisplay(panNumber: string): string {
  return panNumber.length === 10 ? `${'●'.repeat(6)}${panNumber.slice(-4)}` : panNumber;
}

export function maskMobileDisplay(mobileNumber: string): string {
  const digits = mobileNumber.replace(/\D/g, '');
  return digits.length >= 4 ? `${'●'.repeat(5)}${digits.slice(-4)}` : mobileNumber;
}
