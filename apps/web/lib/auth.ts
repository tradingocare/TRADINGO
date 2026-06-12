export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export function setAccessToken(token: string): void {
  localStorage.setItem('accessToken', token);
}

export function clearTokens(): void {
  localStorage.removeItem('accessToken');
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}
