'use client'
import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingCart, MapPin, CreditCard, User,
  Package, Shield, ChevronRight, ArrowLeft, Truck, Check,
} from 'lucide-react'

function CheckoutContent() {
  const searchParams = useSearchParams()
  const productId = searchParams.get('productId')
  const qty = searchParams.get('qty')
  const [step, setStep] = useState<'info' | 'delivery' | 'payment'>('info')

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    companyName: '',
    addressLine: '',
    city: '',
    state: '',
    pincode: '',
    paymentMethod: 'Razorpay',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const update = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (step === 'info') {
      if (!form.fullName.trim() || form.fullName.trim().length < 2) e.fullName = 'Enter your full name'
      if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required'
      if (!form.phone.trim() || !/^\d{10}$/.test(form.phone.replace(/\D/g, ''))) e.phone = '10-digit phone required'
      if (!form.companyName.trim()) e.companyName = 'Company name required'
    } else if (step === 'delivery') {
      if (!form.addressLine.trim()) e.addressLine = 'Address is required'
      if (!form.city.trim()) e.city = 'City is required'
      if (!form.state.trim()) e.state = 'State is required'
      if (!form.pincode.trim() || !/^\d{6}$/.test(form.pincode.trim())) e.pincode = '6-digit pincode required'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => {
    if (!validate()) return
    if (step === 'info') setStep('delivery')
    else if (step === 'delivery') setStep('payment')
  }

  const back = () => {
    if (step === 'delivery') setStep('info')
    else if (step === 'payment') setStep('delivery')
  }

  const inputClasses = (field: string) =>
    `w-full px-3.5 py-2.5 rounded-xl text-sm text-white bg-transparent outline-none transition-all duration-200 placeholder:text-white/30
     border ${errors[field] ? 'border-red-500/50' : 'border-white/[0.10] hover:border-white/[0.18] focus:border-orange-500/50 focus:shadow-[0_0_12px_-4px_rgba(255,77,0,0.2)]'}`

  const Input = ({ field, placeholder, type = 'text' }: { field: string; placeholder: string; type?: string }) => (
    <div>
      <input
        type={type}
        placeholder={placeholder}
        value={(form as any)[field]}
        onChange={e => update(field, e.target.value)}
        className={inputClasses(field)}
      />
      {errors[field] && <p className="mt-1 text-xs text-red-400">{errors[field]}</p>}
    </div>
  )

  const steps = [
    { key: 'info', label: 'Information', icon: User },
    { key: 'delivery', label: 'Delivery', icon: MapPin },
    { key: 'payment', label: 'Payment', icon: CreditCard },
  ] as const

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ background: '#1D0001' }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] opacity-10 rounded-full"
          style={{ background: 'radial-gradient(circle, #FF4D0018, transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4">
        <Link href={productId ? `/products/${productId}` : '/browse'}
          className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-[#FF4D00] transition-colors mb-6">
          <ArrowLeft size={14} /> Back
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="rounded-3xl overflow-hidden mb-5"
            style={{
              background: 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.09)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
            }}>
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(255,77,0,0.12)' }}>
                  <ShoppingCart size={18} style={{ color: '#FF4D00' }} />
                </div>
                <div>
                  <h1 className="text-white font-bold text-xl">Checkout</h1>
                  <p className="text-white/40 text-xs">Complete your order</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-8 text-xs">
                {steps.map((s, i) => {
                  const active = step === s.key
                  const done = steps.findIndex(x => x.key === step) > i
                  return (
                    <div key={s.key} className="flex items-center gap-2 flex-1">
                      <button onClick={() => { if (done) setStep(s.key) }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl flex-1 transition-all duration-200"
                        style={{
                          background: active ? 'rgba(255,77,0,0.12)' : done ? 'rgba(255,77,0,0.06)' : 'rgba(255,255,255,0.04)',
                          border: active ? '1px solid rgba(255,77,0,0.25)' : done ? '1px solid rgba(255,77,0,0.12)' : '1px solid rgba(255,255,255,0.06)',
                        }}>
                        {done ? (
                          <Check size={13} style={{ color: '#FF4D00' }} />
                        ) : (
                          <s.icon size={13} style={{ color: active ? '#FF4D00' : 'rgba(255,255,255,0.3)' }} />
                        )}
                        <span className={active ? 'text-[#FF4D00] font-semibold' : done ? 'text-orange-400/70' : 'text-white/30'}>
                          {s.label}
                        </span>
                      </button>
                      {i < 2 && <ChevronRight size={14} className="text-white/20 flex-shrink-0" />}
                    </div>
                  )
                })}
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                  {step === 'info' && (
                    <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <h2 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                        <User size={14} style={{ color: '#FF4D00' }} /> Buyer Information
                      </h2>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <Input field="fullName" placeholder="Full Name" />
                        <Input field="email" placeholder="Email Address" type="email" />
                        <Input field="phone" placeholder="Phone Number" type="tel" />
                        <Input field="companyName" placeholder="Company Name" />
                      </div>
                    </div>
                  )}

                  {step === 'delivery' && (
                    <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <h2 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                        <MapPin size={14} style={{ color: '#FF4D00' }} /> Delivery Address
                      </h2>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <Input field="addressLine" placeholder="Address Line" />
                        </div>
                        <Input field="city" placeholder="City" />
                        <Input field="state" placeholder="State" />
                        <Input field="pincode" placeholder="Pincode" type="text" />
                      </div>
                    </div>
                  )}

                  {step === 'payment' && (
                    <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <h2 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                        <CreditCard size={14} style={{ color: '#FF4D00' }} /> Payment Method
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {['Razorpay', 'UPI', 'Net Banking', 'Card'].map(m => (
                          <label key={m}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm cursor-pointer transition-all"
                            style={{
                              background: form.paymentMethod === m ? 'rgba(255,77,0,0.1)' : 'rgba(255,255,255,0.05)',
                              border: form.paymentMethod === m ? '1px solid rgba(255,77,0,0.3)' : '1px solid rgba(255,255,255,0.08)',
                              color: form.paymentMethod === m ? '#FF4D00' : 'rgba(255,255,255,0.6)',
                            }}>
                            <input type="radio" name="payment" value={m} checked={form.paymentMethod === m}
                              onChange={e => update('paymentMethod', e.target.value)} className="sr-only" />
                            {m}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="flex items-center justify-between mt-6">
                <div>
                  {step !== 'info' && (
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }} onClick={back}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-white/60 transition-colors hover:text-white/80"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <ArrowLeft size={14} /> Back
                    </motion.button>
                  )}
                </div>
                {step !== 'payment' ? (
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }} onClick={next}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold"
                    style={{
                      background: 'linear-gradient(135deg, #FF4D00, #FF7A3D)',
                      color: '#fff',
                      boxShadow: '0 4px 16px rgba(255,77,0,0.3)',
                    }}>
                    Next <ChevronRight size={14} />
                  </motion.button>
                ) : null}
              </div>
            </div>
          </div>

          {productId && qty && (
            <div className="rounded-3xl p-5 mb-5"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(24px)' }}>
              <h2 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                <Package size={14} style={{ color: '#FF4D00' }} /> Order Summary
              </h2>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/50">Product ID</span>
                <span className="text-white font-mono text-xs">{productId}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-white/50">Quantity</span>
                <span className="text-white font-semibold">{qty}</span>
              </div>
            </div>
          )}

          <div className="rounded-3xl p-6 sm:p-8"
            style={{
              background: 'rgba(255,77,0,0.06)',
              border: '1px solid rgba(255,77,0,0.15)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
            }}>
            <div className="flex items-center gap-2 mb-4">
              <Shield size={14} style={{ color: '#FF4D00' }} />
              <p className="text-xs text-white/50">
                This feature is under development. Continue with{' '}
                <Link href="/rfq" className="text-[#FF4D00] hover:underline">RFQ</Link>
                {' '}or{' '}
                <Link href="/messages" className="text-[#FF4D00] hover:underline">Contact Seller</Link>.
              </p>
            </div>

            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold"
                style={{
                  background: 'linear-gradient(135deg, #FF4D00, #FF7A3D)',
                  color: '#fff',
                  boxShadow: '0 4px 16px rgba(255,77,0,0.3)',
                }}>
                <Truck size={15} /> Place Order (Demo)
              </motion.button>
              <Link href="/browse"
                className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.8)',
                }}>
                Browse More
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-24 flex items-center justify-center" style={{ background: '#1D0001' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-orange-500/30 border-t-[#FF4D00] animate-spin" />
          <p className="text-white/40 text-sm">Loading checkout...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
