import type { Metadata } from 'next'
import RfqCreationWizard from './RfqCreationWizard'

export const metadata: Metadata = {
  title: 'Create RFQ — TRADINGO',
  description: 'Post your requirement and receive competitive quotes from verified sellers across India.',
}

export default function NewRfqPage() {
  return (
    <div className="min-h-screen" style={{ background: '#1D0001' }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle,#FF4D0018,transparent 70%)', filter: 'blur(80px)' }} />
      </div>
      <div className="relative z-10 min-h-screen flex flex-col">
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <a href="/">
            <img src="/logo/trdn.png" alt="TRADINGO" className="h-9 w-9 object-contain" />
          </a>
          <a href="/buyer/rfqs" className="text-white/40 text-xs hover:text-[#FF4D00] transition-colors">
            ← Back to My RFQs
          </a>
        </div>
        <div className="flex-1 flex items-start justify-center px-4 py-8">
          <div className="w-full max-w-2xl">
            <RfqCreationWizard />
          </div>
        </div>
      </div>
    </div>
  )
}
