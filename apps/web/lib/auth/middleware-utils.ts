import type { NextRequest } from 'next/server';
import { verifyToken, type TokenPayload } from './token';
import { isAdminRole, getRouteRole, isAuthPage, isRouteProtected } from './permissions';
import { redirectToLogin, getDefaultRedirect, isRedirectLoop } from './redirects';

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
