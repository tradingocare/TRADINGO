import type { NextRequest } from 'next/server';
import { verifyToken, type TokenPayload } from './token';
import { isAdminRole, getRouteRole, isAuthPage, isRouteProtected } from './permissions';
import { redirectToLogin, getDefaultRedirect, isRedirectLoop, resolvePostLoginTarget, getSellerEntryTarget } from './redirects';

// Buyer → Seller upgrade wizard ("Existing Account" onboarding). Unlike the
// plain /register signup forms this page is meant for AUTHENTICATED buyers,
// so it must never be treated as a guest-only auth page.
const VENDOR_ONBOARDING_PATH = '/register/vendor-onboarding';

// Accounts that may visit the upgrade wizard. SELLER/ADMIN/SUPER_ADMIN are
// bounced to their dashboard — a seller must not re-activate seller mode.
const ONBOARDING_ALLOWED_ROLES = new Set(['BUYER', 'VIEWER']);

// Canonical seller-entry wizard landing. Authenticated visitors follow the
// role-aware seller journey (getSellerEntryTarget: BUYER → vendor-onboarding
// upgrade wizard, SELLER/ADMIN → their dashboards) instead of the generic
// auth-page dashboard bounce — the same semantics as every seller CTA
// (login seller card, register "Become a Seller", navbar GoLive).
const SELLER_ENTRY_PATH = '/register/vendor';

// OAuth callback marker: the backend social-login flow redirects to
// /login?socialLogin=true carrying httpOnly session cookies that the client
// bridges into the token flow. The page must render for that bridge to run —
// a logged-in redirect here would strand a stale-cookie user on the dashboard
// with the new social session never completing (R1 regression).
const SOCIAL_LOGIN_PARAM = 'socialLogin';

export const COOKIE_ACCESS_TOKEN = 'accessToken';

export async function getTokenPayload(req: NextRequest): Promise<TokenPayload | null> {
  const token = req.cookies.get(COOKIE_ACCESS_TOKEN)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function getRouteDecision(
  pathname: string,
  payload: TokenPayload | null,
  nextParam: string | null = null,
  isSocialLoginCallback = false,
): { redirect: string | null } {
  const isAuth = payload !== null;
  const role = payload?.role ?? '';
  const routeRole = getRouteRole(pathname);

  // OAuth callback completion must always render the login page: the client
  // bridges the httpOnly cookie session into the token flow on render.
  if (isSocialLoginCallback && pathname === '/login') {
    return { redirect: null };
  }

  // Dedicated admin authentication surface: /admin/login IS the admin
  // sign-in form, so unauthenticated visitors must reach it directly
  // instead of being bounced to /login. EXACT-PATH exception only —
  // every other /admin/* route keeps standard protection. Authenticated
  // visitors fall through to the admin role gate below, so buyer/seller
  // (and RM) tokens are still bounced to their own dashboards.
  if (pathname === '/admin/login' && !isAuth) {
    return { redirect: null };
  }

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

  // Canonical seller entry: route logged-in users into the role-aware seller
  // journey. The token-verified role is used (more reliable than the page's
  // userRole cookie read, which stays as the direct-render fallback).
  if (isAuth && pathname === SELLER_ENTRY_PATH) {
    const dest = getSellerEntryTarget(role);
    if (isRedirectLoop(dest, pathname)) return { redirect: null };
    return { redirect: dest };
  }

  // Buyer-class roles must not render the seller shell: route them to their
  // own dashboard (API authorization remains authoritative; this is a
  // UX/routing correction only). SELLER/MANAGER/ADMIN/SUPER_ADMIN and unknown
  // roles fall through unchanged. The buyer→seller upgrade journey lives
  // outside /seller/* (/register/vendor-onboarding), and /seller/onboarding
  // self-bounces non-sellers, so no legitimate buyer flow is affected.
  if (isAuth && getRouteRole(pathname) === 'seller' && (role === 'BUYER' || role === 'VIEWER')) {
    const dest = getDefaultRedirect(role);
    if (isRedirectLoop(dest, pathname)) return { redirect: null };
    return { redirect: dest };
  }

  // Not authenticated on auth pages → allow (these are the login/signup forms)
  if (!isAuth && isAuthPage(pathname)) {
    return { redirect: null };
  }

  // Authenticated on auth pages → role dashboard. /login additionally honors
  // a safe `next` destination (same rule as the client's post-login push) so
  // re-entries via deep links (e.g. GoLive next=/register/vendor-onboarding)
  // land where the journey intended instead of being bounced to a dashboard.
  if (isAuth && isAuthPage(pathname)) {
    const dest = pathname === '/login'
      ? resolvePostLoginTarget(role, nextParam)
      : getDefaultRedirect(role);
    if (isRedirectLoop(dest, pathname)) return { redirect: null };
    return { redirect: dest };
  }

  // Admin routes: only SUPER_ADMIN/ADMIN
  if (routeRole === 'admin' && !isAdminRole(role)) {
    return { redirect: getDefaultRedirect(role) };
  }

  return { redirect: null };
}
