import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getTokenPayload, getRouteDecision } from '@/lib/auth/middleware-utils';

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const payload = await getTokenPayload(req);
  const { redirect } = getRouteDecision(pathname, payload);

  if (redirect) {
    const url = req.nextUrl.clone();
    url.pathname = redirect;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/seller/:path*',
    '/buyer/:path*',
    '/admin/:path*',
    '/login',
    '/register/:path*',
    '/forgot-password',
    '/reset-password',
  ],
};
