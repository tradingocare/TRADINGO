import type { Metadata } from 'next'
import Link from 'next/link'
import BuyerRegistrationWizard from './BuyerRegistrationWizard'

export const metadata: Metadata = {
  title: 'Register as Buyer — TRADINGO',
  description: 'Join TRADINGO as a verified buyer. Access 10L+ products from 50K+ sellers. RFQ matching. Best wholesale prices. Zero commission buying.',
}

export default function BuyerRegisterPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle,#f59e0b18,transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle,#9B5DE518,transparent 70%)', filter: 'blur(80px)' }} />
      </div>
      <div className="relative z-10 min-h-screen flex flex-col">
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--border-color)' }}>
          <Link href="/">
            <img src="/logo/trdn.png" alt="TRADINGO" className="h-9 w-9 object-contain" />
          </Link>
          <p className="text-text-secondary text-xs">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold hover:underline text-accent-500">
              Sign In
            </Link>
          </p>
        </div>
        <div className="flex-1 flex items-start justify-center px-4 py-8">
          <div className="w-full max-w-2xl">
            <BuyerRegistrationWizard />
          </div>
        </div>
      </div>
    </div>
  )
}
