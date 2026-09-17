import type { NextRequest } from 'next/server';
import { verifyToken, type TokenPayload } from './token';
import { isAdminRole, getRouteRole, isAuthPage, isRouteProtected } from './permissions';
import { redirectToLogin, getDefaultRedirect, isRedirectLoop } from './redirects';

// Buyer → Seller upgrade wizard ("Existing Account" onboarding). Unlike the
// plain /register signup forms this page is meant for AUTHENTICATED buyers,
// so it must never be treated as a guest-only auth page.
const VENDOR_ONBOARDING_PATH = '/register/vendor-onboarding';

// Accounts that may visit the upgrade wizard. SELLER/ADMIN/SUPER_ADMIN are
// bounced to their dashboard — a seller must not re-activate seller mode.
const ONBOARDING_ALLOWED_ROLES = new Set(['BUYER', 'VIEWER']);

export const COOKIE_ACCESS_TOKEN = 'accessToken';

export async function getTokenPayload(req: NextRequest): Promise<TokenPayload | null> {
  const token = req.cookies.get(COOKIE_ACCESS_TOKEN)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function getRouteDecision(
  pathname: string,
  payload: TokenPayload | null,
): { redirect: string | null } {
  const isAuth = payload !== null;
  const role = payload?.role ?? '';
  const routeRole = getRouteRole(pathname);

  // Not authenticated, route is protected → redirect to login
  if (!isAuth && isRouteProtected(pathname)) {
    return { redirect: redirectToLogin(pathname, true) };
  }

  // Buyer → Seller upgrade wizard:
  // - Guest: send to login first (the wizard requires an existing account).
  // - Authenticated buyer: ALLOW (the wizard is the intended destination for
  //   logged-in buyers clicking GoLive; it renders mode="existing").
  if (pathname === VENDOR_ONBOARDING_PATH) {
    if (!isAuth) {
      return { redirect: redirectToLogin(pathname, true) };
    }
    if (ONBOARDING_ALLOWED_ROLES.has(role)) {
      return { redirect: null };
    }
  }

  // Not authenticated on auth pages → allow (these are the login/signup forms)
  if (!isAuth && isAuthPage(pathname)) {
    return { redirect: null };
  }

  // Authenticated on auth pages → redirect to dashboard
  if (isAuth && isAuthPage(pathname)) {
    const dest = getDefaultRedirect(role);
    if (isRedirectLoop(dest, pathname)) return { redirect: null };
    return { redirect: dest };
  }

  // Admin routes: only SUPER_ADMIN/ADMIN
  if (routeRole === 'admin' && !isAdminRole(role)) {
    return { redirect: getDefaultRedirect(role) };
  }

  return { redirect: null };
}
