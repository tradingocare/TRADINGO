import type { Metadata } from 'next'
import { Suspense }      from 'react'
import { cookies }       from 'next/headers'
import { redirect }      from 'next/navigation'
import LoginClient       from './LoginClient'
import { resolvePostLoginTarget } from '@/lib/auth/redirects'

export const metadata: Metadata = {
  title: 'Sign In — TRADINGO',
  description:
    'Sign in to TRADINGO — India\'s Smart B2B Marketplace. '
    + 'Access your buyer, seller, or admin dashboard.',
  // Locked SEO requirement: auth surfaces must not be indexed.
  robots: { index: false, follow: true },
}

// Logged-in awareness (F-02): same fallback as /register — when middleware
// session verification is unavailable, redirect authenticated visitors to
// the role-aware destination. `next` is honored with the same safe-target
// rule as post-login. The social-login callback (?socialLogin=true) must
// NEVER be intercepted here: it carries httpOnly session cookies that the
// client bridges into the token flow, and a redirect would drop the param.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams;
  const socialLogin = params.socialLogin === 'true';
  if (!socialLogin) {
    const jar = await cookies();
    const role = jar.get('userRole')?.value ?? '';
    const token = jar.get('accessToken')?.value ?? '';
    if (role && token) {
      const nextParam = typeof params.next === 'string' ? params.next
        : typeof params.redirect === 'string' ? params.redirect
        : null;
      redirect(resolvePostLoginTarget(role, nextParam));
    }
  }
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginClient />
    </Suspense>
  )
}

function LoginLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background:'var(--bg-base)' }}>
      <div className="w-10 h-10 rounded-full border-2 border-t-accent-500 border-border animate-spin" />
    </div>
  )
}
