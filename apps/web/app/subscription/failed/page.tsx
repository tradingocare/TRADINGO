'use client'
import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { XCircle, RefreshCcw, ArrowLeft, HeadphonesIcon } from 'lucide-react'

function FailedContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reason = searchParams.get('reason') || ''

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background:'#0A0A0F' }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background:'radial-gradient(circle,rgba(255,77,0,0.3),transparent 70%)', filter:'blur(80px)' }} />
      </div>

      <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
        className="relative z-10 text-center max-w-md mx-auto px-4">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
          <XCircle size={32} className="text-red-400" />
        </div>
        <h1 className="text-white font-black text-2xl mb-2">Payment Failed</h1>
        <p className="text-white/50 text-sm mb-4">
          {reason || 'The payment was not completed. Please try again or use a different payment method.'}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => router.back()}
            className="px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-1.5"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.8)',
            }}>
            <ArrowLeft size={14} /> Try Again
          </button>
          <button onClick={() => router.push('/plans')}
            className="px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-1.5"
            style={{
              background: 'linear-gradient(135deg,#FF4D00,#FF7A3D)',
              color: '#fff',
            }}>
            <RefreshCcw size={14} /> Back to Plans
          </button>
        </div>
        <div className="mt-6">
          <button onClick={() => router.push('/support')}
            className="text-white/30 hover:text-white/50 text-xs flex items-center gap-1 mx-auto transition-colors">
            <HeadphonesIcon size={12} /> Need help? Contact Support
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default function FailedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background:'#0A0A0F' }}>
        <div className="w-12 h-12 rounded-full border-2 border-t-[#FF4D00] border-white/10 animate-spin" />
      </div>
    }>
      <FailedContent />
    </Suspense>
  )
}
