'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2 } from 'lucide-react'
import type { BuyerConfirmationForm, BuyerPreferencesForm, BuyerRegistrationState } from '@/types/buyer-registration'
import StepCard from '../components/StepCard'
import FormField from '../components/FormField'

const INPUT_CLASS = 'w-full px-4 py-3 rounded-xl text-text-primary text-sm placeholder:text-text-tertiary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:border-[var(--input-focus-border)] transition-all duration-200'
const inputStyle = (hasError: boolean) => ({
  background: 'var(--bg-elevated)',
  border: hasError ? '1px solid rgba(239,68,68,0.5)' : '1px solid var(--border-color)',
  boxShadow: hasError ? '0 0 0 3px rgba(239,68,68,0.1)' : undefined,
})
const btnPrimary = { background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', color: '#fff', boxShadow: '0 4px 16px rgba(245, 158, 11, 0.3)' }
const btnSecondary = { background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }

import { CATALOG_CATEGORIES } from '@/data/catalog-data'

// Static fallback only: the canonical source is GET /categories/tree
// (platform-owned vocabulary). Either way the buyer picks from a platform
// list — and picking is now OPTIONAL (FD-TAX-03): the system resolves
// taxonomy from behavior, so this step must never block registration.
const FALLBACK_CATEGORIES = CATALOG_CATEGORIES.map(c => c.name)

const SUPPLIER_OPTIONS: { value: BuyerPreferencesForm['preferredSuppliers']; label: string; desc: string }[] = [
  { value: 'local', label: 'Local', desc: 'Within my city' },
  { value: 'state', label: 'State', desc: 'Within my state' },
  { value: 'pan_india', label: 'Pan India', desc: 'Across India' },
  { value: 'global', label: 'Global', desc: 'International suppliers' },
]

// Module-scoped so the component identity is stable across renders — defining
// it inside the render body remounted the switch on every parent state change
// (same anti-pattern as E2E-02 RadioCardGrid).
function Toggle({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200"
      style={{ background: checked ? '#f59e0b' : 'var(--border-light)' }}
    >
      <span
        className="inline-block h-4 w-4 rounded-full bg-white transition-transform duration-200"
        style={{ transform: checked ? 'translateX(22px)' : 'translateX(3px)' }}
      />
    </button>
  )
}

interface Props {
  data: BuyerRegistrationState
  onNext: (data: Partial<BuyerPreferencesForm> & Partial<BuyerConfirmationForm>) => void
  onBack: () => void
  onClearDraft: () => void
}

export default function Step3Preferences({
  data,
  onNext,
  onBack,
  onClearDraft,
}: Props) {  
  const [primaryCategories, setPrimaryCategories] = useState<string[]>(data.preferences?.primaryCategories ?? [])
  const [preferredSuppliers, setPreferredSuppliers] = useState<BuyerPreferencesForm['preferredSuppliers']>(data.preferences?.preferredSuppliers ?? 'local')
  const [notificationEmail, setNotificationEmail] = useState(data.preferences?.notificationEmail ?? true)
  const [notificationSms, setNotificationSms] = useState(data.preferences?.notificationSms ?? true)
  const [newsletter, setNewsletter] = useState(data.preferences?.newsletter ?? false)
  const [agreedToTerms, setAgreedToTerms] = useState(data.confirmation?.agreedToTerms ?? false)
  const [agreedToPrivacyPolicy, setAgreedToPrivacyPolicy] = useState(data.confirmation?.agreedToPrivacyPolicy ?? false)
  const [errors, setErrors] = useState<{ legal?: string }>({})
  const [apiCategories, setApiCategories] = useState<string[] | null>(null)

  // Canonical platform vocabulary first; static fallback keeps the step
  // usable when the taxonomy API is unreachable. Selections are optional.
  useEffect(() => {
    let cancelled = false
    import('@/lib/api/client').then(({ default: apiClient }) =>
      apiClient.get('/categories/tree').then((res: any) => {
        if (cancelled) return
        const flatten = (nodes: any[]): string[] =>
          (nodes || []).flatMap((n: any) => [n?.name, ...flatten(n?.children || [])].filter(Boolean))
        const data = res?.data
        const names = flatten(Array.isArray(data) ? data : data?.data || [])
        if (names.length > 0) setApiCategories(names)
      }).catch(() => { /* fallback list below stays in effect */ }),
    )
    return () => { cancelled = true }
  }, [])
  const CATEGORIES = apiCategories ?? FALLBACK_CATEGORIES

  const toggleCategory = (cat: string) => {
    setPrimaryCategories(prev => {
      if (prev.includes(cat)) return prev.filter(c => c !== cat)
      if (prev.length >= 10) return prev
      return [...prev, cat]
    })
  }

  const handleSubmit = () => {
    // FD-TAX-03: category preference is OPTIONAL — buyer taxonomy is
    // system-resolved from behavior. Only the legal checkboxes gate submit.
    if (!agreedToTerms || !agreedToPrivacyPolicy) {
      setErrors({ legal: 'You must accept the Terms & Conditions and Privacy Policy before submitting' })
      return
    }
    setErrors({})
   onNext({
  primaryCategories,
  preferredSuppliers,
  notificationEmail,
  notificationSms,
  newsletter,
  agreedToTerms,
  agreedToPrivacyPolicy,
})
  }

  return (
    <StepCard title="Preferences & Notifications" subtitle="Tell us what you're looking for">
      <div className="space-y-8">
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-text-primary text-sm font-medium">Primary Categories <span className="text-text-tertiary font-normal">(optional — we&apos;ll also learn from your activity)</span></p>
            <span className="text-xs text-text-tertiary">{primaryCategories.length}/10 selected</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {CATEGORIES.map(cat => {
              const selected = primaryCategories.includes(cat)
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className="rounded-xl px-3 py-2.5 text-xs text-left transition-all duration-200"
                  style={{
                    background: selected ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-elevated)',
                    border: selected ? '1px solid rgba(245, 158, 11, 0.6)' : '1px solid var(--border-color)',
                  }}
                >
                  <span className={selected ? 'text-[#fbbf24]' : 'text-text-secondary'}>{cat}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-text-primary text-sm font-medium mb-3">Preferred Supplier Region *</p>
          <div className="grid grid-cols-2 gap-3">
            {SUPPLIER_OPTIONS.map(opt => {
              const selected = preferredSuppliers === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPreferredSuppliers(opt.value)}
                  className="rounded-xl px-4 py-3 text-left transition-all duration-200"
                  style={{
                    background: selected ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-elevated)',
                    border: selected ? '1px solid rgba(245, 158, 11, 0.6)' : '1px solid var(--border-color)',
                  }}
                >
                  <p className={`text-sm font-medium ${selected ? 'text-[#fbbf24]' : 'text-text-primary'}`}>{opt.label}</p>
                  <p className="text-xs text-text-tertiary mt-0.5">{opt.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-text-primary text-sm font-medium">Notification Settings</p>
          <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}>
            <span className="text-sm text-text-secondary">Email notifications for RFQ updates</span>
            <Toggle checked={notificationEmail} onToggle={() => setNotificationEmail(p => !p)} />
          </div>
          <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}>
            <span className="text-sm text-text-secondary">SMS alerts for urgent orders</span>
            <Toggle checked={notificationSms} onToggle={() => setNotificationSms(p => !p)} />
          </div>
          <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}>
            <span className="text-sm text-text-secondary">Subscribe to TRADINGO marketplace newsletter</span>
            <Toggle checked={newsletter} onToggle={() => setNewsletter(p => !p)} />
          </div>
        </div>

        <div>
          <p className="text-text-primary text-sm font-medium mb-3">Legal Acknowledgement *</p>
          <div
            className="rounded-xl px-4 py-4 space-y-3"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}
          >
            <label className="flex items-start gap-3 cursor-pointer group">
              <input type="checkbox" className="sr-only" checked={agreedToTerms}
                onChange={e => setAgreedToTerms(e.target.checked)} />
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200"
                style={{
                  background: agreedToTerms ? 'linear-gradient(135deg, #f59e0b, #fbbf24)' : 'var(--bg-elevated)',
                  border: agreedToTerms ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid var(--border-color)',
                  boxShadow: agreedToTerms ? '0 0 0 3px rgba(245,159,11,0.15)' : 'none',
                }}
              >
                {agreedToTerms && <CheckCircle2 size={12} className="text-white" />}
              </div>
              <span className="text-text-secondary text-xs leading-relaxed group-hover:text-text-primary transition-colors">
                I have read and agree to TRADINGO's{' '}
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-[#fbbf24] underline hover:text-[#fde68a]">Terms &amp; Conditions</a>,{' '}
                <a href="/disclaimer" target="_blank" rel="noopener noreferrer" className="text-[#fbbf24] underline hover:text-[#fde68a]">Disclaimer</a> and{' '}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-[#fbbf24] underline hover:text-[#fde68a]">Privacy Policy</a>
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer group">
              <input type="checkbox" className="sr-only" checked={agreedToPrivacyPolicy}
                onChange={e => setAgreedToPrivacyPolicy(e.target.checked)} />
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200"
                style={{
                  background: agreedToPrivacyPolicy ? 'linear-gradient(135deg, #f59e0b, #fbbf24)' : 'var(--bg-elevated)',
                  border: agreedToPrivacyPolicy ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid var(--border-color)',
                  boxShadow: agreedToPrivacyPolicy ? '0 0 0 3px rgba(245,159,11,0.15)' : 'none',
                }}
              >
                {agreedToPrivacyPolicy && <CheckCircle2 size={12} className="text-white" />}
              </div>
              <span className="text-text-secondary text-xs leading-relaxed group-hover:text-text-primary transition-colors">
                I confirm the information provided is accurate and consent to the processing of my business information by TRADINGO
              </span>
            </label>
          </div>
          {errors.legal && <p className="text-red-400 text-xs mt-2">{errors.legal}</p>}
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onBack} className="flex-1 py-3 rounded-xl text-sm font-medium transition-all" style={btnSecondary}>Back</button>
          <button onClick={handleSubmit}
            disabled={!agreedToTerms || !agreedToPrivacyPolicy}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
            style={{ ...btnPrimary, opacity: !agreedToTerms || !agreedToPrivacyPolicy ? 0.5 : 1, cursor: !agreedToTerms || !agreedToPrivacyPolicy ? 'not-allowed' : 'pointer' }}>
            Continue
          </button>
        </div>
      </div>
    </StepCard>
  )
}
