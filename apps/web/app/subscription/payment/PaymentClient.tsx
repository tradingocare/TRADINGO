'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/lib/api/client'
import { CheckCircle2, XCircle, ArrowLeft, RefreshCcw, Shield, CreditCard, Smartphone, Landmark, Globe, AlertTriangle, Info } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

declare global {
  interface Window {
    Razorpay: any
  }
}

const PAYMENT_METHODS = [
  { id: 'RAZORPAY', label: 'Razorpay', icon: Shield, color: '#3D8BFF', description: 'Cards, UPI, Net Banking, Wallet' },
  { id: 'UPI', label: 'UPI', icon: Smartphone, color: '#4ade80', description: 'Google Pay, PhonePe, Paytm' },
  { id: 'CREDIT_CARD', label: 'Credit / Debit Card', icon: CreditCard, color: '#9B5DE5', description: 'Visa, Mastercard, RuPay' },
  { id: 'NET_BANKING', label: 'Net Banking', icon: Landmark, color: '#f59e0b', description: 'All major banks' },
  { id: 'NEFT', label: 'NEFT / RTGS', icon: Globe, color: '#6b7280', description: 'Bank transfer' },
]

type PaymentStatus = 'idle' | 'creating' | 'processing' | 'success' | 'failed'

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function PaymentClient() {
  const router = useRouter()
  const [status, setStatus] = useState<PaymentStatus>('idle')
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [orderData, setOrderData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [razorpayReady, setRazorpayReady] = useState(false)
  const [polling, setPolling] = useState(false)
  const [planName, setPlanName] = useState('')
  const [amount, setAmount] = useState(0)
  const paymentIdRef = useRef<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setPlanName(params.get('plan') || 'Membership Plan')
    setAmount(Number(params.get('amount')) || 0)
  }, [])

  useEffect(() => {
    loadRazorpayScript().then(setRazorpayReady)
  }, [])

  const createOrder = useCallback(async (gateway: string) => {
    setStatus('creating')
    setError(null)
    try {
      const params = new URLSearchParams(window.location.search)
      const res = await api.post('/payment/razorpay/order', {
        planId: params.get('planId') || 'trade_pro',
        planTier: params.get('tier') || 'A',
        duration: params.get('duration') || 1,
        gateway,
      })
      const data = res.data?.data || res.data || res
      setOrderData(data)
      paymentIdRef.current = data.id
      setStatus('processing')
      return data
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to create order')
      setStatus('failed')
      return null
    }
  }, [])

  const openRazorpay = useCallback(async (order: any) => {
    if (!window.Razorpay || !order) return

    const options = {
      key: order.keyId,
      amount: order.amount,
      currency: order.currency || 'INR',
      name: 'TRADINGO',
      description: order.planName || 'Subscription',
      order_id: order.gatewayOrderId,
      handler: async (response: any) => {
        setStatus('processing')
        try {
          const verifyRes = await api.post('/payment/razorpay/verify', {
            paymentId: paymentIdRef.current,
            gatewayPaymentId: response.razorpay_payment_id,
            gatewaySignature: response.razorpay_signature,
            gateway: 'RAZORPAY',
          })
          setStatus('success')
          setTimeout(() => {
            const params = new URLSearchParams(window.location.search)
            router.push(`/subscription/success?plan=${planName}&invoice=${paymentIdRef.current || ''}`)
          }, 2000)
        } catch (verifyErr: any) {
          console.error('Razorpay verify error:', verifyErr)
          setStatus('failed')
          setError('Payment verification failed. Please contact support.')
        }
      },
      modal: {
        ondismiss: () => {
          setStatus('idle')
          setError('Payment cancelled. You can try again.')
        },
      },
      prefill: {
        name: '',
        email: '',
        contact: '',
      },
      theme: { color: '#f59e0b' },
    }

    const rzp = new window.Razorpay(options)
    rzp.on('payment.failed', (response: any) => {
      setStatus('failed')
      setError(response.error?.description || 'Payment failed. Please try again.')
    })
    rzp.open()
  }, [planName, router])

  const handlePay = async () => {
    if (!selectedMethod) return
    setPolling(true)

    if (selectedMethod === 'RAZORPAY') {
      const order = await createOrder('RAZORPAY')
      if (order) await openRazorpay(order)
    } else {
      setError(`${PAYMENT_METHODS.find(m => m.id === selectedMethod)?.label} is coming soon. Please use Razorpay.`)
      setStatus('idle')
    }
    setPolling(false)
  }

  const handleRetry = () => {
    setStatus('idle')
    setError(null)
    setOrderData(null)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <div className="pointer-events-none fixed inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(245, 158, 11, 0.08), transparent)' }} />
      <div className="relative max-w-2xl mx-auto px-4 py-8">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors mb-6 text-sm">
          <ArrowLeft size={14} /> Back
        </button>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-[22px] p-6 sm:p-8 bg-bg-elevated border border-border">
          <h1 className="text-xl font-bold text-white mb-1">Complete Payment</h1>
          <p className="text-sm text-white/50 mb-6">{planName}</p>

          {amount > 0 && (
            <div className="flex items-center justify-between p-4 rounded-xl mb-6" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <span className="text-sm font-semibold text-white/70">Amount Due</span>
              <span className="text-xl font-black text-amber-400">₹{amount.toLocaleString('en-IN')}</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            {status === 'success' ? (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(74,222,128,0.15)' }}>
                  <CheckCircle2 size={32} className="text-green-400" />
                </div>
                <h2 className="text-lg font-bold text-white mb-1">Payment Successful!</h2>
                <p className="text-sm text-white/50">Redirecting to confirmation...</p>
              </motion.div>
            ) : status === 'failed' ? (
              <motion.div key="failed" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(239,68,68,0.15)' }}>
                  <XCircle size={32} className="text-red-400" />
                </div>
                <h2 className="text-lg font-bold text-white mb-1">Payment Failed</h2>
                <p className="text-sm text-white/50 mb-4">{error || 'Something went wrong.'}</p>
                <button onClick={handleRetry} className="px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-1.5 bg-amber-500 text-white hover:bg-amber-600 mx-auto transition-all">
                  <RefreshCcw size={14} /> Try Again
                </button>
              </motion.div>
            ) : status === 'creating' ? (
              <motion.div key="creating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
                <LoadingSpinner size="xl" />
                <p className="text-sm text-white/50">Creating payment order...</p>
              </motion.div>
            ) : status === 'processing' ? (
              <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
                {selectedMethod === 'RAZORPAY' ? (
                  <>
                    <LoadingSpinner size="xl" />
                    <p className="text-sm text-white/50">Opening Razorpay checkout...</p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(59,130,246,0.15)' }}>
                      <LoadingSpinner size="xl" />
                    </div>
                    <p className="text-sm text-white/50">Processing payment...</p>
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="grid grid-cols-1 gap-3 mb-6">
                  {PAYMENT_METHODS.map(method => {
                    const Icon = method.icon
                    const selected = selectedMethod === method.id
                    return (
                      <button key={method.id} onClick={() => setSelectedMethod(method.id)}
                        className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all bg-bg-elevated ${
                          selected ? 'border-orange-400/50' : 'border-border hover:border-border'
                        }`}
                        style={{ background: selected ? 'rgba(245,158,11,0.06)' : undefined }}>
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg-elevated)' }}>
                          <Icon size={20} style={{ color: method.color }} />
                        </div>
                        <div className="flex-1">
                          <span className="font-semibold text-sm text-white">{method.label}</span>
                          <p className="text-xs text-white/40">{method.description}</p>
                        </div>
                        {selected && <CheckCircle2 size={18} className="text-orange-400 shrink-0" />}
                      </button>
                    )
                  })}
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg mb-4 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}>
                    <AlertTriangle size={14} className="shrink-0" /> {error}
                  </div>
                )}

                <div className="p-4 rounded-xl flex items-start gap-3 mb-6" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
                  <Info size={16} className="text-amber-400 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-semibold mb-0.5 text-amber-300">Secure Payment</p>
                    <p className="text-amber-200/60">Your payment is processed securely through Razorpay. We never store your card details.</p>
                  </div>
                </div>

                <button onClick={handlePay} disabled={!selectedMethod || polling}
                  className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                  {polling ? <LoadingSpinner size="xs" /> : <Shield size={16} />}
                  Pay ₹{amount.toLocaleString('en-IN')}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <p className="text-center text-[10px] text-white/30 mt-4">Secured by Razorpay. SSL encrypted.</p>
      </div>
    </div>
  )
}
