'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/lib/api/client'
import { Loader2, CheckCircle2, XCircle, ArrowLeft, RefreshCcw, Shield, CreditCard, Smartphone, Landmark, Globe, AlertTriangle, Info } from 'lucide-react'

declare global {
  interface Window {
    Razorpay: any
  }
}

const PAYMENT_METHODS = [
  { id: 'RAZORPAY', label: 'Razorpay', icon: Shield, color: '#3D8BFF', description: 'Cards, UPI, Net Banking, Wallet' },
  { id: 'UPI', label: 'UPI', icon: Smartphone, color: '#4ade80', description: 'Google Pay, PhonePe, Paytm' },
  { id: 'CREDIT_CARD', label: 'Credit / Debit Card', icon: CreditCard, color: '#9B5DE5', description: 'Visa, Mastercard, RuPay' },
  { id: 'NET_BANKING', label: 'Net Banking', icon: Landmark, color: '#FF4D00', description: 'All major banks' },
  { id: 'NEFT', label: 'NEFT / RTGS', icon: Globe, color: '#6b7280', description: 'Bank transfer' },
]

type PaymentStatus = 'idle' | 'creating' | 'processing' | 'success' | 'failed'

declare global {
  interface Window {
    Razorpay: any
  }
}

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
        } catch {
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
      theme: { color: '#FF4D00' },
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition-colors mb-6 text-sm">
          <ArrowLeft size={14} /> Back
        </button>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Complete Payment</h1>
          <p className="text-sm text-gray-500 mb-6">{planName}</p>

          {amount > 0 && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-orange-50 border border-orange-200 mb-6">
              <span className="text-sm font-semibold text-gray-700">Amount Due</span>
              <span className="text-xl font-black text-orange-600">₹{amount.toLocaleString('en-IN')}</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            {status === 'success' ? (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} className="text-green-500" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Payment Successful!</h2>
                <p className="text-sm text-gray-500">Redirecting to confirmation...</p>
              </motion.div>
            ) : status === 'failed' ? (
              <motion.div key="failed" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <XCircle size={32} className="text-red-500" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Payment Failed</h2>
                <p className="text-sm text-gray-500 mb-4">{error || 'Something went wrong.'}</p>
                <button onClick={handleRetry} className="px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-1.5 bg-orange-500 text-white hover:bg-orange-600 mx-auto transition-all">
                  <RefreshCcw size={14} /> Try Again
                </button>
              </motion.div>
            ) : status === 'creating' ? (
              <motion.div key="creating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
                <Loader2 size={32} className="animate-spin text-orange-500 mx-auto mb-4" />
                <p className="text-sm text-gray-500">Creating payment order...</p>
              </motion.div>
            ) : status === 'processing' ? (
              <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
                {selectedMethod === 'RAZORPAY' ? (
                  <>
                    <Loader2 size={32} className="animate-spin text-orange-500 mx-auto mb-4" />
                    <p className="text-sm text-gray-500">Opening Razorpay checkout...</p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                      <Loader2 size={32} className="animate-spin text-blue-500" />
                    </div>
                    <p className="text-sm text-gray-500">Processing payment...</p>
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
                        className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                          selected ? 'border-orange-400 ring-2 ring-orange-100 bg-orange-50/50' : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}>
                        <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                          <Icon size={20} style={{ color: method.color }} />
                        </div>
                        <div className="flex-1">
                          <span className="font-semibold text-sm text-gray-900">{method.label}</span>
                          <p className="text-xs text-gray-400">{method.description}</p>
                        </div>
                        {selected && <CheckCircle2 size={18} className="text-orange-500 shrink-0" />}
                      </button>
                    )
                  })}
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm mb-4">
                    <AlertTriangle size={14} className="shrink-0" /> {error}
                  </div>
                )}

                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 mb-6">
                  <Info size={16} className="text-amber-500 mt-0.5 shrink-0" />
                  <div className="text-sm text-amber-800">
                    <p className="font-semibold mb-0.5">Secure Payment</p>
                    <p className="text-amber-700">Your payment is processed securely through Razorpay. We never store your card details.</p>
                  </div>
                </div>

                <button onClick={handlePay} disabled={!selectedMethod || polling}
                  className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                  {polling ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
                  Pay ₹{amount.toLocaleString('en-IN')}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <p className="text-center text-[10px] text-gray-400 mt-4">Secured by Razorpay. SSL encrypted.</p>
      </div>
    </div>
  )
}
