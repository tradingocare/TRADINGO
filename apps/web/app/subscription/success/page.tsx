'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react'

function SuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [countdown, setCountdown] = useState(5)

  const planName = searchParams.get('plan') || 'Your Plan'
  const invoiceNumber = searchParams.get('invoice') || ''

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      router.push('/dashboard')
    }
  }, [countdown, router])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background:'#0A0A0F' }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background:'radial-gradient(circle,rgba(74,222,128,0.3),transparent 70%)', filter:'blur(80px)' }} />
      </div>

      <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
        className="relative z-10 text-center max-w-md mx-auto px-4">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} className="text-green-400" />
        </div>
        <h1 className="text-white font-black text-2xl mb-2">Payment Successful!</h1>
        <p className="text-white/50 text-sm mb-1">
          Your <span className="text-white font-semibold">{planName}</span> membership is now active.
        </p>
        {invoiceNumber && (
          <p className="text-white/30 text-xs mb-6">Invoice: {invoiceNumber}</p>
        )}
        <div className="flex items-center justify-center gap-1 text-white/40 text-xs mb-8">
          <Sparkles size={12} />
          Redirecting to dashboard in {countdown}s
          <Sparkles size={12} />
        </div>
        <button onClick={() => router.push('/dashboard')}
          className="px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-1.5 mx-auto"
          style={{
            background: 'linear-gradient(135deg,#FF4D00,#FF7A3D)',
            color: '#fff',
          }}>
          Go to Dashboard <ArrowRight size={14} />
        </button>
      </motion.div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background:'#0A0A0F' }}>
        <div className="w-12 h-12 rounded-full border-2 border-t-[#FF4D00] border-white/10 animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
