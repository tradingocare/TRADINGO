'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/lib/api/client'
import { useAuthStore } from '@/store/auth-store'
import { useCheckoutStore, usePrice } from '@/store/checkout-store'
import type { Plan, CompanyInfo } from '@/store/checkout-store'
import {
  CheckCircle2, X, Zap, Crown, Star, Shield, ArrowRight, ArrowLeft,
  Building2, User, Mail, Phone, FileText, MapPin, Hash, Lock,
  CreditCard, Smartphone, Landmark, Globe, Percent, Gift, RefreshCcw,
  AlertCircle, Loader2, Info, ChevronRight,
} from 'lucide-react'

const PLANS_META: Record<string, { icon: any; badge?: string; color: string }> = {
  Trade_Start:   { icon: Star,   color: '#6b7280' },
  Trade_Smart:   { icon: Shield, color: '#3D8BFF' },
  Trade_Plus:    { icon: Shield, color: '#9B5DE5' },
  Trade_Pro:     { icon: Crown,  color: '#FF4D00', badge: 'Recommended' },
  Trade_Premium: { icon: Crown,  color: '#F2C94C', badge: 'Premium' },
  Trade_Elite:   { icon: Zap,    color: '#4ade80', badge: 'Ultimate' },
}

const TIER_OPTIONS = [
  { id: 'A' as const, label: 'GO Offer Year', suffix: '/year', desc: 'Best for first-year sellers' },
  { id: 'B' as const, label: 'Launch Year', suffix: '/2 years', desc: 'Best value — 2-year commitment' },
  { id: 'C' as const, label: 'Annual Plan', suffix: '/3 years', desc: 'Maximum savings — 3-year commitment' },
]

const PAYMENT_METHODS = [
  { id: 'RAZORPAY', label: 'Razorpay', icon: Shield, color: '#3D8BFF', disabled: true },
  { id: 'STRIPE', label: 'Stripe', icon: CreditCard, color: '#6772E5', disabled: true },
  { id: 'UPI', label: 'UPI', icon: Smartphone, color: '#4ade80', disabled: true },
  { id: 'CREDIT_CARD', label: 'Credit Card', icon: CreditCard, color: '#9B5DE5', disabled: true },
  { id: 'DEBIT_CARD', label: 'Debit Card', icon: CreditCard, color: '#F2C94C', disabled: true },
  { id: 'NET_BANKING', label: 'Net Banking', icon: Landmark, color: '#FF4D00', disabled: true },
  { id: 'NEFT', label: 'NEFT', icon: Globe, color: '#6b7280', disabled: true },
]

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
]

const formatPrice = (n: number) => '₹' + n.toLocaleString('en-IN')

const STEP_LABELS = [
  'Plan', 'Company', 'Billing', 'Coupon', 'Referral', 'Review', 'Terms', 'Payment', 'Confirm',
]

// Step components

function StepProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5 mb-6">
      {Array.from({ length: total }, (_, i) => {
        const stepNum = i + 1
        const isActive = stepNum === current
        const isDone = stepNum < current
        return (
          <div key={i} className="flex items-center gap-1.5 flex-1">
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ${
              isDone ? 'bg-orange-500 text-white' :
              isActive ? 'bg-orange-500 text-white ring-2 ring-orange-200' :
              'bg-gray-100 text-gray-400'
            }`}>
              {isDone ? <CheckCircle2 size={14} /> : stepNum}
            </div>
            <span className={`text-[10px] font-medium hidden sm:block ${
              isActive ? 'text-orange-600' : isDone ? 'text-orange-500' : 'text-gray-400'
            }`}>{STEP_LABELS[i]}</span>
            {i < total - 1 && <div className={`flex-1 h-0.5 rounded-full ${
              isDone ? 'bg-orange-500' : 'bg-gray-200'
            }`} />}
          </div>
        )
      })}
    </div>
  )
}

function StepPlanSelection({ onNext }: { onNext: () => void }) {
  const { plan, tier, setPlan, setTier } = useCheckoutStore()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/membership/plans').then((r: any) => {
      const d = r.data?.data || r.data || r
      const list = Array.isArray(d) ? d : []
      setPlans(list)
      if (!plan && list.length > 0) {
        const fromUrl = new URLSearchParams(window.location.search).get('planId')
        const found = fromUrl ? list.find((p: Plan) => p.planId === fromUrl) : list[3]
        setPlan(found || list[0])
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-orange-500" /></div>
  )

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Choose Your Plan</h2>
      <p className="text-sm text-gray-500 mb-4">Select a membership plan and pricing tier</p>

      <div className="flex items-center gap-2 mb-6">
        {TIER_OPTIONS.map(t => (
          <button key={t.id} onClick={() => setTier(t.id)}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all text-left flex-1 ${
              tier === t.id ? 'bg-orange-50 border-orange-300 text-orange-700' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
            } border`}>
            <div className="font-bold">{t.label}</div>
            <div className="text-[10px] opacity-60">{t.desc}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        {plans.map((p) => {
          const meta = PLANS_META[p.name.replace(/\s/g, '_')] || PLANS_META.Trade_Start
          const Icon = meta.icon
          const price = tier === 'B' ? p.pricePlanB : tier === 'C' ? p.pricePlanC : p.pricePlanA
          const isSelected = plan?.planId === p.planId
          return (
            <button key={p.id} onClick={() => setPlan(p)}
              className={`relative rounded-xl p-4 text-left transition-all border ${
                isSelected ? 'border-orange-400 ring-2 ring-orange-100 bg-orange-50/50' : 'border-gray-200 bg-white hover:border-gray-300'
              }`}>
              {meta.badge && (
                <span className="absolute -top-2 left-3 px-2 py-0.5 rounded-full text-[9px] font-bold bg-orange-500 text-white">{meta.badge}</span>
              )}
              <Icon size={18} style={{ color: meta.color }} className="mb-1.5" />
              <h3 className="font-bold text-gray-900 text-sm">{p.name}</h3>
              <div className="flex items-baseline gap-0.5 mt-1">
                <span className="font-black text-lg text-gray-900">{formatPrice(price)}</span>
                <span className="text-gray-400 text-[10px]">{TIER_OPTIONS.find(t => t.id === tier)?.suffix}</span>
              </div>
              <ul className="mt-2 space-y-1">
                {(p.features as string[]).slice(0, 3).map((f, fi) => (
                  <li key={fi} className="flex items-center gap-1 text-gray-500 text-[10px]">
                    <CheckCircle2 size={8} className="text-green-500 shrink-0" />
                    {f}
                  </li>
                ))}
                {(p.features as string[]).length > 3 && (
                  <li className="text-gray-400 text-[10px]">+{(p.features as string[]).length - 3} more</li>
                )}
              </ul>
            </button>
          )
        })}
      </div>

      <div className="flex justify-end">
        <button onClick={onNext} disabled={!plan}
          className="px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-1.5 bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
          Continue <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

function StepCompanyInfo({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const { companyInfo, setCompanyInfo } = useCheckoutStore()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    name: '', businessType: '', gstNumber: '', panNumber: '',
    ownerName: '', mobile: '', email: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    api.get('/seller/profile').then((r: any) => {
      const d = r.data?.data || r.data || r
      if (d) {
        setForm({
          name: d.name || '', businessType: d.businessType || '',
          gstNumber: d.gstNumber || '', panNumber: d.panNumber || '',
          ownerName: d.ownerName || user?.name || '',
          mobile: d.mobile || user?.phone || '',
          email: d.email || user?.email || '',
        })
        setCompanyInfo(d)
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Company name is required'
    if (!form.ownerName.trim()) e.ownerName = 'Owner name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email'
    if (!form.mobile.trim()) e.mobile = 'Mobile is required'
    else if (!/^[6-9]\d{9}$/.test(form.mobile.replace(/\D/g, ''))) e.mobile = 'Invalid mobile number'
    if (form.gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(form.gstNumber.toUpperCase())) {
      e.gstNumber = 'Invalid GST format'
    }
    if (form.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(form.panNumber.toUpperCase())) {
      e.panNumber = 'Invalid PAN format'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleContinue = () => {
    if (!validate()) return
    setCompanyInfo({
      id: companyInfo?.id || '',
      name: form.name, businessType: form.businessType,
      gstNumber: form.gstNumber, panNumber: form.panNumber,
      ownerName: form.ownerName, mobile: form.mobile, email: form.email,
      city: companyInfo?.city || '', state: companyInfo?.state || '',
      addressLine1: companyInfo?.addressLine1 || '', pincode: companyInfo?.pincode || '',
    })
    onNext()
  }

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }))

  const fields = [
    { key: 'name', label: 'Company Name', icon: Building2, required: true },
    { key: 'businessType', label: 'Business Type', icon: FileText, required: false },
    { key: 'gstNumber', label: 'GST Number', icon: Hash, required: false, placeholder: '22AAAAA0000A1Z5' },
    { key: 'panNumber', label: 'PAN Number', icon: FileText, required: false, placeholder: 'ABCDE1234F' },
    { key: 'ownerName', label: 'Owner Name', icon: User, required: true },
    { key: 'mobile', label: 'Mobile', icon: Phone, required: true, placeholder: '9876543210' },
    { key: 'email', label: 'Email', icon: Mail, required: true, placeholder: 'company@example.com' },
  ]

  if (loading) return (
    <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-orange-500" /></div>
  )

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Company Information</h2>
      <p className="text-sm text-gray-500 mb-6">Review and update your company details</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {fields.map(f => (
          <div key={f.key}>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              {f.label} {f.required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <f.icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type={f.key === 'email' ? 'email' : 'text'} value={(form as any)[f.key]}
                onChange={e => update(f.key, e.target.value)} placeholder={(f as any).placeholder || `Enter ${f.label.toLowerCase()}`}
                className={`w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm ${
                  errors[f.key] ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-orange-300'
                } outline-none transition-colors`} />
            </div>
            {errors[f.key] && <p className="text-red-500 text-[10px] mt-0.5">{errors[f.key]}</p>}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <button onClick={onPrev} className="px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 text-gray-600 hover:bg-gray-100 transition-all">
          <ArrowLeft size={14} /> Back
        </button>
        <button onClick={handleContinue} className="px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-1.5 bg-orange-500 text-white hover:bg-orange-600 transition-all">
          Continue <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

function StepBillingDetails({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const { billing, setBilling, companyInfo } = useCheckoutStore()
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (companyInfo && !billing.contactName) {
      setBilling({
        contactName: companyInfo.ownerName,
        address: companyInfo.addressLine1 || '',
        city: companyInfo.city || '',
        state: companyInfo.state || '',
        pincode: companyInfo.pincode || '',
        invoiceName: companyInfo.name,
        invoiceEmail: companyInfo.email,
        invoiceMobile: companyInfo.mobile,
      })
    }
  }, [companyInfo])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!billing.contactName.trim()) e.contactName = 'Required'
    if (!billing.address.trim()) e.address = 'Required'
    if (!billing.city.trim()) e.city = 'Required'
    if (!billing.state) e.state = 'Select state'
    if (!billing.pincode.trim()) e.pincode = 'Required'
    else if (!/^\d{6}$/.test(billing.pincode)) e.pincode = 'Invalid pincode'
    if (billing.gstBilling) {
      if (!billing.invoiceName.trim()) e.invoiceName = 'Required'
      if (!billing.invoiceEmail.trim()) e.invoiceEmail = 'Required'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billing.invoiceEmail)) e.invoiceEmail = 'Invalid email'
      if (!billing.invoiceMobile.trim()) e.invoiceMobile = 'Required'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const inputClass = (key: string) =>
    `w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors ${
      errors[key] ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-orange-300'
    }`

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Billing Details</h2>
      <p className="text-sm text-gray-500 mb-6">Enter your billing address and invoice preferences</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Billing Contact <span className="text-red-500">*</span></label>
          <input value={billing.contactName} onChange={e => setBilling({ contactName: e.target.value })} className={inputClass('contactName')} placeholder="Full name" />
          {errors.contactName && <p className="text-red-500 text-[10px] mt-0.5">{errors.contactName}</p>}
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Billing Address <span className="text-red-500">*</span></label>
          <textarea value={billing.address} onChange={e => setBilling({ address: e.target.value })} className={inputClass('address')} rows={2} placeholder="Street, building, area" />
          {errors.address && <p className="text-red-500 text-[10px] mt-0.5">{errors.address}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">City <span className="text-red-500">*</span></label>
          <input value={billing.city} onChange={e => setBilling({ city: e.target.value })} className={inputClass('city')} placeholder="City" />
          {errors.city && <p className="text-red-500 text-[10px] mt-0.5">{errors.city}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">State <span className="text-red-500">*</span></label>
          <select value={billing.state} onChange={e => setBilling({ state: e.target.value })} className={inputClass('state')}>
            <option value="">Select state</option>
            {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {errors.state && <p className="text-red-500 text-[10px] mt-0.5">{errors.state}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">PIN Code <span className="text-red-500">*</span></label>
          <input value={billing.pincode} onChange={e => setBilling({ pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })} className={inputClass('pincode')} placeholder="6-digit PIN" />
          {errors.pincode && <p className="text-red-500 text-[10px] mt-0.5">{errors.pincode}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Country</label>
          <input value={billing.country} disabled className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-gray-50 text-gray-500" />
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-gray-50 border border-gray-200">
        <input type="checkbox" id="gstBilling" checked={billing.gstBilling}
          onChange={e => setBilling({ gstBilling: e.target.checked })}
          className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400" />
        <label htmlFor="gstBilling" className="text-sm font-medium text-gray-700 cursor-pointer">I have a GST number and want GST billing</label>
      </div>

      <AnimatePresence>
        {billing.gstBilling && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 overflow-hidden">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Invoice Name <span className="text-red-500">*</span></label>
              <input value={billing.invoiceName} onChange={e => setBilling({ invoiceName: e.target.value })} className={inputClass('invoiceName')} />
              {errors.invoiceName && <p className="text-red-500 text-[10px] mt-0.5">{errors.invoiceName}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Invoice Email <span className="text-red-500">*</span></label>
              <input value={billing.invoiceEmail} onChange={e => setBilling({ invoiceEmail: e.target.value })} className={inputClass('invoiceEmail')} />
              {errors.invoiceEmail && <p className="text-red-500 text-[10px] mt-0.5">{errors.invoiceEmail}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Invoice Mobile <span className="text-red-500">*</span></label>
              <input value={billing.invoiceMobile} onChange={e => setBilling({ invoiceMobile: e.target.value.replace(/\D/g, '').slice(0, 10) })} className={inputClass('invoiceMobile')} />
              {errors.invoiceMobile && <p className="text-red-500 text-[10px] mt-0.5">{errors.invoiceMobile}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <button onClick={onPrev} className="px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 text-gray-600 hover:bg-gray-100 transition-all">
          <ArrowLeft size={14} /> Back
        </button>
        <button onClick={() => { if (validate()) onNext() }} className="px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-1.5 bg-orange-500 text-white hover:bg-orange-600 transition-all">
          Continue <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

function StepCoupon({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const { coupon, plan, setCouponCode, setCouponValidated, setCouponError, clearCoupon } = useCheckoutStore()
  const [validating, setValidating] = useState(false)

  const handleValidate = async () => {
    if (!coupon.code.trim()) return
    setValidating(true)
    try {
      const res = await api.post('/membership/coupon/validate', { code: coupon.code, planId: plan?.planId })
      const d = res.data?.data || res.data || res
      setCouponValidated(d)
    } catch (err: any) {
      setCouponError(err?.response?.data?.message || err?.message || 'Invalid coupon code')
    } finally {
      setValidating(false)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Coupon Code</h2>
      <p className="text-sm text-gray-500 mb-6">Have a discount coupon? Enter it below</p>

      <div className="max-w-md mb-6">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Percent size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={coupon.code} onChange={e => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Enter coupon code"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-orange-300 transition-colors" />
          </div>
          <button onClick={handleValidate} disabled={!coupon.code.trim() || validating}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1">
            {validating ? <Loader2 size={14} className="animate-spin" /> : null}
            Apply
          </button>
          {coupon.validated && (
            <button onClick={clearCoupon} className="px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-all">
              <X size={14} />
            </button>
          )}
        </div>

        {coupon.error && (
          <div className="mt-3 flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg text-sm">
            <AlertCircle size={14} /> {coupon.error}
          </div>
        )}

        {coupon.validated && (
          <div className="mt-3 flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2 rounded-lg text-sm">
            <CheckCircle2 size={14} />
            {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}% off` : `${formatPrice(coupon.discountValue!)} off`}
            {coupon.maxDiscount ? ` (max ${formatPrice(coupon.maxDiscount)})` : ''}
          </div>
        )}

        <p className="text-xs text-gray-400 mt-2">Coupon codes are case-insensitive</p>
      </div>

      <div className="flex items-center justify-between">
        <button onClick={onPrev} className="px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 text-gray-600 hover:bg-gray-100 transition-all">
          <ArrowLeft size={14} /> Back
        </button>
        <button onClick={onNext} className="px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-1.5 bg-orange-500 text-white hover:bg-orange-600 transition-all">
          Skip {coupon.validated ? '(Applied)' : ''} <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

function StepReferral({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const { referral, rmCode, setReferralCode, setReferralValidated, setReferralError, clearReferral, setRmCode } = useCheckoutStore()
  const [validating, setValidating] = useState(false)

  const handleValidate = async () => {
    if (!referral.code.trim()) return
    setValidating(true)
    try {
      const res = await api.post('/membership/referral/validate', { code: referral.code })
      const d = res.data?.data || res.data || res
      setReferralValidated(d)
    } catch (err: any) {
      setReferralError(err?.response?.data?.message || err?.message || 'Invalid referral code')
    } finally {
      setValidating(false)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Referral & Relationship Manager</h2>
      <p className="text-sm text-gray-500 mb-6">Enter referral and RM codes if you have them</p>

      <div className="max-w-md mb-6">
        <label className="block text-xs font-semibold text-gray-600 mb-1">Referral Code</label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Gift size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={referral.code} onChange={e => setReferralCode(e.target.value.toUpperCase())}
              placeholder="Enter referral code"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-orange-300 transition-colors" />
          </div>
          <button onClick={handleValidate} disabled={!referral.code.trim() || validating}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1">
            {validating ? <Loader2 size={14} className="animate-spin" /> : null}
            Apply
          </button>
          {referral.validated && (
            <button onClick={clearReferral} className="px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-all">
              <X size={14} />
            </button>
          )}
        </div>

        {referral.error && (
          <div className="mt-3 flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg text-sm">
            <AlertCircle size={14} /> {referral.error}
          </div>
        )}

        {referral.validated && referral.referrerName && (
          <div className="mt-3 flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2 rounded-lg text-sm">
            <User size={14} /> Referred by <strong>{referral.referrerName}</strong>
          </div>
        )}
      </div>

      <div className="max-w-md mb-6">
        <label className="block text-xs font-semibold text-gray-600 mb-1">Relationship Manager Code (Optional)</label>
        <div className="relative">
          <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={rmCode} onChange={e => setRmCode(e.target.value.toUpperCase())}
            placeholder="Enter RM code"
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-orange-300 transition-colors" />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button onClick={onPrev} className="px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 text-gray-600 hover:bg-gray-100 transition-all">
          <ArrowLeft size={14} /> Back
        </button>
        <button onClick={onNext} className="px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-1.5 bg-orange-500 text-white hover:bg-orange-600 transition-all">
          Continue <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

function StepOrderSummary({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const { plan, tier, coupon, referral, billing } = useCheckoutStore()
  const { price, discount, gst, total, savings, renewalAmount } = usePrice()

  if (!plan) return null
  const tierLabel = TIER_OPTIONS.find(t => t.id === tier)

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Order Summary</h2>
      <p className="text-sm text-gray-500 mb-6">Review your order before proceeding</p>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="p-4 rounded-xl border border-gray-200 bg-white">
            <h3 className="font-bold text-gray-900 text-sm mb-3">Plan Details</h3>
            <div className="flex items-center gap-2 mb-2">
              {(() => {
                const meta = PLANS_META[plan.name.replace(/\s/g, '_')] || PLANS_META.Trade_Start
                const Icon = meta.icon
                return <Icon size={16} style={{ color: meta.color }} />
              })()}
              <span className="font-bold text-gray-900">{plan.name}</span>
              {tierLabel && <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">{tierLabel.label}</span>}
            </div>
            <div className="text-sm text-gray-500 space-y-1">
              <p>Duration: {tier === 'A' ? '1 Year' : tier === 'B' ? '2 Years' : '3 Years'}</p>
              <p>Auto-renews at the end of the term at the then-prevailing price</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-gray-200 bg-white">
            <h3 className="font-bold text-gray-900 text-sm mb-2">Included Features</h3>
            <p className="text-xs text-gray-400 mb-2">{plan.features.length} features included</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {(plan.features as string[]).map((f, fi) => (
                <div key={fi} className="flex items-center gap-1.5 text-gray-600 text-xs">
                  <CheckCircle2 size={10} className="text-green-500 shrink-0" /> {f}
                </div>
              ))}
            </div>
          </div>

          {billing.gstBilling && (
            <div className="p-4 rounded-xl border border-gray-200 bg-white">
              <h3 className="font-bold text-gray-900 text-sm mb-2">Billing Info</h3>
              <p className="text-xs text-gray-600">{billing.invoiceName} | {billing.invoiceEmail} | {billing.invoiceMobile}</p>
              <p className="text-xs text-gray-500 mt-1">{billing.address}, {billing.city}, {billing.state} - {billing.pincode}</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="p-5 rounded-xl border border-gray-200 bg-white sticky top-4">
            <h3 className="font-bold text-gray-900 text-sm mb-3">Price Breakdown</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between text-gray-600">
                <span>Plan Price ({tierLabel?.label})</span>
                <span className="font-semibold">{formatPrice(price)}</span>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between text-green-600">
                  <span>Coupon Discount</span>
                  <span className="font-semibold">-{formatPrice(discount)}</span>
                </div>
              )}
              {referral.validated && (
                <div className="flex items-center justify-between text-green-600">
                  <span>Referral Benefit</span>
                  <span className="font-semibold">{referral.rewardAmount ? formatPrice(referral.rewardAmount) : '—'}</span>
                </div>
              )}
              {billing.gstBilling && (
                <div className="flex items-center justify-between text-gray-600">
                  <span>GST (18%)</span>
                  <span className="font-semibold">{formatPrice(gst)}</span>
                </div>
              )}
              <hr className="border-gray-200" />
              <div className="flex items-center justify-between text-gray-900 font-bold text-base">
                <span>Grand Total</span>
                <span>{formatPrice(total)}</span>
              </div>
              {savings > 0 && (
                <div className="flex items-center justify-between text-green-600 text-xs">
                  <span>You Save</span>
                  <span className="font-semibold">{formatPrice(savings)}</span>
                </div>
              )}
              <hr className="border-gray-200" />
              <div className="flex items-center justify-between text-gray-400 text-xs">
                <span>Renewal Amount</span>
                <span>{formatPrice(renewalAmount)}/year</span>
              </div>
              <div className="flex items-center justify-between text-gray-400 text-xs">
                <span>Membership Start</span>
                <span>{new Date().toLocaleDateString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between text-gray-400 text-xs">
                <span>Membership Expiry</span>
                <span>{new Date(Date.now() + (tier === 'A' ? 365 : tier === 'B' ? 730 : 1095) * 86400000).toLocaleDateString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-6">
        <button onClick={onPrev} className="px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 text-gray-600 hover:bg-gray-100 transition-all">
          <ArrowLeft size={14} /> Back
        </button>
        <button onClick={onNext} className="px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-1.5 bg-orange-500 text-white hover:bg-orange-600 transition-all">
          Continue to Terms <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

function StepTerms({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const { terms, setTerms } = useCheckoutStore()

  const allChecked = terms.membership && terms.refund && terms.privacy && terms.seller

  const items = [
    { key: 'membership' as const, label: 'I accept the Membership Terms & Conditions' },
    { key: 'refund' as const, label: 'I accept the Refund Policy' },
    { key: 'privacy' as const, label: 'I accept the Privacy Policy' },
    { key: 'seller' as const, label: 'I accept the Seller Agreement' },
  ]

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Terms & Agreements</h2>
      <p className="text-sm text-gray-500 mb-6">Please accept the following to proceed</p>

      <div className="space-y-3 mb-6 max-w-lg">
        {items.map(item => (
          <label key={item.key} className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white cursor-pointer hover:border-gray-300 transition-all">
            <input type="checkbox" checked={terms[item.key]}
              onChange={e => setTerms({ [item.key]: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-400" />
            <span className="text-sm text-gray-700 font-medium">{item.label}</span>
          </label>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button onClick={onPrev} className="px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 text-gray-600 hover:bg-gray-100 transition-all">
          <ArrowLeft size={14} /> Back
        </button>
        <button onClick={onNext} disabled={!allChecked}
          className="px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-1.5 bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
          Continue <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

function StepPayment({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const { paymentMethod, setPaymentMethod } = useCheckoutStore()

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Payment Method</h2>
      <p className="text-sm text-gray-500 mb-6">Select your preferred payment method</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {PAYMENT_METHODS.map(method => {
          const Icon = method.icon
          const selected = paymentMethod === method.id
          return (
            <button key={method.id} onClick={() => setPaymentMethod(method.id)}
              className={`relative p-4 rounded-xl border text-left transition-all ${
                selected ? 'border-orange-400 ring-2 ring-orange-100' : 'border-gray-200 bg-white hover:border-gray-300'
              } ${method.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon size={18} style={{ color: method.color }} />
                <span className="font-semibold text-sm text-gray-900">{method.label}</span>
              </div>
              {method.disabled && (
                <span className="inline-block px-2 py-0.5 rounded text-[9px] font-bold bg-gray-100 text-gray-400 uppercase">Coming Soon</span>
              )}
              {selected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                  <CheckCircle2 size={12} className="text-white" />
                </div>
              )}
            </button>
          )
        })}
      </div>

      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 mb-6">
        <Info size={16} className="text-amber-500 mt-0.5 shrink-0" />
        <div className="text-sm text-amber-800">
          <p className="font-semibold mb-0.5">Payment Gateway — Coming Soon</p>
          <p className="text-amber-700">Payment integration will be available in the next phase. For now, selecting a method is for preview purposes only.</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button onClick={onPrev} className="px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 text-gray-600 hover:bg-gray-100 transition-all">
          <ArrowLeft size={14} /> Back
        </button>
        <button onClick={onNext} disabled={!paymentMethod}
          className="px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-1.5 bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
          Continue <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

function StepConfirmation({ onPrev }: { onPrev: () => void }) {
  const { plan, tier, orderCreated, orderId, setOrderCreated, setLoading, loading } = useCheckoutStore()
  const { total } = usePrice()
  const router = useRouter()

  const handleProceed = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.post('/membership/order', {
        planId: plan?.planId, planTier: tier, duration: tier === 'A' ? 1 : tier === 'B' ? 2 : 3,
      })
      const order = res.data?.data || res.data || res
      setOrderCreated(order.orderId || 'pending')
      router.push(`/subscription/success?plan=${plan?.name || 'Plan'}&invoice=${order.orderId || ''}`)
    } catch {
      router.push(`/subscription/failed?reason=Failed to create order. Please try again.`)
    } finally {
      setLoading(false)
    }
  }, [plan, tier, router, setOrderCreated, setLoading])

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Confirm & Proceed</h2>
      <p className="text-sm text-gray-500 mb-6">Review your selections one last time</p>

      <div className="max-w-lg mx-auto space-y-3 mb-8">
        <div className="p-4 rounded-xl border border-gray-200 bg-white flex items-center justify-between">
          <span className="text-sm text-gray-600">Plan</span>
          <span className="font-bold text-gray-900">{plan?.name} — {TIER_OPTIONS.find(t => t.id === tier)?.label}</span>
        </div>
        <div className="p-4 rounded-xl border border-gray-200 bg-white flex items-center justify-between">
          <span className="text-sm text-gray-600">Total Amount</span>
          <span className="font-bold text-lg text-orange-600">{formatPrice(total)}</span>
        </div>
        <div className="p-4 rounded-xl border border-gray-200 bg-white flex items-center justify-between">
          <span className="text-sm text-gray-600">Payment Method</span>
          <span className="font-semibold text-gray-900">{PAYMENT_METHODS.find(m => m.id === useCheckoutStore.getState().paymentMethod)?.label || '—'}</span>
        </div>
        <div className="p-4 rounded-xl border border-gray-200 bg-white">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <Lock size={14} className="text-gray-400" />
            Your payment is processed securely. No payment will be charged until the gateway is active.
          </label>
        </div>
      </div>

      {orderCreated && (
        <div className="max-w-lg mx-auto mb-6 p-4 rounded-xl bg-green-50 border border-green-200 flex items-center gap-3">
          <CheckCircle2 size={18} className="text-green-500 shrink-0" />
          <div className="text-sm text-green-800">
            <p className="font-semibold">Order Reserved</p>
            <p className="text-green-700">Order ID: {orderId}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-3">
        <button onClick={onPrev} disabled={loading}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-all">
          <ArrowLeft size={14} /> Back
        </button>
        <button onClick={handleProceed} disabled={loading || orderCreated}
          className="px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-2 bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
          {orderCreated ? 'Order Placed' : 'Proceed to Payment'}
        </button>
      </div>
    </div>
  )
}

// Main component
export default function PurchaseClient() {
  const router = useRouter()
  const { currentStep, nextStep, prevStep } = useCheckoutStore()
  const { user, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      const params = new URLSearchParams({ next: window.location.pathname + window.location.search })
      router.push(`/login?${params}`)
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) return null

  const steps = [
    { component: StepPlanSelection, props: { onNext: nextStep } },
    { component: StepCompanyInfo, props: { onNext: nextStep, onPrev: prevStep } },
    { component: StepBillingDetails, props: { onNext: nextStep, onPrev: prevStep } },
    { component: StepCoupon, props: { onNext: nextStep, onPrev: prevStep } },
    { component: StepReferral, props: { onNext: nextStep, onPrev: prevStep } },
    { component: StepOrderSummary, props: { onNext: nextStep, onPrev: prevStep } },
    { component: StepTerms, props: { onNext: nextStep, onPrev: prevStep } },
    { component: StepPayment, props: { onNext: nextStep, onPrev: prevStep } },
    { component: StepConfirmation, props: { onPrev: prevStep } },
  ]

  const StepComponent = steps[currentStep - 1].component
  const stepProps = steps[currentStep - 1].props

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-900">Subscription Purchase</h1>
          <p className="text-sm text-gray-500">Step {currentStep} of 9 — {STEP_LABELS[currentStep - 1]}</p>
        </div>

        <StepProgress current={currentStep} total={9} />

        <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm">
          <StepComponent {...(stepProps as any)} />
        </motion.div>

        <p className="text-center text-[10px] text-gray-400 mt-4">
          By proceeding, you agree to our Terms of Service and Privacy Policy. All prices are in INR.
        </p>
      </div>
    </div>
  )
}
