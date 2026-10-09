import { URL } from 'url';

export function redirectToLogin(requestUrl: string, preservePath = true): string {
  if (!preservePath) return '/login';
  const url = new URL(requestUrl, 'http://localhost');
  const next = url.pathname + url.search;
  return `/login?next=${encodeURIComponent(next)}`;
}

export function getRoleFromCookie(): string {
  if (typeof document === 'undefined') return '';
  return document.cookie.match(/(?:^|;\s*)userRole=([^;]*)/)?.[1] ?? '';
}

export function getDashboardForRole(role: string): string {
  switch (role) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
      return '/admin/dashboard';
    case 'MANAGER':
    case 'SELLER':
      return '/seller/dashboard';
    case 'BUYER':
    case 'VIEWER':
      return '/buyer/dashboard';
    default:
      return '/buyer/dashboard';
  }
}

export function getDefaultRedirect(role: string): string {
  return getDashboardForRole(role);
}

export function getSellerEntryTarget(role: string = getRoleFromCookie()): string {
  switch (role) {
    case 'SELLER':
    case 'ADMIN':
    case 'SUPER_ADMIN':
    case 'MANAGER':
      return getDashboardForRole(role);
    case 'BUYER':
      return '/register/vendor-onboarding';
    case 'VIEWER':
      return '/buyer/dashboard';
    default:
      return '/register/vendor';
  }
}

// GoLive canonical entry (R3B stand): the /golive page itself role-routes
// (guest → vendor entry, buyer → onboarding, seller → dashboard), so every
// role — including guests — targets it directly. Replaces the former
// login-first guest branch; authenticated semantics unchanged.
export function getGoLiveEntryTarget(role: string = getRoleFromCookie()): string {
  if (!role) return '/golive';
  return getSellerEntryTarget(role);
}

export function isRedirectLoop(destination: string, currentPath: string): boolean {
  const dest = destination.split('?')[0];
  const curr = currentPath.split('?')[0];
  return dest === curr;
}

// Post-login destination: honor a same-app `next` param the logged-in role may
// actually visit, else fall back to the role dashboard. Shared by the login
// client (after login) and the middleware (logged-in /login redirect) so both
// surfaces resolve `next` identically. An auth-page `next` is never honored
// (prevents login/register ping-pong).
export function resolvePostLoginTarget(userRole: string, requested: string | null | undefined): string {
  const dashboard = getDashboardForRole(userRole);
  if (!requested || !requested.startsWith('/') || requested.startsWith('//')) return dashboard;
  // MANAGER maps to the seller workspace (getDashboardForRole), so the
  // seller-area allowlist must include it (F-16) — same-area rule preserved,
  // no new role, no weakening of the open-redirect guards.
  if ((userRole === 'SELLER' || userRole === 'MANAGER') && requested.startsWith('/seller/')) return requested;
  if (userRole === 'BUYER' && (requested.startsWith('/buyer/') || requested.startsWith('/register/'))) return requested;
  // R3B: GoLive canonical entry is return-safe for buyer-class roles (the
  // page role-routes server-side; query carries validated plan hints).
  // Exact-path match (+ query) only — '/goliveX' style prefixes must not pass.
  const isGolive = requested === '/golive' || requested.startsWith('/golive?') || requested.startsWith('/golive/');
  if ((userRole === 'BUYER' || userRole === 'VIEWER') && isGolive) return requested;
  // TRAD UP free flow (+ paid plan CTAs): the purchase page short-circuits
  // total===0 orders straight to activate-free with NO gateway touch, so a
  // post-login return here never enters a payment doorway. Exact-path match
  // (+ query) only — buyer-class roles; sellers/admins keep their areas.
  const isPurchase = requested === '/subscription/purchase' || requested.startsWith('/subscription/purchase?');
  if ((userRole === 'BUYER' || userRole === 'VIEWER') && isPurchase) return requested;
  // R6: Product Card gated-CTA return targets. /checkout is the Buy Now
  // destination (query carries only productId + qty; amounts are computed
  // server-side) and /products/<slug> is the product detail page the Chat
  // CTA returns to. Both are public buyer surfaces — the return itself
  // never enters a payment doorway. Exact-path (+ query) for /checkout,
  // path-prefix for the dynamic product routes — buyer-class roles only.
  const isCheckout = requested === '/checkout' || requested.startsWith('/checkout?');
  if ((userRole === 'BUYER' || userRole === 'VIEWER') && isCheckout) return requested;
  if ((userRole === 'BUYER' || userRole === 'VIEWER') && requested.startsWith('/products/')) return requested;
  if ((userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') && requested.startsWith('/admin/')) return requested;
  return dashboard;
}
