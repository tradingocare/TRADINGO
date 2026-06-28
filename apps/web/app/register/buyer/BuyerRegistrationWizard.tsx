'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import type { BuyerRegistrationState } from '@/types/buyer-registration'
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

export default function BuyerRegistrationWizard() {
  const [state, setState] = useState<BuyerRegistrationState>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(DRAFT_KEY)
        if (saved) return JSON.parse(saved)
      } catch {}
    }
    return INITIAL_STATE
  })

  useEffect(() => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(state)) } catch {}
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

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY)
    setState(INITIAL_STATE)
  }

  const progressPct = ((step - 1) / (STEPS.length - 1)) * 100

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <p className="text-white font-bold text-sm">Step {step} of {STEPS.length}</p>
          <p className="text-white/35 text-xs">{STEPS[step - 1].title} — {STEPS[step - 1].subtitle}</p>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden mb-5" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <motion.div className="h-full rounded-full" animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4 }}
            style={{ background: 'linear-gradient(90deg,#FF4D00,#FF7A3D)' }} />
        </div>
        <div className="flex items-center justify-between">
          {STEPS.map((s) => {
            const done = completedSteps.includes(s.number)
            const current = step === s.number
            return (
              <div key={s.number} className="flex flex-col items-center gap-1">
                <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300"
                  style={{
                    background: done ? 'rgba(74,222,128,0.2)' : current ? 'rgba(255,77,0,0.2)' : 'rgba(255,255,255,0.05)',
                    border: done ? '1px solid rgba(74,222,128,0.5)' : current ? '1px solid rgba(255,77,0,0.5)' : '1px solid rgba(255,255,255,0.1)',
                    color: done ? '#4ade80' : current ? '#FF4D00' : 'rgba(255,255,255,0.3)',
                  }}>
                  {done ? <CheckCircle2 size={14} /> : s.number}
                </div>
                <span className={`text-[8px] hidden sm:block transition-colors ${current ? 'text-[#FF4D00]' : done ? 'text-green-400/70' : 'text-white/25'}`}>{s.title}</span>
              </div>
            )
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
          {step === 1 && <Step1PersonalInfo data={state.personalInfo} onNext={d => goNext(d, 'personalInfo')} />}
          {step === 2 && <Step2CompanyProfile data={state.companyProfile} onNext={d => goNext(d, 'companyProfile')} onBack={goBack} />}
          {step === 3 && <Step3Preferences data={state} onNext={d => goNext(d, 'preferences')} onBack={goBack} onClearDraft={clearDraft} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}