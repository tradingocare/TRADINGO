import { setAccessToken, clearTokens } from '@/lib/auth';

// Canonical client-side auth-state writer (R3 — Auth State Convergence).
//
// One place performs the duplicated persistence previously hand-rolled at
// every login/registration/OAuth/role-sync call site:
//   - localStorage accessToken via the EXISTING lib/auth writer (unchanged)
//   - localStorage userRole (read by role-guards)
//   - userRole + accessToken routing cookies (RSC/middleware-readable hints)
//
// No new storage medium, no renamed keys, no new cookie names. The cookies
// remain non-sensitive routing hints only — authorization is server-side JWT.
// maxAge = 24 HOURS (FOUNDER LOCKED for R3; matches every live call site
// except the dead legacy auth-provider.register's 1h, which converges here).

const AUTH_STATE_COOKIE_MAX_AGE = 24 * 60 * 60; // 24 hours — founder-locked
const AUTH_STATE_COOKIE_ATTRS = `path=/; max-age=${AUTH_STATE_COOKIE_MAX_AGE}; SameSite=Lax`;

export interface SessionUser {
  role: string;
}

export interface PersistSessionInput {
  user: SessionUser;
  accessToken: string;
  /** When false, skip the accessToken cookie (e.g. token unavailable). */
  persistAccessTokenCookie?: boolean;
}

/**
 * Persist the authenticated session across the existing storage surfaces.
 * Idempotent: repeated invocation writes the same values.
 */
export function persistSession(input: PersistSessionInput): void {
  if (typeof window === 'undefined') return;
  const { user, accessToken, persistAccessTokenCookie = true } = input;

  // localStorage — canonical token writer (lib/auth) stays the ONLY token setter
  setAccessToken(accessToken);
  localStorage.setItem('userRole', user.role);

  // Cookies — routing hints for RSC/middleware (R2 logged-in awareness)
  document.cookie = `userRole=${encodeURIComponent(user.role)}; ${AUTH_STATE_COOKIE_ATTRS}`;
  if (persistAccessTokenCookie && accessToken) {
    document.cookie = `accessToken=${encodeURIComponent(accessToken)}; ${AUTH_STATE_COOKIE_ATTRS}`;
  }
}

/**
 * Role-only refresh (e.g. /auth/me role synchronization) — updates the role
 * surfaces without touching the token.
 */
export function persistSessionRole(role: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('userRole', role);
  document.cookie = `userRole=${encodeURIComponent(role)}; ${AUTH_STATE_COOKIE_ATTRS}`;
}

/**
 * Clear every auth-state surface written by persistSession()/persistSessionRole():
 * tokens (via the existing clearTokens), userRole + rememberMe localStorage,
 * and the userRole/accessToken cookies (max-age=0). Repeated invocation is a
 * no-op beyond the first clear.
 */
export function clearSession(): void {
  if (typeof window === 'undefined') return;
  clearTokens();
  localStorage.removeItem('userRole');
  localStorage.removeItem('rememberMe');
  document.cookie = 'userRole=; path=/; max-age=0';
  document.cookie = 'accessToken=; path=/; max-age=0';
}
