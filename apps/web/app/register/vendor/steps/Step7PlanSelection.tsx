'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Star, Zap, Crown, Shield, Tag, UserCheck, AlertCircle, AlertTriangle } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import StepCard from '../components/StepCard'
import api from '@/lib/api/client'
import type { VendorRegistrationState, PlanSelectionForm } from '@/types/vendor-registration'

const btnPrimary = { background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', color: '#fff', boxShadow: '0 4px 16px rgba(245, 158, 11, 0.3)' }
const btnSecondary = { backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'rgba(255,255,255,0.8)' }

const PLANS = [
  {
    id: 'trade_start',
    name: 'Trade Start',
    price: '₹0',
    period: '/year',
    badge: 'FREE Forever',
    icon: <Star size={18} />,
    features: ['1 Product', '5 RFQs/month', 'Basic Profile', 'GOCASH Earning'],
    highlight: false,
  },
  {
    id: 'trade_basic',
    name: 'Trade Basic',
    price: '₹6,000',
    period: '/year',
    badge: null,
    icon: <Zap size={18} />,
    features: ['25 Products', '20 RFQs/month', 'Verified Badge', 'Basic AI Matching', 'Chat', 'GST Invoice', 'GOCASH'],
    highlight: false,
  },
  {
    id: 'trade_pro',
    name: 'Trade Pro',
    price: '₹14,000',
    period: '/year',
    badge: 'Recommended',
    icon: <Crown size={18} />,
    features: ['100 Products', '50 RFQs/month', 'Priority AI', 'GO DIGITAL', 'Analytics', 'Response Badge', 'GOCASH 2x', 'Dedicated RM'],
    highlight: true,
  },
  {
    id: 'trade_elite',
    name: 'Trade Elite',
    price: '₹40,000',
    period: '/year',
    badge: 'Premium',
    icon: <Crown size={18} />,
    features: ['Unlimited Products', 'Unlimited RFQs', 'TRADGO Elite', 'GO DIGITAL Featured', 'Price Lock', 'Advanced Analytics', 'GOCASH 3x', 'Dedicated RM'],
    highlight: false,
  },
]

interface Props {
  allData: VendorRegistrationState
  onNext: (data: PlanSelectionForm) => void
  onBack: () => void
  onClearDraft: () => void
}

export default function Step7PlanSelection({ allData, onNext, onBack, onClearDraft }: Props) {
  const [selectedPlan, setSelectedPlan] = useState('trade_start')
  const [referralCode, setReferralCode] = useState('')
  const [rmCode, setRmCode] = useState('')
  const [referralApplied, setReferralApplied] = useState(false)
  const [rmApplied, setRmApplied] = useState(false)
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [agreedPrivacy, setAgreedPrivacy] = useState(false)
  const [agreedAccuracy, setAgreedAccuracy] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleReferral = () => {
    const code = referralCode.trim()
    if (code.length >= 4) {
      setReferralApplied(true)
    }
  }

  const handleRmCode = (val: string) => {
    const formatted = val.toUpperCase()
    setRmCode(formatted)
    if (/^RM\d{5}$/.test(formatted)) {
      setRmApplied(true)
    } else {
      setRmApplied(false)
    }
  }

  const allChecked = agreedTerms && agreedPrivacy && agreedAccuracy

  const bi = allData.businessIdentity || {}
  const cc = allData.contactCredentials || {}
  const gst = allData.gst || {}
  const bp = allData.businessProfile || {}
  const bd = allData.bankDetails || {}

  const planName = PLANS.find(p => p.id === selectedPlan)?.name || 'Not selected'
  const maskedPhone = (cc.mobileNumber || '').replace(/.(?=.{4})/g, '●').slice(-4)
  const maskedEmail = (() => {
    const email = cc.email || ''
    const [user, domain] = email.split('@')
    if (!domain) return email
    const masked = user.length > 2 ? user[0] + '●'.repeat(user.length - 2) + user.slice(-1) : '●'.repeat(user.length)
    return `${masked}@${domain}`
  })()
  const maskedPan = (allData.pan?.panNumber || '').replace(/.(?=.{4})/g, '●').slice(-4)
  const maskedAccount = (bd.accountNumber || '').replace(/.(?=.{4})/g, '●').slice(-4)

  const handleSubmit = async () => {
    if (!allChecked) return
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      await api.post('/auth/register/vendor', {
        businessName: bi.businessName,
        tradeName: bi.tradeName,
        businessType: bi.businessType,
        sellerType: bi.sellerType,
        yearEstablished: bi.yearEstablished,
        totalEmployees: bi.totalEmployees,
        annualTurnover: bi.annualTurnover,
        website: bi.website,
        ownerName: cc.ownerName,
        designation: cc.designation,
        email: cc.email,
        mobileNumber: cc.mobileNumber,
        alternateMobile: cc.alternateMobile,
        password: cc.password,
        panNumber: (allData.pan || {}).panNumber,
        panHolderName: (allData.pan || {}).panHolderName,
        dateOfBirth: (allData.pan || {}).dateOfBirth,
        hasGst: gst.hasGst || false,
        gstNumber: gst.gstNumber,
        gstExemptReason: gst.gstExemptReason,
        description: bp.description,
        tagline: bp.tagline,
        primaryCategory: bp.primaryCategory,
        secondaryCategories: bp.secondaryCategories || [],
        productTypes: bp.productTypes,
        moqRange: bp.moqRange,
        supplyCapacity: bp.supplyCapacity,
        leadTime: bp.leadTime,
        exportCapability: bp.exportCapability || false,
        exportCountries: bp.exportCountries,
        addressLine1: bp.addressLine1,
        addressLine2: bp.addressLine2,
        city: bp.city,
        district: bp.district,
        state: bp.state,
        pincode: bp.pincode,
        accountHolderName: bd.accountHolderName,
        accountNumber: bd.accountNumber,
        ifscCode: bd.ifscCode,
        accountType: bd.accountType,
        planId: selectedPlan,
        referralCode: referralCode.trim() || undefined,
        rmCode: rmCode.trim() || undefined,
      })
      setIsSuccess(true)
      onClearDraft()
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message || err?.message || 'Registration failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <StepCard
        icon={<CheckCircle2 size={20} style={{ color: '#4ade80' }} />}
        title="Registration Complete!"
        subtitle="Welcome to TRADINGO"
      >
        <div className="flex flex-col items-center py-8 gap-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(74,222,128,0.1)', border: '2px solid rgba(74,222,128,0.3)' }}
          >
            <CheckCircle2 size={40} className="text-green-400" />
          </motion.div>
          <div className="text-center">
            <h3 className="text-white font-bold text-xl mb-2">Welcome to TRADINGO!</h3>
            <p className="text-white/50 text-sm leading-relaxed max-w-sm">
              Your account is under review (1-2 working days). We&apos;ll send you a confirmation via email and SMS.
            </p>
          </div>
          <div
            className="rounded-xl p-4 mt-4"
            style={{ background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.15)' }}
          >
            <p className="text-white/60 text-xs text-center">
              Meanwhile, check out our <span className="text-[#fbbf24] font-semibold">Help Center</span> for seller tips
            </p>
          </div>
        </div>
      </StepCard>
    )
  }

  return (
    <StepCard
      icon={<Star size={20} style={{ color: '#f59e0b' }} />}
      title="Plan Selection & Confirmation"
      subtitle="Choose your plan and confirm details"
    >
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-3">Choose Your Plan</p>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
            {PLANS.map(plan => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlan(plan.id)}
                className="snap-center shrink-0 w-[200px] rounded-xl p-4 text-left transition-all duration-200 relative"
                style={{
                  background: selectedPlan === plan.id
                    ? 'rgba(245, 158, 11, 0.08)'
                    : 'var(--bg-elevated)',
                  border: selectedPlan === plan.id
                    ? '1px solid rgba(245, 158, 11, 0.5)'
                    : plan.highlight
                      ? '1px solid rgba(245, 158, 11, 0.15)'
                      : '1px solid var(--border-color)',
                  boxShadow: selectedPlan === plan.id ? '0 0 20px rgba(245, 158, 11, 0.15)' : 'none',
                }}
              >
                {plan.badge && (
                  <span
                    className="absolute -top-2.5 left-3 px-2 py-0.5 rounded-full text-[9px] font-bold"
                    style={{
                      background: plan.badge === 'Recommended'
                        ? 'linear-gradient(135deg, #f59e0b, #fbbf24)'
                        : plan.badge === 'Premium'
                          ? 'linear-gradient(135deg, #7c3aed, #a78bfa)'
                          : 'rgba(74,222,128,0.15)',
                      color: plan.badge === 'FREE Forever' ? '#4ade80' : '#fff',
                    }}
                  >
                    {plan.badge}
                  </span>
                )}
                <div className="flex items-center gap-2 mb-2 mt-1" style={{ color: selectedPlan === plan.id ? '#fbbf24' : 'rgba(255,255,255,0.35)' }}>
                  {plan.icon}
                </div>
                <p className="text-white font-bold text-sm">{plan.name}</p>
                <div className="flex items-baseline gap-0.5 mb-3">
                  <span className="text-white font-black text-lg">{plan.price}</span>
                  <span className="text-white/30 text-xs">{plan.period}</span>
                </div>
                <ul className="space-y-1.5">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-1.5 text-white/45 text-[10px]">
                      <CheckCircle2 size={10} className="shrink-0" style={{ color: selectedPlan === plan.id ? '#fbbf24' : 'rgba(255,255,255,0.2)' }} />
                      {f}
                    </li>
                  ))}
                </ul>
                {selectedPlan === plan.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: '#f59e0b' }}
                  >
                    <CheckCircle2 size={12} className="text-white" />
                  </motion.div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="h-px" style={{ backgroundColor: 'var(--bg-elevated)' }} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-white/70 text-xs font-semibold flex items-center gap-1 mb-1.5">
              Referral Code <span className="text-white/25 text-[9px] font-normal">(optional)</span>
            </label>
            <div className="flex gap-2">
              <input
                className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder-white/25 focus:outline-none transition-all duration-200"
                style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}
                value={referralCode}
                onChange={e => { setReferralCode(e.target.value); setReferralApplied(false) }}
                placeholder="Enter code"
              />
              <button
                type="button"
                onClick={handleReferral}
                className="px-3 py-3 rounded-xl text-xs font-semibold transition-all"
                style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#fbbf24' }}
              >
                Apply
              </button>
            </div>
            <AnimatePresence>
              {referralApplied && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-green-400 text-[10px] mt-1 flex items-center gap-1"
                >
                  ✓ Code applied: +500 GOCASH bonus
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div>
            <label className="text-white/70 text-xs font-semibold flex items-center gap-1 mb-1.5">
              RM Code <span className="text-white/25 text-[9px] font-normal">(optional)</span>
            </label>
            <input
              className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder-white/25 focus:outline-none transition-all duration-200"
              style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}
              value={rmCode}
              onChange={e => handleRmCode(e.target.value)}
              placeholder="RM + 5 digits"
              maxLength={7}
            />
            <AnimatePresence>
              {rmApplied && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-green-400 text-[10px] mt-1 flex items-center gap-1"
                >
                  ✓ RM assigned
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="h-px" style={{ backgroundColor: 'var(--bg-elevated)' }} />

        <div
          className="rounded-xl p-5"
          style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}
        >
          <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-4">Registration Summary</p>
          <div className="space-y-2.5">
            {[
              { label: 'Business Name', value: bi.businessName || '—' },
              { label: 'Business Type', value: bi.businessType ? bi.businessType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—' },
              { label: 'Seller Type', value: bi.sellerType ? bi.sellerType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—' },
              { label: 'Owner Name', value: cc.ownerName || '—' },
              { label: 'Mobile', value: maskedPhone ? `●●●●●${maskedPhone}` : '—' },
              { label: 'Email', value: maskedEmail || '—' },
              { label: 'PAN', value: maskedPan ? `●●●●●${maskedPan}` : '—' },
              { label: 'GST', value: gst.hasGst ? (gst.gstNumber || '—') : 'N/A' },
              { label: 'Category', value: bp.primaryCategory || '—' },
              { label: 'Location', value: bp.city && bp.state ? `${bp.city}, ${bp.state}` : '—' },
              { label: 'Bank Account', value: maskedAccount ? `●●●●●${maskedAccount}` : '—' },
              { label: 'Selected Plan', value: planName },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center">
                <span className="text-white/40 text-xs">{item.label}</span>
                <span className="text-white/70 text-xs font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {[
            { checked: agreedTerms, set: setAgreedTerms, text: "I agree to TRADINGO's Terms & Conditions and Seller Agreement" },
            { checked: agreedPrivacy, set: setAgreedPrivacy, text: "I agree to TRADINGO's Privacy Policy and consent to data processing" },
            { checked: agreedAccuracy, set: setAgreedAccuracy, text: "I confirm all information provided is accurate" },
          ].map((item, i) => (
            <label
              key={i}
              className="flex items-start gap-3 cursor-pointer group"
              onClick={() => item.set(!item.checked)}
            >
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200"
                style={{
                  background: item.checked ? 'linear-gradient(135deg, #f59e0b, #fbbf24)' : 'var(--bg-elevated)',
                  border: item.checked ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid var(--border-color)',
                }}
              >
                {item.checked && <CheckCircle2 size={12} className="text-white" />}
              </div>
              <span className="text-white/60 text-xs leading-relaxed group-hover:text-white/80 transition-colors">{item.text}</span>
            </label>
          ))}
        </div>

        {submitError && (
          <div className="p-3 rounded-xl flex items-start gap-2"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <AlertTriangle size={16} className="text-red-400 mt-0.5 shrink-0" />
            <p className="text-red-300 text-sm">{submitError}</p>
          </div>
        )}

        <div className="flex gap-3 mt-2">
          <button type="button" onClick={onBack}
            className="flex-1 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
            style={btnSecondary}>
            Back
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!allChecked || isSubmitting}
            className="flex-1 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2"
            style={{
              ...btnPrimary,
              opacity: !allChecked || isSubmitting ? 0.5 : 1,
              cursor: !allChecked || isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="xs" />
                Creating your account...
              </>
            ) : (
              'Complete Registration →'
            )}
          </button>
        </div>
      </div>
    </StepCard>
  )
}
