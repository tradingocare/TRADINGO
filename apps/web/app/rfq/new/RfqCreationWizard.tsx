'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Package, Truck, ClipboardCheck, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCreateRfq } from '@/hooks'
import type { Rfq } from '@/lib/api/types'

const INPUT_CLASS = 'w-full px-4 py-3 rounded-xl text-white text-sm placeholder-white/25 focus:outline-none transition-all duration-200'

const inputStyle = (hasError: boolean = false) => ({
  background: 'rgba(255,255,255,0.06)',
  border: hasError ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.1)',
})

const btnPrimary = { background: 'linear-gradient(135deg, #FF4D00, #FF7A3D)', color: '#fff', boxShadow: '0 4px 16px rgba(255,77,0,0.3)' }

const btnSecondary = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }

import { CATALOG_CATEGORIES } from '@/data/catalog-data'

const CATEGORIES = CATALOG_CATEGORIES.map(c => c.name)

const UNITS = [
  "pieces", "kg", "tonnes", "meters", "liters", "boxes", "sets", "pairs",
  "rolls", "bundles", "cartons", "units"
]

const TIMELINES = [
  "ASAP (Ready stock)", "Within 1 week", "Within 2 weeks",
  "Within 1 month", "Within 2 months", "Flexible"
]

const STATES_UTS = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
]

interface RfqForm {
  productName: string
  category: string
  description: string
  specifications: string
  quantity: string
  unit: string
  budgetMin: string
  budgetMax: string
  deliveryCity: string
  deliveryState: string
  deliveryTimeline: string
  urgency: 'low' | 'normal' | 'high' | 'urgent'
  agreedToTerms: boolean
}

const initialForm: RfqForm = {
  productName: '',
  category: '',
  description: '',
  specifications: '',
  quantity: '',
  unit: '',
  budgetMin: '',
  budgetMax: '',
  deliveryCity: '',
  deliveryState: '',
  deliveryTimeline: '',
  urgency: 'normal',
  agreedToTerms: false,
}

const urgencyOptions = [
  { value: 'low' as const, label: "I'm exploring", desc: 'No rush, just browsing' },
  { value: 'normal' as const, label: 'Standard procurement', desc: 'Regular business need' },
  { value: 'high' as const, label: 'Need soon', desc: 'Within a week or two' },
  { value: 'urgent' as const, label: 'Critical — within days', desc: 'Immediate requirement' },
]

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -80 : 80, opacity: 0 }),
}

export default function RfqCreationWizard() {
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [form, setForm] = useState<RfqForm>(initialForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const router = useRouter()
  const createRfq = useCreateRfq()

  const update = (key: keyof RfqForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: '' }))
  }

  const validateStep1 = (): boolean => {
    const e: Record<string, string> = {}
    if (!form.productName.trim()) e.productName = 'Product name is required'
    else if (form.productName.trim().length < 3) e.productName = 'Minimum 3 characters'
    else if (form.productName.trim().length > 100) e.productName = 'Maximum 100 characters'
    if (!form.category) e.category = 'Please select a category'
    if (!form.description.trim()) e.description = 'Description is required'
    else if (form.description.trim().length < 20) e.description = 'Minimum 20 characters'
    else if (form.description.trim().length > 1000) e.description = 'Maximum 1000 characters'
    if (form.specifications.length > 500) e.specifications = 'Maximum 500 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validateStep2 = (): boolean => {
    const e: Record<string, string> = {}
    if (!form.quantity.trim()) e.quantity = 'Quantity is required'
    else if (Number(form.quantity) < 1) e.quantity = 'Minimum quantity is 1'
    if (!form.unit) e.unit = 'Please select a unit'
    if (!form.deliveryCity.trim()) e.deliveryCity = 'Delivery city is required'
    if (!form.deliveryState) e.deliveryState = 'Please select a state'
    if (!form.deliveryTimeline) e.deliveryTimeline = 'Please select a timeline'
    if (form.budgetMin && form.budgetMax && Number(form.budgetMin) > Number(form.budgetMax)) {
      e.budgetMax = 'Max must be greater than min'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const goNext = () => {
    if (step === 1 && validateStep1()) {
      setDirection(1)
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      setDirection(1)
      setStep(3)
    }
  }

  const goBack = () => {
    setDirection(-1)
    setStep(s => s - 1)
  }

  const handleSubmit = async () => {
    if (!form.agreedToTerms) return
    try {
      await createRfq.mutateAsync({
        productName: form.productName.trim(),
        description: form.description.trim(),
        quantity: Number(form.quantity),
        unit: form.unit,
        city: form.deliveryCity.trim(),
        status: 'open' as const,
      } as Partial<Rfq>)
      router.push('/buyer/rfqs')
    } catch {
      setErrors({ submit: 'Failed to create RFQ. Please try again.' })
    }
  }

  const progress = ((step - 1) / 2) * 100

  const stepIcons = [
    { icon: Package, label: 'Product' },
    { icon: Truck, label: 'Delivery' },
    { icon: ClipboardCheck, label: 'Review' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Create RFQ</h1>
        <p className="text-white/40 text-sm">Post your requirement and get competitive quotes</p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {stepIcons.map((s, i) => {
            const num = i + 1
            const done = step > num
            const current = step === num
            return (
              <div key={i} className="flex items-center">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300"
                  style={{
                    background: done
                      ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                      : current
                      ? 'linear-gradient(135deg, #FF4D00, #FF7A3D)'
                      : 'rgba(255,255,255,0.06)',
                    border: done || current ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    color: done || current ? '#fff' : 'rgba(255,255,255,0.3)',
                  }}
                >
                  {done ? '✓' : num}
                </div>
                <span className={`ml-2 text-xs hidden sm:inline ${current ? 'text-white' : 'text-white/30'}`}>
                  {s.label}
                </span>
                {i < 2 && (
                  <div className="w-12 sm:w-20 h-[2px] mx-2 sm:mx-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg, #FF4D00, #FF7A3D)' }}
                      initial={{ width: '0%' }}
                      animate={{ width: `${Math.max(0, ((step - 1) / 2) * 100 - (i * 50))}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Steps */}
      <AnimatePresence mode="wait" custom={direction}>
        {step === 1 && (
          <motion.div
            key="step1"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <div
              className="rounded-2xl p-6 sm:p-8"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.09)',
                backdropFilter: 'blur(24px)',
              }}
            >
              <h2 className="text-lg font-semibold text-white mb-1">Product Details</h2>
              <p className="text-white/30 text-sm mb-6">Tell us what you need</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-white/60 text-xs mb-1.5">Product Name *</label>
                  <input
                    className={INPUT_CLASS}
                    style={inputStyle(!!errors.productName)}
                    value={form.productName}
                    onChange={e => update('productName', e.target.value)}
                    placeholder="e.g. MS Steel Pipes, TMT Bars, Industrial Bearings"
                    maxLength={100}
                  />
                  {errors.productName && <p className="text-red-400 text-xs mt-1">{errors.productName}</p>}
                </div>

                <div>
                  <label className="block text-white/60 text-xs mb-1.5">Category *</label>
                  <select
                    className={INPUT_CLASS}
                    style={{ ...inputStyle(!!errors.category), appearance: 'none' }}
                    value={form.category}
                    onChange={e => update('category', e.target.value)}
                  >
                    <option value="" style={{ background: '#1a0118' }}>Select category</option>
                    {CATEGORIES.map(c => (
                      <option key={c} value={c} style={{ background: '#1a0118' }}>{c}</option>
                    ))}
                  </select>
                  {errors.category && <p className="text-red-400 text-xs mt-1">{errors.category}</p>}
                </div>

                <div>
                  <label className="block text-white/60 text-xs mb-1.5">Description *</label>
                  <textarea
                    className={INPUT_CLASS}
                    style={{ ...inputStyle(!!errors.description), minHeight: '100px', resize: 'vertical' }}
                    value={form.description}
                    onChange={e => update('description', e.target.value)}
                    placeholder="Describe what you need in detail — material, grade, size, quality requirements..."
                    maxLength={1000}
                    rows={4}
                  />
                  <div className="flex justify-between mt-1">
                    {errors.description ? (
                      <p className="text-red-400 text-xs">{errors.description}</p>
                    ) : <span />}
                    <span className="text-white/20 text-xs">{form.description.length}/1000</span>
                  </div>
                </div>

                <div>
                  <label className="block text-white/60 text-xs mb-1.5">Technical Specifications (optional)</label>
                  <textarea
                    className={INPUT_CLASS}
                    style={{ ...inputStyle(!!errors.specifications), minHeight: '72px', resize: 'vertical' }}
                    value={form.specifications}
                    onChange={e => update('specifications', e.target.value)}
                    placeholder="e.g. Grade: IS 2062, Size: 25mm, Length: 6m, Quantity: 100 pieces"
                    maxLength={500}
                    rows={2}
                  />
                  <div className="flex justify-between mt-1">
                    <p className="text-white/20 text-xs">Technical specs help sellers quote accurately</p>
                    <span className="text-white/20 text-xs">{form.specifications.length}/500</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={goNext}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={btnPrimary}
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <div
              className="rounded-2xl p-6 sm:p-8"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.09)',
                backdropFilter: 'blur(24px)',
              }}
            >
              <h2 className="text-lg font-semibold text-white mb-1">Quantity & Delivery</h2>
              <p className="text-white/30 text-sm mb-6">How much and where do you need it?</p>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/60 text-xs mb-1.5">Quantity *</label>
                    <input
                      className={INPUT_CLASS}
                      style={inputStyle(!!errors.quantity)}
                      type="number"
                      min="1"
                      value={form.quantity}
                      onChange={e => update('quantity', e.target.value)}
                      placeholder="e.g. 100"
                    />
                    {errors.quantity && <p className="text-red-400 text-xs mt-1">{errors.quantity}</p>}
                  </div>
                  <div>
                    <label className="block text-white/60 text-xs mb-1.5">Unit *</label>
                    <select
                      className={INPUT_CLASS}
                      style={{ ...inputStyle(!!errors.unit), appearance: 'none' }}
                      value={form.unit}
                      onChange={e => update('unit', e.target.value)}
                    >
                      <option value="" style={{ background: '#1a0118' }}>Select unit</option>
                      {UNITS.map(u => (
                        <option key={u} value={u} style={{ background: '#1a0118' }}>{u}</option>
                      ))}
                    </select>
                    {errors.unit && <p className="text-red-400 text-xs mt-1">{errors.unit}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/60 text-xs mb-1.5">Budget Min (optional)</label>
                    <input
                      className={INPUT_CLASS}
                      style={inputStyle(!!errors.budgetMin)}
                      type="number"
                      min="0"
                      value={form.budgetMin}
                      onChange={e => update('budgetMin', e.target.value)}
                      placeholder="₹ Min (optional)"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-xs mb-1.5">Budget Max (optional)</label>
                    <input
                      className={INPUT_CLASS}
                      style={inputStyle(!!errors.budgetMax)}
                      type="number"
                      min="0"
                      value={form.budgetMax}
                      onChange={e => update('budgetMax', e.target.value)}
                      placeholder="₹ Max (optional)"
                    />
                    {errors.budgetMax && <p className="text-red-400 text-xs mt-1">{errors.budgetMax}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-white/60 text-xs mb-1.5">Delivery City *</label>
                  <input
                    className={INPUT_CLASS}
                    style={inputStyle(!!errors.deliveryCity)}
                    value={form.deliveryCity}
                    onChange={e => update('deliveryCity', e.target.value)}
                    placeholder="e.g. Mumbai, Delhi, Patna"
                  />
                  {errors.deliveryCity && <p className="text-red-400 text-xs mt-1">{errors.deliveryCity}</p>}
                </div>

                <div>
                  <label className="block text-white/60 text-xs mb-1.5">Delivery State *</label>
                  <select
                    className={INPUT_CLASS}
                    style={{ ...inputStyle(!!errors.deliveryState), appearance: 'none' }}
                    value={form.deliveryState}
                    onChange={e => update('deliveryState', e.target.value)}
                  >
                    <option value="" style={{ background: '#1a0118' }}>Select state</option>
                    {STATES_UTS.map(s => (
                      <option key={s} value={s} style={{ background: '#1a0118' }}>{s}</option>
                    ))}
                  </select>
                  {errors.deliveryState && <p className="text-red-400 text-xs mt-1">{errors.deliveryState}</p>}
                </div>

                <div>
                  <label className="block text-white/60 text-xs mb-1.5">Timeline *</label>
                  <select
                    className={INPUT_CLASS}
                    style={{ ...inputStyle(!!errors.deliveryTimeline), appearance: 'none' }}
                    value={form.deliveryTimeline}
                    onChange={e => update('deliveryTimeline', e.target.value)}
                  >
                    <option value="" style={{ background: '#1a0118' }}>Select timeline</option>
                    {TIMELINES.map(t => (
                      <option key={t} value={t} style={{ background: '#1a0118' }}>{t}</option>
                    ))}
                  </select>
                  {errors.deliveryTimeline && <p className="text-red-400 text-xs mt-1">{errors.deliveryTimeline}</p>}
                </div>

                <div>
                  <label className="block text-white/60 text-xs mb-2">Urgency *</label>
                  <div className="grid grid-cols-2 gap-3">
                    {urgencyOptions.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => update('urgency', opt.value)}
                        className="p-3 rounded-xl text-left transition-all duration-200"
                        style={{
                          background: form.urgency === opt.value
                            ? 'rgba(255,77,0,0.12)'
                            : 'rgba(255,255,255,0.04)',
                          border: form.urgency === opt.value
                            ? '1px solid rgba(255,77,0,0.4)'
                            : '1px solid rgba(255,255,255,0.08)',
                        }}
                      >
                        <span className="block text-sm font-medium" style={{ color: form.urgency === opt.value ? '#FF7A3D' : 'rgba(255,255,255,0.8)' }}>
                          {opt.label}
                        </span>
                        <span className="block text-xs text-white/30 mt-0.5">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={goBack}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.02]"
                style={btnSecondary}
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={goNext}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={btnPrimary}
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <div
              className="rounded-2xl p-6 sm:p-8"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.09)',
                backdropFilter: 'blur(24px)',
              }}
            >
              <h2 className="text-lg font-semibold text-white mb-1">Review & Submit</h2>
              <p className="text-white/30 text-sm mb-6">Please review your RFQ details</p>

              <div className="space-y-3">
                {[
                  { label: 'Product', value: form.productName },
                  { label: 'Category', value: form.category },
                  { label: 'Description', value: form.description },
                  { label: 'Specs', value: form.specifications || 'None provided' },
                  { label: 'Quantity', value: `${form.quantity} ${form.unit}` },
                  {
                    label: 'Budget',
                    value: form.budgetMin && form.budgetMax
                      ? `₹${form.budgetMin} - ₹${form.budgetMax}`
                      : form.budgetMin
                      ? `From ₹${form.budgetMin}`
                      : form.budgetMax
                      ? `Up to ₹${form.budgetMax}`
                      : 'Open to quotes'
                  },
                  { label: 'Delivery', value: `${form.deliveryCity}, ${form.deliveryState}` },
                  { label: 'Timeline', value: form.deliveryTimeline },
                  { label: 'Urgency', value: form.urgency.charAt(0).toUpperCase() + form.urgency.slice(1) },
                ].map(item => (
                  <div
                    key={item.label}
                    className="flex justify-between items-start py-2.5"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <span className="text-white/40 text-sm">{item.label}</span>
                    <span className="text-white text-sm text-right max-w-[60%]">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={form.agreedToTerms}
                  onChange={e => update('agreedToTerms', e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded accent-[#FF4D00]"
                />
                <span className="text-white/50 text-sm group-hover:text-white/70 transition-colors">
                  I confirm this RFQ is genuine and I intend to proceed with procurement.
                </span>
              </label>
            </div>

            {errors.submit && (
              <p className="text-red-400 text-sm mt-3 text-center">{errors.submit}</p>
            )}

            <div className="flex justify-between mt-6">
              <button
                onClick={goBack}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.02]"
                style={btnSecondary}
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={!form.agreedToTerms || createRfq.isPending}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={btnPrimary}
              >
                {createRfq.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Posting your RFQ...
                  </>
                ) : (
                  <>Post RFQ →</>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
