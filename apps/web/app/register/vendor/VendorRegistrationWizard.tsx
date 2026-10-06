'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/lib/api/client'
import { isAuthenticated } from '@/lib/auth'
import { RegistrationFormShell } from '@/components/registration/RegistrationFormShell'
import {
  useOpenRegistrationForm,
  useRegistrationForm,
  useSaveRegistrationDraft,
} from '@/hooks/use-registration-form'
import type { VendorRegistrationState } from '@/types/vendor-registration'
import Step1BusinessIdentity from './steps/Step1BusinessIdentity'
import Step2ContactCredentials from './steps/Step2ContactCredentials'
import Step3PANVerification from './steps/Step3PANVerification'
import Step4GSTVerification from './steps/Step4GSTVerification'
import Step5BusinessProfile from './steps/Step5BusinessProfile'
import Step6BankDetails from './steps/Step6BankDetails'
import Step7PlanSelection from './steps/Step7PlanSelection'

const STEPS = [
  { number: 1, title: 'Business', subtitle: 'Identity' },
  { number: 2, title: 'Contact', subtitle: 'Login' },
  { number: 3, title: 'PAN', subtitle: 'Verification' },
  { number: 4, title: 'GST', subtitle: 'Verification' },
  { number: 5, title: 'Profile', subtitle: 'Categories' },
  { number: 6, title: 'Bank', subtitle: 'Account' },
  { number: 7, title: 'Plan', subtitle: 'Confirmation' },
]

const DRAFT_KEY = 'tradingo_vendor_reg_draft'

const INITIAL_STATE: VendorRegistrationState = {
  step: 1, completedSteps: [],
  businessIdentity: {}, contactCredentials: {},
  pan: {}, gst: {}, businessProfile: {},
  bankDetails: {}, planSelection: {},
}

const SENSITIVE_KEYS: Record<string, string[]> = {
  businessIdentity: [],
  contactCredentials: ['password', 'confirmPassword', 'email', 'mobileNumber', 'alternateMobile'],
  pan: ['panNumber', 'panHolderName', 'dateOfBirth'],
  gst: ['gstNumber', 'gstExemptReason'],
  businessProfile: [],
  bankDetails: ['accountHolderName', 'accountNumber', 'ifscCode', 'accountType'],
  planSelection: [],
}

// Exported for the R5C server-draft integration (PATCH payloads reuse the
// same allowlist-strip so secrets never leave the browser for drafts).
export function sanitizeForStorage(state: VendorRegistrationState): VendorRegistrationState {
  const sanitized: any = { ...state }
  for (const [key, sensitive] of Object.entries(SENSITIVE_KEYS)) {
    if (sensitive.length > 0 && sanitized[key]) {
      const obj = sanitized[key] as Record<string, unknown>
      sanitized[key] = Object.fromEntries(
        Object.entries(obj).filter(([k]) => !sensitive.includes(k))
      )
    }
  }
  return sanitized as VendorRegistrationState
}

interface ExistingUser {
  email?: string
  mobile?: string
  name?: string
}

interface Props {
  mode?: 'register' | 'existing'
}

export default function VendorRegistrationWizard({ mode = 'register' }: Props) {
  const [state, setState] = useState<VendorRegistrationState>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(DRAFT_KEY)
        if (saved) return JSON.parse(saved)
      } catch {}
    }
    return INITIAL_STATE
  })
  const [existingUser, setExistingUser] = useState<ExistingUser | null>(null)

  // ── R5C server draft (auth-aware) ──────────────────────────────────
  // Guests have no user to own a server form: they keep the local-only
  // behavior below, byte-identical to before. Authenticated sessions
  // (existing-buyer mode, or a token persisted mid-flow) open/create the
  // canonical server record and autosave sanitized step data into it.
  const [serverAuthed] = useState(() => mode === 'existing' || isAuthenticated())
  const [serverFormId, setServerFormId] = useState<string | null>(null)
  const [serverFormLocked, setServerFormLocked] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'conflict' | 'error'>('idle')
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const serverUpdatedAtRef = useRef<string | null>(null)
  const openMutation = useOpenRegistrationForm()
  const saveMutation = useSaveRegistrationDraft(serverFormId)
  // Manual refetch only (conflict reload) — the open-mutation is the single
  // writer/reader for the steady-state flow.
  const liveFormQuery = useRegistrationForm(serverFormId, false)

  const handleReloadLatest = () => {
    liveFormQuery.refetch().then((result) => {
      const form = (result.data as any)?.form
      if (form) {
        adoptServerForm(form)
        planSaveConflictRef.current = false
        setSaveState('idle')
        setSaveMessage(null)
      }
    })
  }

  // R5B plan pinning: the ?planId= entry hint (and later the user's live
  // selection) is the form's server-side intent. Resolving it at open pins
  // the plan + active version; submit-time mismatch then 400s instead of the
  // pin silently never existing.
  const entryPlanIdRef = useRef<string | null>(null)
  const entryPlanId = () => {
    if (entryPlanIdRef.current !== null) return entryPlanIdRef.current
    const hinted = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('planId') : null
    entryPlanIdRef.current = hinted || ''
    return entryPlanIdRef.current
  }

  const adoptServerForm = (form: {
    formId: string
    status: string
    currentStep: number
    draftPayload: Record<string, unknown>
    updatedAt: string
  }) => {
    setServerFormId(form.formId)
    serverUpdatedAtRef.current = form.updatedAt
    if (form.status !== 'DRAFT') {
      setServerFormLocked(form.status)
      return
    }
    setServerFormLocked(null)
    // Conservative resume: adopt server sections only where local state is
    // still pristine, and the server step only from a fresh start. Local
    // progress is never silently overwritten; the next save reconciles.
    setState((prev) => {
      const isPristine = prev.step === 1 && prev.completedSteps.length === 0
      if (!isPristine) return prev
      const payload = form.draftPayload ?? {}
      const next: any = { ...prev }
      let touched = false
      for (const key of Object.keys(INITIAL_STATE) as (keyof VendorRegistrationState)[]) {
        if (key === 'step' || key === 'completedSteps') continue
        const incoming = (payload as Record<string, unknown>)[key]
        if (incoming && typeof incoming === 'object' && Object.keys(incoming).length > 0) {
          next[key] = { ...((next[key] as Record<string, unknown>) ?? {}), ...(incoming as Record<string, unknown>) }
          touched = true
        }
      }
      if (touched && typeof form.currentStep === 'number') {
        next.step = Math.min(Math.max(form.currentStep, 1), STEPS.length)
      }
      return touched ? (next as VendorRegistrationState) : prev
    })
  }

  useEffect(() => {
    if (!serverAuthed || serverFormId || openMutation.isPending) return
    const planHint = entryPlanId()
    openMutation.mutate(planHint || undefined, {
      onSuccess: (result) => adoptServerForm(result.form as any),
      onError: () => {
        setSaveState('error')
        setSaveMessage('Could not reach the application server. Your progress is still saved on this device.')
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverAuthed])

  useEffect(() => {
    let cancelled = false
    if (mode === 'existing') {
      api.get('/auth/me').then(({ data }: any) => {
        if (cancelled) return
        setExistingUser({
          email: data?.user?.email ?? data?.email,
          mobile: data?.user?.mobile ?? data?.mobile,
          name: data?.user?.name ?? data?.name,
        })
      }).catch(() => {})
    }
    return () => { cancelled = true }
  }, [mode])

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(sanitizeForStorage(state)))
    } catch {}
  }, [state])

  const { step, completedSteps } = state

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const goNext = (data: any, key: keyof VendorRegistrationState) => {
    setState(prev => ({
      ...prev,
      [key]: { ...(prev[key] as Record<string, unknown>), ...data },
      completedSteps: prev.completedSteps.includes(prev.step)
        ? prev.completedSteps
        : [...prev.completedSteps, prev.step],
      step: Math.min(prev.step + 1, STEPS.length),
    }))
    // Server autosave (authenticated server-draft sessions only): the step
    // payload goes through the same allowlist-strip, so secrets never leave
    // the browser for drafts. Fire-and-remember — navigation never waits.
    if (serverFormId && !serverFormLocked && serverUpdatedAtRef.current) {
      const sanitized = sanitizeForStorage({ [key]: data } as VendorRegistrationState) as unknown as Record<string, unknown>
      const section = (sanitized[key as string] ?? {}) as Record<string, unknown>
      setSaveState('saving')
      setSaveMessage(null)
      saveMutation.mutate(
        { currentStep: Math.min(step + 1, STEPS.length), fields: { [key]: section }, clientUpdatedAt: serverUpdatedAtRef.current },
        {
          onSuccess: (result) => {
            serverUpdatedAtRef.current = result.form.updatedAt
            setSaveState('saved')
          },
          onError: (err: any) => {
            if (err?.response?.status === 409) {
              setSaveState('conflict')
              setSaveMessage('A newer version of this application exists (another tab or device). Reload to continue from the latest copy — unsent local edits are preserved on this device.')
            } else {
              setSaveState('error')
              setSaveMessage('Could not save to the application server. Your progress is still saved on this device.')
            }
          },
        },
      )
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goBack = () => {
    setState(prev => ({ ...prev, step: Math.max(prev.step - 1, 1) }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Review-section edit navigation: jump to a completed step without
  // dropping collected data. Terminal server forms stay read-only downstream.
  const goToStep = (n: number) => {
    setState(prev => ({ ...prev, step: Math.min(Math.max(n, 1), STEPS.length) }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // R5B plan pinning (server-draft sessions): re-pin the selected plan on
  // change so the form's intent stays server-authoritative. Saves are
  // serialized — rapid card browsing records the latest choice in a ref and
  // flushes it when the in-flight save settles, so no stale clientUpdatedAt
  // ever produces a false conflict. TRAD UP pins like any plan; its submit
  // body still omits planId (fulfilled via activateFreePlan).
  const planSaveInFlightRef = useRef(false)
  const planSaveConflictRef = useRef(false)
  const pendingPlanIdRef = useRef<string | null>(null)
  const flushPlanSave = () => {
    const planId = pendingPlanIdRef.current
    pendingPlanIdRef.current = null
    if (!planId || !serverFormId || serverFormLocked || !serverUpdatedAtRef.current) return
    planSaveInFlightRef.current = true
    setSaveState('saving')
    setSaveMessage(null)
    saveMutation.mutate(
      { selectedPlanId: planId, clientUpdatedAt: serverUpdatedAtRef.current },
      {
        onSuccess: (result) => {
          serverUpdatedAtRef.current = result.form.updatedAt
          setSaveState('saved')
        },
        onError: (err: any) => {
          if (err?.response?.status === 409) {
            // Conflict: a newer copy exists. Never auto-retry with the stale
            // timestamp — the user must reload the latest copy first.
            planSaveConflictRef.current = true
            pendingPlanIdRef.current = null
            setSaveState('conflict')
            setSaveMessage('A newer version of this application exists (another tab or device). Reload to continue from the latest copy — unsent local edits are preserved on this device.')
          } else {
            setSaveState('error')
            setSaveMessage('Could not save your plan choice to the application server.')
          }
        },
        onSettled: () => {
          planSaveInFlightRef.current = false
          if (pendingPlanIdRef.current && !planSaveConflictRef.current) flushPlanSave()
        },
      },
    )
  }
  const handlePlanChange = (planId: string) => {
    if (planSaveConflictRef.current) return
    pendingPlanIdRef.current = planId
    if (planSaveInFlightRef.current) return
    flushPlanSave()
  }

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY)
  }

  const progressPct = ((step - 1) / (STEPS.length - 1)) * 100

  return (
    <RegistrationFormShell
      title="Seller Registration"
      contextLabel={mode === 'existing' ? 'Existing account upgrade' : undefined}
      formId={serverAuthed ? serverFormId : null}
      formLoading={serverAuthed && !serverFormId && !serverFormLocked && saveState !== 'error'}
      steps={STEPS.map((s) => ({
        ...s,
        state: completedSteps.includes(s.number) ? 'complete' : step === s.number ? 'current' : 'pending',
      }))}
      currentStep={step}
      totalSteps={STEPS.length}
      progressPct={progressPct}
      saveState={serverAuthed ? saveState : 'idle'}
      saveMessage={saveMessage}
      onReloadConflict={saveState === 'conflict' ? handleReloadLatest : undefined}
      notice={serverFormLocked ? { tone: 'warn', text: `This application is ${serverFormLocked}. It can no longer be edited — please contact support if you need changes.` } : null}
    >
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
          {step === 1 && <Step1BusinessIdentity data={state.businessIdentity} onNext={d => goNext(d, 'businessIdentity')} />}
          {step === 2 && <Step2ContactCredentials data={state.contactCredentials} mode={mode} existingUser={existingUser} onNext={d => goNext(d, 'contactCredentials')} onBack={goBack} />}
          {step === 3 && <Step3PANVerification data={state.pan} businessType={state.businessIdentity.businessType} onNext={d => goNext(d, 'pan')} onBack={goBack} />}
          {step === 4 && <Step4GSTVerification data={state.gst} onNext={d => goNext(d, 'gst')} onBack={goBack} />}
          {step === 5 && <Step5BusinessProfile data={state.businessProfile} onNext={d => goNext(d, 'businessProfile')} onBack={goBack} />}
          {step === 6 && <Step6BankDetails data={state.bankDetails} onNext={d => goNext(d, 'bankDetails')} onBack={goBack} />}
          {step === 7 && <Step7PlanSelection allData={state} mode={mode} onNext={d => goNext(d, 'planSelection')} onBack={goBack} onClearDraft={clearDraft} onEditStep={goToStep} serverFormId={serverAuthed ? serverFormId : null} onPlanChange={handlePlanChange} />}
        </motion.div>
      </AnimatePresence>
    </RegistrationFormShell>
  )
}
