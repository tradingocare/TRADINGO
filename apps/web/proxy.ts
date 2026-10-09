import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getTokenPayload, getRouteDecision } from '@/lib/auth/middleware-utils';

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const payload = await getTokenPayload(req);
  const { redirect } = getRouteDecision(
    pathname,
    payload,
    req.nextUrl.searchParams.get('next'),
    req.nextUrl.searchParams.get('socialLogin') === 'true',
  );

  if (redirect) {
    const [path, search] = redirect.split('?');
    const url = req.nextUrl.clone();
    url.pathname = path;
    url.search = search ? `?${search}` : '';
    return NextResponse.redirect(url);
  }

  // Mark the dedicated admin authentication surface (exact path only)
  // so the admin layout renders it bare — a sign-in page must not sit
  // inside the dashboard topbar/sidebar chrome. Server components read
  // this via headers() (see app/admin/layout.tsx).
  if (pathname === '/admin/login') {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-tradingo-admin-login', '1');
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/seller/:path*',
    '/buyer/:path*',
    '/admin/:path*',
    '/vendor/:path*',
    '/login',
    '/register/:path*',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/verify-mobile',
    '/onboarding',
  ],
};
