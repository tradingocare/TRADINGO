const TOKEN_COOKIE = 'accessToken';
const COOKIE_MAX_AGE = 15 * 60; // 15 minutes in seconds

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

function setTokenCookie(token: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${TOKEN_COOKIE}=${token}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

function removeTokenCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export function setAccessToken(token: string): void {
  localStorage.setItem('accessToken', token);
  setTokenCookie(token);
}

export function clearTokens(): void {
  localStorage.removeItem('accessToken');
  removeTokenCookie();
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

export function getTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${TOKEN_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}
