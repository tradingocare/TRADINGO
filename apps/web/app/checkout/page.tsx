'use client'
import { Suspense, useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingCart, MapPin, CreditCard, User,
  Package, Shield, ChevronRight, ArrowLeft, Truck, Check, Loader2, AlertCircle,
} from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import { useAuthStore } from '@/store/auth-store'
import { toast } from '@/components/ui/use-toast'
import type { OrderSource, OrderType } from '@prisma/client'

interface ProductBrief {
  id: string; name: string; slug: string; price: number
  companyId: string; companyName: string; media: { url: string }[]
}

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const productId = searchParams.get('productId')
  const qty = parseInt(searchParams.get('qty') || '1', 10)
  const user = useAuthStore((s: any) => s.user)

  const [step, setStep] = useState<'info' | 'delivery' | 'payment'>('info')
  const [product, setProduct] = useState<ProductBrief | null>(null)
  const [loading, setLoading] = useState(true)
  const [productErr, setProductErr] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submittingLabel, setSubmittingLabel] = useState('')

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    companyName: '',
    addressLine: '',
    city: '',
    state: '',
    pincode: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!productId) { setLoading(false); return }
    apiClient.get(`/products/lookup/${productId}`)
      .then(r => {
        const d = r.data?.data || r.data
        setProduct({
          id: d.id, name: d.name, slug: d.slug, price: d.price,
          companyId: d.companyId, companyName: d.company?.name || '',
          media: d.media || [],
        })
        setLoading(false)
      })
      .catch(() => {
        setProductErr('Could not load product details')
        setLoading(false)
      })
  }, [productId])

  const update = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const validate = useCallback((): boolean => {
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
  }, [step, form])

  const next = () => {
    if (!validate()) return
    if (step === 'info') setStep('delivery')
    else if (step === 'delivery') setStep('payment')
  }

  const back = () => {
    if (step === 'delivery') setStep('info')
    else if (step === 'payment') setStep('delivery')
  }

  const placeOrder = useCallback(async () => {
    if (!validate()) return
    if (!user?.id) { toast.error('Please login to place an order'); return }
    if (!product) { toast.error('Product information not available'); return }

    setSubmitting(true)
    setSubmittingLabel('Creating order...')

    try {
      const companyId = (user as any).companyId || ''
      if (!companyId) { toast.error('Company not found'); setSubmitting(false); return }

      const orderPayload = {
        source: 'DIRECT' as OrderSource,
        type: 'PURCHASE' as OrderType,
        sellerCompanyId: product.companyId,
        subtotal: product.price * qty,
        totalAmount: product.price * qty,
        quantity: qty,
        items: [{ productId: product.id, productName: product.name, quantity: qty, unitPrice: product.price }],
        locations: [{
          type: 'DELIVERY',
          address: form.addressLine,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          contactName: form.fullName,
          contactPhone: form.phone,
          isDeliveryLocation: true,
        }],
      }

      const orderRes = await apiClient.post(`/companies/${companyId}/orders`, orderPayload)
      const order = orderRes.data?.data || orderRes.data

      setSubmittingLabel('Creating payment...')
      const paymentPayload = {
        type: 'ORDER_PAYMENT',
        amount: product.price * qty,
        orderId: order.id,
        description: `Payment for ${product.name}`,
      }
      const paymentRes = await apiClient.post(`/companies/${companyId}/payments/order`, paymentPayload)
      const gatewayOrder = paymentRes.data?.data || paymentRes.data

      setSubmittingLabel('Opening Razorpay...')
      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || ''
      const options: any = {
        key: razorpayKey,
        amount: gatewayOrder.amount,
        currency: gatewayOrder.currency || 'INR',
        name: 'TRADINGO',
        description: `Order #${order.orderNumber || order.id.slice(0, 8)}`,
        order_id: gatewayOrder.gatewayOrderId || gatewayOrder.id,
        handler: async function (response: any) {
          setSubmittingLabel('Verifying payment...')
          const verifyRes = await apiClient.post(`/companies/${companyId}/payments/verify`, {
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
            razorpaySignature: response.razorpay_signature,
          })
          if (verifyRes.data) {
            toast.success('Payment successful!')
            router.push(`/buyer/orders`)
          } else {
            toast.error('Payment verification failed')
          }
        },
        modal: {
          ondismiss: () => {
            toast.error('Payment cancelled')
            setSubmitting(false)
          },
        },
        prefill: { name: form.fullName, email: form.email, contact: form.phone },
        theme: { color: '#f59e0b' },
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.on('payment.failed', function (resp: any) {
        toast.error(resp.error?.description || 'Payment failed')
        setSubmitting(false)
      })
      rzp.open()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to place order')
      setSubmitting(false)
    }
  }, [validate, user, product, qty, form, router])

  const inputClasses = (field: string) =>
    `w-full px-3.5 py-2.5 rounded-xl text-sm text-text-primary bg-surface outline-none transition-all duration-200 placeholder:text-text-secondary
     border ${errors[field] ? 'border-status-error/50' : 'border-border hover:border-accent/20 focus:border-accent focus:ring-2 focus:ring-accent/20'}`

  const Input = ({ field, placeholder, type = 'text' }: { field: string; placeholder: string; type?: string }) => (
    <div>
      <input
        type={type}
        placeholder={placeholder}
        value={(form as any)[field]}
        onChange={e => update(field, e.target.value)}
        className={inputClasses(field)}
      />
      {errors[field] && <p className="mt-1 text-xs text-status-error">{errors[field]}</p>}
    </div>
  )

  const steps = [
    { key: 'info', label: 'Information', icon: User },
    { key: 'delivery', label: 'Delivery', icon: MapPin },
    { key: 'payment', label: 'Payment', icon: CreditCard },
  ] as const

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 bg-bg-base flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin text-accent" />
          <p className="text-text-secondary text-sm">Loading product...</p>
        </div>
      </div>
    )
  }

  if (!productId || !product) {
    return (
      <div className="min-h-screen pt-24 pb-16 bg-bg-base flex items-center justify-center">
        <div className="max-w-md text-center px-4">
          <AlertCircle size={40} className="mx-auto mb-4 text-text-tertiary" />
          <h2 className="text-text-primary font-semibold text-lg mb-2">No product selected</h2>
          <p className="text-text-secondary text-sm mb-6">{productErr || 'Browse products to add to cart'}</p>
          <Link href="/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-accent text-btn-primary-text shadow-lg">
            Browse Products
          </Link>
        </div>
      </div>
    )
  }

  const amount = product.price * qty

  return (
    <div className="min-h-screen pt-24 pb-16 bg-bg-base">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] opacity-10 rounded-full"
          style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--accent) 9%, transparent), transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4">
        <Link href={product?.slug ? `/products/${product.slug}` : '/products'}
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent transition-colors mb-6">
          <ArrowLeft size={14} /> Back
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="rounded-3xl overflow-hidden mb-5 bg-surface border border-border shadow-xl backdrop-blur-xl">
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-accent/10">
                  <ShoppingCart size={18} className="text-accent" />
                </div>
                <div>
                  <h1 className="text-text-primary font-bold text-xl">Checkout</h1>
                  <p className="text-text-secondary text-xs">Complete your order</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-8 text-xs">
                {steps.map((s, i) => {
                  const active = step === s.key
                  const done = steps.findIndex(x => x.key === step) > i
                  return (
                    <div key={s.key} className="flex items-center gap-2 flex-1">
                      <button onClick={() => { if (done) setStep(s.key) }}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl flex-1 transition-all duration-200 ${
                          active ? 'bg-accent/10 border border-accent/25' : done ? 'bg-accent/5 border border-accent/12' : 'bg-surface border border-border'
                        }`}>
                        {done ? (
                          <Check size={13} className="text-accent" />
                        ) : (
                          <s.icon size={13} className={active ? 'text-accent' : 'text-text-secondary'} />
                        )}
                        <span className={active ? 'text-accent font-semibold' : done ? 'text-accent/70' : 'text-text-secondary'}>
                          {s.label}
                        </span>
                      </button>
                      {i < 2 && <ChevronRight size={14} className="text-text-tertiary flex-shrink-0" />}
                    </div>
                  )
                })}
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                  {step === 'info' && (
                    <div className="rounded-2xl p-5 bg-surface border border-border">
                      <h2 className="text-text-primary font-semibold text-sm mb-4 flex items-center gap-2">
                        <User size={14} className="text-accent" /> Buyer Information
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
                    <div className="rounded-2xl p-5 bg-surface border border-border">
                      <h2 className="text-text-primary font-semibold text-sm mb-4 flex items-center gap-2">
                        <MapPin size={14} className="text-accent" /> Delivery Address
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
                    <div className="rounded-2xl p-5 bg-surface border border-border">
                      <h2 className="text-text-primary font-semibold text-sm mb-4 flex items-center gap-2">
                        <CreditCard size={14} className="text-accent" /> Payment Method
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {['Razorpay'].map(m => (
                          <label key={m}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm cursor-pointer transition-all bg-accent/10 border border-accent/30 text-accent`}>
                            <input type="radio" name="payment" value={m} checked={true} readOnly className="sr-only" />
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
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-btn-glass-text bg-btn-glass border border-border transition-colors hover:bg-btn-glass-hover-bg hover:text-btn-glass-hover-text">
                      <ArrowLeft size={14} /> Back
                    </motion.button>
                  )}
                </div>
                {step !== 'payment' ? (
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }} onClick={next}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-br from-accent-500 to-accent-400 text-btn-primary-text shadow-lg">
                    Next <ChevronRight size={14} />
                  </motion.button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="rounded-3xl p-5 bg-surface border border-border backdrop-blur-xl">
              <h2 className="text-text-primary font-semibold text-sm mb-3 flex items-center gap-2">
                <Package size={14} className="text-accent" /> Order Summary
              </h2>
              <div className="flex items-start gap-3 mb-3">
                {product.media?.[0]?.url && (
                  <img src={product.media[0].url} alt={product.name} className="w-14 h-14 rounded-xl object-cover border border-border" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-text-primary text-sm font-medium truncate">{product.name}</p>
                  <p className="text-text-secondary text-xs">{product.companyName}</p>
                </div>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Quantity</span>
                  <span className="text-text-primary font-semibold">{qty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Unit Price</span>
                  <span className="text-text-primary">₹{(product.price / 100).toFixed(2)}</span>
                </div>
                <div className="border-t border-border pt-1.5 mt-1.5 flex justify-between">
                  <span className="text-text-primary font-semibold">Total</span>
                  <span className="text-accent font-bold">₹{(amount / 100).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl p-6 bg-accent/5 border border-accent/15 shadow-lg flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-3">
                <Shield size={14} className="text-accent" />
                <p className="text-xs text-text-secondary">Secure payment via Razorpay</p>
              </div>
              {submitting ? (
                <div className="flex items-center justify-center gap-3 py-4">
                  <Loader2 size={18} className="animate-spin text-accent" />
                  <span className="text-text-primary text-sm">{submittingLabel}</span>
                </div>
              ) : (
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}
                    onClick={placeOrder}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold bg-gradient-to-br from-accent-500 to-accent-400 text-btn-primary-text shadow-lg">
                    <Truck size={15} /> Place Order
                  </motion.button>
                  <Link href="/products"
                    className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold bg-btn-glass text-btn-glass-text border border-border hover:bg-btn-glass-hover-bg hover:text-btn-glass-hover-text">
                    Browse More
                  </Link>
                </div>
              )}
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
      <div className="min-h-screen pt-24 flex items-center justify-center bg-bg-base">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
          <p className="text-text-secondary text-sm">Loading checkout...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
