import type { Metadata } from 'next'
import Link from 'next/link'
import VendorRegistrationWizard from '../vendor/VendorRegistrationWizard'

export const metadata: Metadata = {
  title: 'Activate Seller Mode — TRADINGO',
  description: 'Activate your seller workspace, keep your buyer features. Join TRADINGO as a verified seller with zero commission and GST invoicing.',
}

export default function VendorOnboardingPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle,#9B5DE518,transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle,#f59e0b18,transparent 70%)', filter: 'blur(80px)' }} />
      </div>
      <div className="relative z-10 min-h-screen flex flex-col">
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--border-color)' }}>
          <Link href="/">
            <img src="/logo/trdn6.png" alt="TRADINGO" className="h-9 w-9 object-contain" />
          </Link>
          <p className="text-text-secondary text-xs">
            Signed in as a buyer?{' '}
            <Link href="/buyer/dashboard" className="font-semibold hover:underline text-accent-500">
              Back to Buyer Dashboard
            </Link>
          </p>
        </div>
        <div className="flex-1 flex items-start justify-center px-4 py-8">
          <div className="w-full max-w-2xl">
            <h1 className="mb-2 text-center text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Activate Seller Mode
            </h1>
            <p className="mb-6 text-center text-sm text-text-secondary">
              Add your business details to start selling — your buyer account and features stay active.
            </p>
            <VendorRegistrationWizard mode="existing" />
          </div>
        </div>
      </div>
    </div>
  )
}