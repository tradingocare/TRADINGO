export const DISPOSABLE_DOMAINS = ['mailinator.com', 'tempmail.com', 'guerrillamail.com', 'throwamail.com', 'yopmail.com', 'trashmail.com', 'guerrillamailblock.com', 'sharklasers.com', 'grr.la', 'dispostable.com'];

export function isDisposableEmail(email: string): boolean {
  const lower = email.toLowerCase();
  return DISPOSABLE_DOMAINS.some((d) => lower.endsWith('@' + d) || lower.endsWith('.' + d));
}