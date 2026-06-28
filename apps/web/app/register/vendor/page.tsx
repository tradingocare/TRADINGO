import type { Metadata } from 'next'
import Link from 'next/link'
import VendorRegistrationWizard from './VendorRegistrationWizard'

export const metadata: Metadata = {
  title: 'Register as Seller — TRADINGO',
  description: 'Join TRADINGO as a verified seller. Zero commission. AI-powered buyer matching. GST invoicing. Start selling to 5L+ verified buyers across India.',
}

export default function VendorRegisterPage() {
  return (
    <div className="min-h-screen" style={{ background: '#1D0001' }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle,#9B5DE518,transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle,#FF4D0018,transparent 70%)', filter: 'blur(80px)' }} />
      </div>
      <div className="relative z-10 min-h-screen flex flex-col">
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Link href="/">
            <img src="/logo/trdn.png" alt="TRADINGO" className="h-9 w-9 object-contain" />
          </Link>
          <p className="text-white/40 text-xs">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold hover:underline" style={{ color: '#FF4D00' }}>
              Sign In
            </Link>
          </p>
        </div>
        <div className="flex-1 flex items-start justify-center px-4 py-8">
          <div className="w-full max-w-2xl">
            <VendorRegistrationWizard />
          </div>
        </div>
      </div>
    </div>
  )
}
