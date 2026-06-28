'use client'
import { Suspense, useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../../../lib/api/client'
import { getPaymentProvider } from '../../../../lib/payment/provider'
import type { PaymentGateway } from '../../../../lib/payment/types'
import { PROVIDERS } from '../../../../lib/payment/types'
import {
  Loader2, CheckCircle2, Sparkles, ArrowRight, CreditCard, Building2, User, Mail,
  Phone, FileText, MapPin, Hash, Shield,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Plan {
  planId: string; name: string; pricePlanA: number; pricePlanB: number; pricePlanC: number
}

interface VendorProfile {
  name: string; ownerName: string; email: string; mobile: string
  gstNumber?: string; panNumber?: string; businessType?: string
  city?: string; state?: string; addressLine1?: string; pincode?: string
}

function PurchasePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planId = searchParams.get('planId') || 'trade_start'
  const initialTier = searchParams.get('tier') || 'A'

  const [plan, setPlan] = useState<Plan | null>(null)
  const [profile, setProfile] = useState<VendorProfile | null>(null)
  const [tier, setTier] = useState(initialTier)
  const [duration, setDuration] = useState(1)
  const [coupon, setCoupon] = useState('')
  const [referral, setReferral] = useState('')
  const [rmCode, setRmCode] = useState('')
  const [gstInvoice, setGstInvoice] = useState(false)
  const [billingAddress, setBillingAddress] = useState('')
  const [gateway, setGateway] = useState<PaymentGateway>('RAZORPAY')
  const [agreed, setAgreed] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [step, setStep] = useState<'form' | 'payment' | 'success'>('form')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/membership/plans').then((r: any) => {
        const d = r.data?.data || r.data || r
        const plans = Array.isArray(d) ? d : []
        setPlan(plans.find((p: Plan) => p.planId === planId) || null)
      }),
      api.get('/seller/profile').then((r: any) => {
        const d = r.data?.data || r.data || r
        setProfile(d)
      }),
    ]).catch(() => router.push('/plans/vendor'))
      .finally(() => setLoading(false))
  }, [planId, router])

  const getPrice = useCallback(() => {
    if (!plan) return 0
    const base = tier === 'B' ? plan.pricePlanB : tier === 'C' ? plan.pricePlanC : plan.pricePlanA
    return base
  }, [plan, tier])

  const total = getPrice()

  const handleProceedToPayment = async () => {
    if (!agreed) { toast.error('Please accept the terms'); return }
    setStep('payment')
  }

  const handlePayment = async () => {
    setProcessing(true)
    try {
      const provider = getPaymentProvider(gateway)
      const order = await api.post('/membership/order', { planId, planTier: tier, duration }).then((r: any) => r.data?.data || r.data || r)

      // Initialize provider
      const initResult = await provider.initialize({
        orderId: order.orderId,
        amount: total,
        currency: 'INR',
        description: `${plan?.name} (${tier})`,
      })
      if (!initResult.success) { toast.error('Payment initialization failed'); return }

      // Process payment
      const paymentResult = await provider.process()

      // Create payment record
      const payment = await api.post('/membership/payment', {
        orderId: order.orderId,
        gateway,
        paymentData: {
          amount: total,
          planId,
          planName: plan?.name,
          planTier: tier,
          gatewayOrderId: order.orderId,
        },
      }).then((r: any) => r.data?.data || r.data || r)

      // Confirm payment
      await api.post('/membership/payment/confirm', {
        paymentId: payment.id,
        gatewayPaymentId: paymentResult.gatewayPaymentId,
        gatewaySignature: paymentResult.gatewaySignature,
      })

      setStep('success')
      toast.success('Payment successful! Your membership is active.')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Payment failed. Please try again.')
    } finally { setProcessing(false) }
  }

  const goToOnboarding = () => {
    router.push('/seller/onboarding')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background:'#1D0001' }}>
      <div className="w-12 h-12 rounded-full border-2 border-t-[#FF4D00] border-white/10 animate-spin" />
    </div>
  )

  if (step === 'success') return (
    <div className="min-h-screen flex items-center justify-center" style={{ background:'#1D0001' }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background:'radial-gradient(circle,#4ade8020,transparent 70%)', filter:'blur(80px)' }} />
      </div>
      <div className="relative z-10 text-center max-w-md mx-auto px-4">
        <motion.div initial={{ scale:0 }} animate={{ scale:1 }}
          className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background:'rgba(74,222,128,0.1)', border:'2px solid rgba(74,222,128,0.3)' }}>
          <CheckCircle2 size={48} className="text-green-400" />
        </motion.div>
        <h1 className="text-white font-black text-3xl mb-3">Membership Activated!</h1>
        <p className="text-white/50 text-sm mb-2">Your {plan?.name} plan is now active.</p>
        <p className="text-white/30 text-xs mb-8">You can now complete your seller profile and start selling.</p>
        <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
          onClick={goToOnboarding}
          className="flex items-center gap-2 mx-auto px-8 py-4 rounded-xl font-bold text-base"
          style={{ background:'linear-gradient(135deg,#FF4D00,#FF7A3D)', color:'#fff' }}>
          <Sparkles size={18} /> Complete Your Profile <ArrowRight size={18} />
        </motion.button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background:'#1D0001' }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full opacity-8"
          style={{ background:'radial-gradient(circle,#9B5DE518,transparent 70%)', filter:'blur(80px)' }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-white font-black text-2xl sm:text-3xl">Complete Your Purchase</h1>
          <p className="text-white/40 text-sm mt-1">Review and confirm your membership plan details</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-5">
            <div className="rounded-xl p-5 border border-white/10 bg-white/[0.03]">
              <h2 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                <Building2 size={14} className="text-[#FF4D00]" /> Company Information
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Building2, label: 'Company', value: profile?.name },
                  { icon: User, label: 'Owner', value: profile?.ownerName },
                  { icon: Mail, label: 'Email', value: profile?.email },
                  { icon: Phone, label: 'Mobile', value: profile?.mobile },
                  { icon: FileText, label: 'GST', value: profile?.gstNumber || 'N/A' },
                  { icon: Hash, label: 'PAN', value: profile?.panNumber || 'N/A' },
                  { icon: MapPin, label: 'Location', value: profile?.city ? `${profile.city}, ${profile.state}` : '' },
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03]">
                    <f.icon size={12} className="text-white/30" />
                    <div>
                      <p className="text-white/30 text-[9px]">{f.label}</p>
                      <p className="text-white/70 text-xs font-medium">{f.value || '—'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl p-5 border border-white/10 bg-white/[0.03]">
              <h2 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                <CreditCard size={14} className="text-[#FF4D00]" /> Order Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-white/60 text-xs font-semibold mb-1.5 block">Plan Duration</label>
                  <div className="flex gap-2">
                    {[
                      { id: 1, label: '1 Year' },
                      { id: 2, label: '2 Years' },
                      { id: 3, label: '3 Years' },
                    ].map(d => (
                      <button key={d.id} onClick={() => setDuration(d.id)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                        style={{
                          background: duration === d.id ? 'rgba(255,77,0,0.12)' : 'rgba(255,255,255,0.05)',
                          border: duration === d.id ? '1px solid rgba(255,77,0,0.35)' : '1px solid rgba(255,255,255,0.1)',
                          color: duration === d.id ? '#FF4D00' : 'rgba(255,255,255,0.5)',
                        }}>{d.label}</button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/60 text-xs font-semibold mb-1.5 block">Coupon Code</label>
                    <input value={coupon} onChange={e => setCoupon(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-white text-sm bg-white/5 border border-white/10 focus:outline-none focus:border-[#FF4D00]"
                      placeholder="Optional" />
                  </div>
                  <div>
                    <label className="text-white/60 text-xs font-semibold mb-1.5 block">Referral Code</label>
                    <input value={referral} onChange={e => setReferral(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-white text-sm bg-white/5 border border-white/10 focus:outline-none focus:border-[#FF4D00]"
                      placeholder="Optional" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/60 text-xs font-semibold mb-1.5 block">RM Code</label>
                    <input value={rmCode} onChange={e => setRmCode(e.target.value.toUpperCase())}
                      className="w-full px-4 py-2.5 rounded-xl text-white text-sm bg-white/5 border border-white/10 focus:outline-none focus:border-[#FF4D00]"
                      placeholder="Optional: RM + 5 digits" maxLength={7} />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer pb-2.5">
                      <input type="checkbox" checked={gstInvoice} onChange={e => setGstInvoice(e.target.checked)}
                        className="accent-[#FF4D00]" />
                      <span className="text-white/60 text-xs">GST Invoice Required</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-white/60 text-xs font-semibold mb-1.5 block">Billing Address</label>
                  <textarea value={billingAddress} onChange={e => setBillingAddress(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-white text-sm bg-white/5 border border-white/10 focus:outline-none focus:border-[#FF4D00] min-h-[60px]"
                    placeholder="Same as registered address" />
                </div>
              </div>
            </div>

            <div className="rounded-xl p-5 border border-white/10 bg-white/[0.03]">
              <h2 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                <Shield size={14} className="text-[#FF4D00]" /> Payment Method
              </h2>
              <div className="grid grid-cols-3 gap-2">
                {PROVIDERS.map(p => (
                  <button key={p.key} onClick={() => setGateway(p.key)}
                    className="flex items-center gap-2 p-3 rounded-xl text-xs font-semibold transition-all disabled:opacity-30"
                    disabled={!p.supported}
                    style={{
                      background: gateway === p.key ? 'rgba(255,77,0,0.12)' : 'rgba(255,255,255,0.04)',
                      border: gateway === p.key ? '1px solid rgba(255,77,0,0.35)' : '1px solid rgba(255,255,255,0.08)',
                      color: gateway === p.key ? '#FF4D00' : 'rgba(255,255,255,0.5)',
                    }}>
                    <span>{p.icon}</span>
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                className="mt-0.5 accent-[#FF4D00]" />
              <span className="text-white/50 text-xs leading-relaxed">
                I agree to the Terms & Conditions and authorize TRADINGO to charge the selected amount.
              </span>
            </label>
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-xl p-5 border border-white/10 bg-white/[0.03] sticky top-8">
              <h2 className="text-white font-bold text-sm mb-4">Order Summary</h2>
              {plan && (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-white/50 text-xs">{plan.name} ({tier})</span>
                    <span className="text-white font-semibold text-sm">₹{(total * duration).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50 text-xs">Duration</span>
                    <span className="text-white/70 text-xs">{duration} Year{duration > 1 ? 's' : ''}</span>
                  </div>
                  <div className="h-px bg-white/10" />
                  <div className="flex justify-between">
                    <span className="text-white text-sm font-bold">Total</span>
                    <span className="text-white font-black text-lg">₹{(total * duration).toLocaleString('en-IN')}</span>
                  </div>

                  {step === 'form' ? (
                    <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                      onClick={handleProceedToPayment}
                      className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                      style={{ background:'linear-gradient(135deg,#FF4D00,#FF7A3D)', color:'#fff' }}>
                      Proceed to Payment <ArrowRight size={14} />
                    </motion.button>
                  ) : (
                    <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                      onClick={handlePayment} disabled={processing}
                      className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                      style={{ background:'linear-gradient(135deg,#FF4D00,#FF7A3D)', color:'#fff' }}>
                      {processing ? <><Loader2 size={14} className="animate-spin" /> Processing...</> : <>Pay ₹{(total * duration).toLocaleString('en-IN')}</>}
                    </motion.button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default function PurchasePage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: '#1D0001' }}
        >
          <div className="w-12 h-12 rounded-full border-2 border-t-[#FF4D00] border-white/10 animate-spin" />
        </div>
      }
    >
      <PurchasePageContent />
    </Suspense>
  )
}