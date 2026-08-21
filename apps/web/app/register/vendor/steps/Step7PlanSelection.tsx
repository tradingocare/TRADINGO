'use client'

import { useState, useEffect, useRef, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Star, Zap, Crown, AlertCircle, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { setAccessToken } from '@/lib/auth'
import { EXISTING_EMAIL_SIGNIN_URL, isEmailAlreadyRegisteredError } from '@/lib/auth/registration-errors'
import StepCard from '../components/StepCard'
import api from '@/lib/api/client'
import type { VendorRegistrationState, PlanSelectionForm } from '@/types/vendor-registration'

const btnPrimary = { background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', color: '#fff', boxShadow: '0 4px 16px rgba(245, 158, 11, 0.3)' }
const btnSecondary = { backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'rgba(255,255,255,0.8)' }

const CORE_PLAN_IDS = new Set(['trade_start', 'trade_smart', 'trade_plus', 'trade_pro', 'trade_premium', 'trade_elite'])

const CORE_PLAN_FEATURES: Record<string, string[]> = {
  trade_start: ['Buyer Visibility', 'GO Reach', 'Chat', 'RFQ (5/mo)', 'Basic Profile', '1 Product', 'GOCASH Earning'],
  trade_smart: ['Buyer Visibility', 'GO Reach', 'Chat', 'RFQ (20/mo)', 'Flexible Pricing', 'Direct Orders', '25 Products', 'Seller Badge', 'Basic Profile', 'Website', 'GST Invoice'],
  trade_plus: ['Buyer Visibility', 'GO Reach', 'Chat', 'RFQ (50/mo)', 'Flexible Pricing', 'Direct Orders', '100 Products', 'Seller Badge', 'Branding', 'Business Profile', 'Website', 'Catalogue PDF', 'Basic Analytics'],
  trade_pro: ['Buyer Visibility', 'GO Reach', 'Chat', 'RFQ (100/mo)', 'Flexible Pricing', 'Direct Orders', '500 Products', 'Seller Badge', 'Branding', 'Business Profile', 'Website', 'Catalogue PDF', 'Analytics', 'Response Badge', 'GOCASH 2x'],
  trade_premium: ['Buyer Visibility', 'GO Reach', 'Chat', 'Unlimited RFQ', 'Flexible Pricing', 'Direct Orders', '2000 Products', 'Seller Badge', 'Branding', 'Business Profile', 'Website', 'Catalogue PDF', 'Advanced Analytics', 'Relationship Manager', 'Featured Visibility', 'GOCASH 3x'],
  trade_elite: ['Everything in Premium', 'Unlimited Products', 'Unlimited RFQs', 'TRADGO Elite', 'GO DIGITAL Featured', 'Price Lock', 'Advanced Analytics', 'GOCASH 3x', 'Priority RM', 'API Access', 'White Label Options', 'Custom Integration'],
}

// Approved locked baseline (GO / Launch / Annual in ₹) — used as fallback when the
// live plans endpoint is unreachable. The endpoint is the source of truth.
const FALLBACK_PLANS = [
  { id: 'trade_start', name: 'Trade Start', priceGo: 6000, priceLaunch: 12000, priceAnnual: 18000, badge: null, icon: <Star size={18} />, features: CORE_PLAN_FEATURES.trade_start, highlight: false },
  { id: 'trade_smart', name: 'Trade Smart', priceGo: 12000, priceLaunch: 18000, priceAnnual: 30000, badge: null, icon: <Zap size={18} />, features: CORE_PLAN_FEATURES.trade_smart, highlight: false },
  { id: 'trade_plus', name: 'Trade Plus', priceGo: 18000, priceLaunch: 30000, priceAnnual: 50000, badge: null, icon: <Zap size={18} />, features: CORE_PLAN_FEATURES.trade_plus, highlight: false },
  { id: 'trade_pro', name: 'Trade Pro', priceGo: 24000, priceLaunch: 50000, priceAnnual: 75000, badge: 'Recommended', icon: <Crown size={18} />, features: CORE_PLAN_FEATURES.trade_pro, highlight: true },
  { id: 'trade_premium', name: 'Trade Premium', priceGo: 30000, priceLaunch: 75000, priceAnnual: 110000, badge: null, icon: <Crown size={18} />, features: CORE_PLAN_FEATURES.trade_premium, highlight: false },
  { id: 'trade_elite', name: 'Trade Elite', priceGo: 40000, priceLaunch: 110000, priceAnnual: 150000, badge: 'Premium', icon: <Crown size={18} />, features: CORE_PLAN_FEATURES.trade_elite, highlight: false },
]

const formatINR = (n: number) => `₹${n.toLocaleString('en-IN')}`

interface PlanCard {
  id: string
  name: string
  priceGo: number
  priceLaunch: number
  priceAnnual: number
  badge: string | null
  icon: ReactNode
  features: string[]
  highlight: boolean
}

interface Props {
  allData: VendorRegistrationState
  onNext: (data: PlanSelectionForm) => void
  onBack: () => void
  onClearDraft: () => void
  mode?: 'register' | 'existing'
}

export default function Step7PlanSelection({ allData, onNext, onBack, onClearDraft, mode = 'register' }: Props) {
  const router = useRouter()
  const isExisting = mode === 'existing'
  const [plans, setPlans] = useState<PlanCard[]>(FALLBACK_PLANS)
  const [plansLoading, setPlansLoading] = useState(true)
  const [plansError, setPlansError] = useState('')
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
  const [emailAlreadyExists, setEmailAlreadyExists] = useState(false)
  const submitLockRef = useRef(false)

  useEffect(() => {
    let active = true
    api.get('/membership/plans')
      .then((res) => {
        if (!active) return
        const list = res?.data
        if (!Array.isArray(list) || list.length === 0) return
        const mapped = list
          .filter((p: any) => CORE_PLAN_IDS.has(p?.planId))
          .map((p: any): PlanCard => ({
            id: p.planId,
            name: p.name,
            priceGo: p.pricePlanA ?? 0,
            priceLaunch: p.pricePlanB ?? 0,
            priceAnnual: p.pricePlanC ?? 0,
            badge: p.badgeText || null,
            icon: p.planId === 'trade_start' ? <Star size={18} /> : p.planId === 'trade_smart' || p.planId === 'trade_plus' ? <Zap size={18} /> : <Crown size={18} />,
            features: Array.isArray(p.planFeatures) && p.planFeatures.length > 0
              ? p.planFeatures.map((f: any) => f.feature)
              : (CORE_PLAN_FEATURES[p.planId] || []),
            highlight: p.planId === 'trade_pro',
          }))
        if (mapped.length > 0) {
          setPlans(mapped)
          setPlansError('')
        }
      })
      .catch(() => {
        if (!active) return
        setPlansError('Could not load live plans — showing approved baseline pricing.')
      })
      .finally(() => {
        if (active) setPlansLoading(false)
      })
    return () => { active = false }
  }, [])

  // Restore Step 7 state after login redirect
  useEffect(() => {
    try {
      const raw = localStorage.getItem('tradingo_vendor_reg_step7_state')
      if (!raw) return
      const saved = JSON.parse(raw)
      if (saved.selectedPlan) setSelectedPlan(saved.selectedPlan)
      if (saved.agreedTerms !== undefined) setAgreedTerms(saved.agreedTerms)
      if (saved.agreedPrivacy !== undefined) setAgreedPrivacy(saved.agreedPrivacy)
      if (saved.agreedAccuracy !== undefined) setAgreedAccuracy(saved.agreedAccuracy)
      localStorage.removeItem('tradingo_vendor_reg_step7_state')
    } catch {}
  }, [])

  // Save Step 7 state for post-login restoration
  useEffect(() => {
    localStorage.setItem(
      'tradingo_vendor_reg_step7_state',
      JSON.stringify({
        step: 7,
        selectedPlan,
        agreedTerms,
        agreedPrivacy,
        agreedAccuracy,
      })
    )
  }, [selectedPlan, agreedTerms, agreedPrivacy, agreedAccuracy])

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

  const planName = plans.find(p => p.id === selectedPlan)?.name || 'Not selected'
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
    if (!allChecked || submitLockRef.current) return
    submitLockRef.current = true
    setIsSubmitting(true)
    setSubmitError(null)
    setEmailAlreadyExists(false)
    const payload: Record<string, any> = {
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
    }
    if (!isExisting) {
      payload.password = cc.password
    }
    try {
      const res = await api.post(isExisting ? '/auth/vendor/onboarding' : '/auth/register/vendor', payload)
      const accessToken = res?.data?.accessToken
      if (accessToken) {
        setAccessToken(accessToken)
        document.cookie = `accessToken=${accessToken}; path=/; max-age=86400; SameSite=Lax`
      }
      document.cookie = `userRole=${isExisting ? 'SELLER' : (res?.data?.role || 'BUYER')}; path=/; max-age=86400; SameSite=Lax`
      setIsSuccess(true)
      if (isExisting) {
        onClearDraft()
      }
    } catch (err: any) {
      if (isEmailAlreadyRegisteredError(err)) {
        setEmailAlreadyExists(true)
        setSubmitError(null)
      } else {
        setSubmitError(err?.response?.data?.message || err?.message || 'Registration failed. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
      submitLockRef.current = false
    }
  }

  const goToSellerDashboard = () => {
    router.push('/seller/dashboard')
  }

  if (isSuccess) {
    return (
      <StepCard
        icon={<CheckCircle2 size={20} style={{ color: '#4ade80' }} />}
        title={isExisting ? 'Vendor Mode Activated!' : 'Account Created!'}
        subtitle={isExisting ? 'Your seller workspace is ready' : 'Complete your seller onboarding to activate vendor mode'}
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
            <h3 className="text-white font-bold text-xl mb-2">{isExisting ? 'Welcome to your Seller Workspace!' : 'Almost there!'}</h3>
            <p className="text-white/50 text-sm leading-relaxed max-w-sm">
              {isExisting
                ? 'Vendor mode is now active on your account. Your buyer features remain available — switch between Buyer and Seller whenever you want.'
                : 'Your account is created. Complete vendor onboarding to activate your seller workspace — your details are saved.'}
            </p>
          </div>
          {isExisting ? (
            <button
              type="button"
              onClick={goToSellerDashboard}
              className="px-8 py-3.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98]"
              style={btnPrimary}
            >
              Go to Seller Dashboard →
            </button>
          ) : (
            <button
              type="button"
              onClick={() => router.push('/register/vendor-onboarding')}
              className="px-8 py-3.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98]"
              style={btnPrimary}
            >
              Complete Seller Onboarding →
            </button>
          )}
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
          {plansLoading && (
            <div className="flex items-center gap-2 p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}>
              <LoadingSpinner size="xs" />
              <span className="text-white/40 text-xs">Loading plans...</span>
            </div>
          )}
          {!plansLoading && plansError && (
            <p className="p-3 mb-2 rounded-xl text-amber-300/80 text-xs" style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.35)' }}>
              {plansError}
            </p>
          )}
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
            {plans.map(plan => (
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
                <div className="flex items-baseline gap-0.5 mb-1">
                  <span className="text-white font-black text-lg">{formatINR(plan.priceGo)}</span>
                  <span className="text-white/30 text-xs">/yr (GO)</span>
                </div>
                <p className="text-white/30 text-[9px] mb-3">Launch {formatINR(plan.priceLaunch)} · Annual {formatINR(plan.priceAnnual)}</p>
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
            {
              checked: agreedTerms, set: setAgreedTerms,
              text: "I agree to TRADINGO's Terms & Conditions and Seller Agreement",
              docs: [{ word: 'Terms & Conditions', href: '/terms' }, { word: 'Seller Agreement', href: '/seller-agreement' }],
            },
            {
              checked: agreedPrivacy, set: setAgreedPrivacy,
              text: "I agree to TRADINGO's Privacy Policy and consent to data processing",
              docs: [{ word: 'Privacy Policy', href: '/privacy' }],
            },
            { checked: agreedAccuracy, set: setAgreedAccuracy, text: "I confirm all information provided is accurate", docs: [] },
          ].map((item, i) => {
            const parts: ReactNode[] = []
            let remaining = item.text
            let cursor = 0
            for (const doc of item.docs) {
              const idx = remaining.indexOf(doc.word, cursor)
              if (idx === -1) continue
              parts.push(remaining.slice(cursor, idx))
              parts.push(
                <a key={doc.href + i} href={doc.href} target="_blank" rel="noopener noreferrer"
                  className="text-[#fbbf24] underline hover:text-[#fde68a]">
                  {doc.word}
                </a>
              )
              cursor = idx + doc.word.length
            }
            parts.push(remaining.slice(cursor))
            return (
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
                <span className="text-white/60 text-xs leading-relaxed group-hover:text-white/80 transition-colors">{parts}</span>
              </label>
            )
          })}
          <p className="text-white/30 text-[10px] leading-relaxed pl-8">
            Read:{' '}
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-[#fbbf24]/70 underline hover:text-[#fde68a]">Terms &amp; Conditions</a>
            {' · '}
            <a href="/seller-agreement" target="_blank" rel="noopener noreferrer" className="text-[#fbbf24]/70 underline hover:text-[#fde68a]">Seller Agreement</a>
            {' · '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-[#fbbf24]/70 underline hover:text-[#fde68a]">Privacy Policy</a>
            {' · '}
            <a href="/disclaimer" target="_blank" rel="noopener noreferrer" className="text-[#fbbf24]/70 underline hover:text-[#fde68a]">Disclaimer</a>
          </p>
        </div>

        {submitError && (
          <div className="p-3 rounded-xl flex items-start gap-2"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <AlertTriangle size={16} className="text-red-400 mt-0.5 shrink-0" />
            <p className="text-red-300 text-sm">{submitError}</p>
          </div>
        )}

        {emailAlreadyExists && (
          <div className="p-4 rounded-xl flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.35)' }}>
            <p className="text-white/80 text-sm leading-relaxed flex items-start gap-2">
              <AlertCircle size={16} className="text-[#fbbf24] mt-0.5 shrink-0" />
              <span>
                An account with this email already exists.{' '}
                <span className="text-white/60">Sign in to continue as a Seller — your buyer account stays linked.</span>
              </span>
            </p>
            <Link
              href={EXISTING_EMAIL_SIGNIN_URL}
              className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98] text-center"
              style={btnPrimary}
            >
              Sign in to continue as Seller →
            </Link>
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
