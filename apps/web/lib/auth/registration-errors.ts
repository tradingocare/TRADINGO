export const EXISTING_EMAIL_SIGNIN_URL = '/login?next=/seller/onboarding';

export function isEmailAlreadyRegisteredError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const response = (err as { response?: { status?: number; data?: { message?: unknown } } }).response;
  if (!response) return false;
  return response.status === 409 && response.data?.message === 'Email already registered';
}