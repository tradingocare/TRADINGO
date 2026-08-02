'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle2, ArrowRight, Sparkles, AlertTriangle } from 'lucide-react'
import api from '@/lib/api/client'
import { toast } from '@/components/ui/use-toast'

function SuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [countdown, setCountdown] = useState(5)
  const [verifying, setVerifying] = useState(true)
  const [verified, setVerified] = useState(false)

  const planName = searchParams.get('plan') || 'Your Plan'
  const invoiceNumber = searchParams.get('invoice') || ''

  useEffect(() => {
    if (!invoiceNumber) {
      setVerifying(false)
      setVerified(true)
      return
    }
    api.get(`/payment/lookup/${invoiceNumber}`).then((r: any) => {
      const payment = r.data?.data || r.data || r
      if (payment?.status === 'CAPTURED' || payment?.status === 'COMPLETED') {
        setVerified(true)
      } else {
        setVerified(false)
      }
    }).catch((err: any) => {
      console.error('Payment lookup failed:', err)
      toast.error('Payment verification failed')
      setVerified(false)
    }).finally(() => setVerifying(false))
  }, [invoiceNumber])

  useEffect(() => {
    if (!verifying && verified && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (!verifying && verified) {
      router.push('/dashboard')
    }
  }, [countdown, verifying, verified, router])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background:'var(--bg-base)' }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background:'radial-gradient(circle,rgba(74,222,128,0.3),transparent 70%)', filter:'blur(80px)' }} />
      </div>

      <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
        className="relative z-10 text-center max-w-md mx-auto px-4">
        {verifying ? (
          <div className="py-8">
            <div className="w-12 h-12 rounded-full border-2 border-t-[#f59e0b] border-border animate-spin mx-auto mb-4" />
            <p className="text-white/50 text-sm">Verifying payment...</p>
          </div>
        ) : verified ? (
          <>
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
                background: 'linear-gradient(135deg,#f59e0b,#fbbf24)',
                color: '#fff',
              }}>
              Go to Dashboard <ArrowRight size={14} />
            </button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-amber-400" />
            </div>
            <h1 className="text-white font-black text-2xl mb-2">Payment Pending Confirmation</h1>
            <p className="text-white/50 text-sm mb-6">
              Your payment may not have been confirmed yet. If you were charged, please contact support.
            </p>
            <button onClick={() => router.push('/dashboard')}
              className="px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-1.5 mx-auto"
              style={{
                background: 'linear-gradient(135deg,#f59e0b,#fbbf24)',
                color: '#fff',
              }}>
              Go to Dashboard <ArrowRight size={14} />
            </button>
          </>
        )}
      </motion.div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background:'var(--bg-base)' }}>
        <div className="w-12 h-12 rounded-full border-2 border-t-[#f59e0b] border-border animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
