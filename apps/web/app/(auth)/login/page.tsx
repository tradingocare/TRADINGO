import type { Metadata } from 'next'
import { Suspense }      from 'react'
import LoginClient       from './LoginClient'

export const metadata: Metadata = {
  title: 'Sign In � TRADINGO',
  description:
    'Sign in to TRADINGO � India\'s Smart B2B Marketplace. '
    + 'Access your buyer, seller, or admin dashboard.',
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginClient />
    </Suspense>
  )
}

function LoginLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background:'#1D0001' }}>
      <div className="w-10 h-10 rounded-full border-2
                      border-t-[#FF4D00] border-white/10 animate-spin" />
    </div>
  )
}
