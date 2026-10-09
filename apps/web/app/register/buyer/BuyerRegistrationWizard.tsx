'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertTriangle } from 'lucide-react'
import type { BuyerRegistrationState } from '@/types/buyer-registration'
import api from '@/lib/api/client'
import { persistSession } from '@/lib/auth/session'
import { isEmailAlreadyRegisteredError } from '@/lib/auth/registration-errors'
import Step1PersonalInfo from './steps/Step1PersonalInfo'
import Step2CompanyProfile from './steps/Step2CompanyProfile'
import Step3Preferences from './steps/Step3Preferences'

const STEPS = [
  { number: 1, title: 'Personal', subtitle: 'Info' },
  { number: 2, title: 'Company', subtitle: 'Profile' },
  { number: 3, title: 'Preferences', subtitle: 'Categories' },
]

const DRAFT_KEY = 'tradingo_buyer_reg_draft'

const INITIAL_STATE: BuyerRegistrationState = {
  step: 1, completedSteps: [],
  personalInfo: {}, companyProfile: {},
  businessAddress: {}, preferences: {}, confirmation: {},
}

// P1-11: never persist credentials. Mirrors the vendor wizard's
// sanitizeForStorage pattern: strip password/confirmPassword (account
// credential) and gstNumber (optional Step 2 identity field, treated as
// sensitive exactly like the vendor flow) before any localStorage write.
// Live form state is untouched (shallow copy); resume leaves password
// fields empty for fresh entry.
const SENSITIVE_KEYS: Record<string, string[]> = {
  personalInfo: ['password', 'confirmPassword'],
  companyProfile: ['gstNumber'],
}

export function sanitizeBuyerDraftForStorage(state: BuyerRegistrationState): BuyerRegistrationState {
  const sanitized: any = { ...state }
  for (const [key, sensitive] of Object.entries(SENSITIVE_KEYS)) {
    if (sensitive.length > 0 && sanitized[key]) {
      const obj = sanitized[key] as Record<string, unknown>
      sanitized[key] = Object.fromEntries(
        Object.entries(obj).filter(([k]) => !sensitive.includes(k))
      )
    }
  }
  return sanitized as BuyerRegistrationState
}

export default function BuyerRegistrationWizard() {
  const router = useRouter()
  const [state, setState] = useState<BuyerRegistrationState>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(DRAFT_KEY)
        if (saved) return JSON.parse(saved)
      } catch {}
    }
    return INITIAL_STATE
  })

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [emailAlreadyExists, setEmailAlreadyExists] = useState(false)

  useEffect(() => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(sanitizeBuyerDraftForStorage(state))) } catch {}
  }, [state])

  const { step, completedSteps } = state

  const goNext = <
  K extends keyof BuyerRegistrationState
  >(
  data: BuyerRegistrationState[K],
  key: K
) => {
    setState(prev => ({
      ...prev,
      [key]: {
  ...(prev[key] as object),
  ...(data as object),
} as BuyerRegistrationState[K],
      completedSteps: prev.completedSteps.includes(prev.step)
        ? prev.completedSteps
        : [...prev.completedSteps, prev.step],
      step: Math.min(prev.step + 1, STEPS.length),
    }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goBack = () => {
    setState(prev => ({ ...prev, step: Math.max(prev.step - 1, 1) }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Multi-section step advance (Step 2 collects company profile AND business
  // address in one screen): merge both sections in a single state update so
  // the step counter increments exactly once.
  const goNextWith = (sections: Partial<Pick<BuyerRegistrationState, 'companyProfile' | 'businessAddress'>>) => {
    setState(prev => ({
      ...prev,
      ...sections,
      completedSteps: prev.completedSteps.includes(prev.step)
        ? prev.completedSteps
        : [...prev.completedSteps, prev.step],
      step: Math.min(prev.step + 1, STEPS.length),
    }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY)
    setState(INITIAL_STATE)
  }

  const handleSubmit = async (finalPreferences?: any) => {
    if (!finalPreferences?.agreedToTerms || !finalPreferences?.agreedToPrivacyPolicy) {
      setSubmitError('Please accept the Terms & Conditions and Privacy Policy before submitting')
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    setEmailAlreadyExists(false)
    try {
      const pi = state.personalInfo
      const cp = state.companyProfile
      const ba = state.businessAddress
      const pr = finalPreferences || state.preferences
      const res = await api.post('/auth/register/buyer', {
        fullName: `${pi.firstName || ''} ${pi.lastName || ''}`.trim(),
        email: pi.email,
        mobileNumber: pi.mobile,
        password: pi.password,
        companyName: cp.companyName,
        designation: cp.designation || '',
        businessType: cp.companyType || '',
        industry: cp.industry || '',
        companySize: cp.companySize || '',
        annualProcurement: cp.annualProcurement || '',
        gstNumber: cp.gstNumber || undefined,
        website: cp.website || undefined,
        addressLine1: ba.addressLine1 || '',
        addressLine2: ba.addressLine2 || undefined,
        city: ba.city || '',
        district: ba.district || '',
        state: ba.state || '',
        pincode: ba.pincode || '',
        primaryCategoriesRequired: (pr.primaryCategories?.length || 0) > 0,
        primaryCategories: pr.primaryCategories || [],
        preferredSuppliers: pr.preferredSuppliers || 'local',
        notificationEmail: pr.notificationEmail ?? true,
        notificationSms: pr.notificationSms ?? true,
        newsletter: pr.newsletter ?? false,
      })
      // The backend returns session tokens — persist them (canonical session
      // writer) and hand off directly to the buyer dashboard instead of
      // forcing a second login.
      const accessToken = res?.data?.accessToken
      const role = res?.data?.role || res?.data?.user?.role || 'BUYER'
      if (accessToken) {
        persistSession({ user: { role }, accessToken })
      }
      setIsSuccess(true)
      clearDraft()
    } catch (err: any) {
      if (isEmailAlreadyRegisteredError(err)) {
        setEmailAlreadyExists(true)
        setSubmitError(null)
      } else {
        setSubmitError(err?.response?.data?.message || err?.message || 'Registration failed. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: 'rgba(74,222,128,0.1)', border: '2px solid rgba(74,222,128,0.3)' }}>
          <CheckCircle2 size={40} className="text-green-400" />
        </div>
        <h2 className="text-text-primary font-bold text-2xl mb-2">Registration Successful!</h2>
        <p className="text-text-secondary text-sm mb-6 max-w-sm mx-auto">
          Your buyer account has been created. Start exploring the marketplace.
        </p>
        <button onClick={() => router.push('/buyer/dashboard')}
          className="px-8 py-3 rounded-xl font-bold text-sm"
          style={{ background: 'linear-gradient(135deg,#f59e0b,#fbbf24)', color: '#fff' }}>
          Go to Buyer Dashboard
        </button>
      </div>
    )
  }

  const totalSteps = step === 3 ? 3 : STEPS.length
  const progressPct = totalSteps > 1 ? ((step - 1) / (totalSteps - 1)) * 100 : 0

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <p className="text-text-primary font-bold text-sm">Step {step} of {totalSteps}</p>
          <p className="text-text-tertiary text-xs">{step <= 3 ? `${STEPS[step - 1].title} — ${STEPS[step - 1].subtitle}` : 'Submit'}</p>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden mb-5" style={{ background: 'var(--border-light)' }}>
          <motion.div className="h-full rounded-full" animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4 }}
            style={{ background: 'linear-gradient(90deg,#f59e0b,#fbbf24)' }} />
        </div>
        <div className="flex items-center justify-between">
          {STEPS.map((s) => {
            const done = completedSteps.includes(s.number) || isSuccess
            const current = step === s.number
            return (
              <div key={s.number} className="flex flex-col items-center gap-1">
                <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300"
                  style={{
                    background: done ? 'rgba(74,222,128,0.2)' : current ? 'rgba(245, 158, 11, 0.2)' : 'var(--bg-elevated)',
                    border: done ? '1px solid rgba(74,222,128,0.5)' : current ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid var(--border-color)',
                    color: done ? '#4ade80' : current ? '#f59e0b' : 'var(--text-tertiary)',
                  }}>
                  {done ? <CheckCircle2 size={14} /> : s.number}
                </div>
                <span className={`text-[9px] hidden sm:block transition-colors ${current ? 'text-[#b45309]' : done ? 'text-green-400/70' : 'text-text-tertiary'}`}>{s.title}</span>
              </div>
            )
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
          {step === 1 && <Step1PersonalInfo data={state.personalInfo} onNext={d => goNext(d, 'personalInfo')} />}
          {step === 2 && <Step2CompanyProfile data={state.companyProfile} addressData={state.businessAddress} onNext={(d, a) => { goNextWith({ companyProfile: d, businessAddress: a }) }} onBack={goBack} />}
          {step === 3 && (
            <div>
              {submitting ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-2 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-text-primary font-bold text-lg">Creating your account...</p>
                  <p className="text-text-secondary text-sm mt-1">Please wait while we register you.</p>
                </div>
              ) : (
                <Step3Preferences data={state} onNext={d => { goNext(d, 'preferences'); handleSubmit(d) }} onBack={goBack} onClearDraft={clearDraft} />
              )}
              {emailAlreadyExists && (
                <div className="mt-4 p-3 rounded-xl flex items-start justify-between gap-3 flex-wrap"
                  style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.35)' }}>
                  <p className="text-text-primary text-sm flex items-start gap-2">
                    <AlertTriangle size={16} className="text-[#fbbf24] mt-0.5 shrink-0" />
                    <span>An account with this email already exists. Sign in to continue — or register with a different email.</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push('/login?next=/buyer/dashboard')}
                    className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold"
                    style={{ background: 'linear-gradient(135deg,#f59e0b,#fbbf24)', color: '#fff' }}>
                    Sign In →
                  </button>
                </div>
              )}
              {submitError && (
                <div className="mt-4 p-3 rounded-xl flex items-start gap-2"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <AlertTriangle size={16} className="text-red-400 mt-0.5 shrink-0" />
                  <p className="text-red-300 text-sm">{submitError}</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
