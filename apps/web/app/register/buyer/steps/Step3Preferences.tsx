'use client'

import { useState } from 'react'
import type { BuyerPreferencesForm, BuyerRegistrationState } from '@/types/buyer-registration'
import StepCard from '../components/StepCard'
import FormField from '../components/FormField'

const INPUT_CLASS = 'w-full px-4 py-3 rounded-xl text-white text-sm placeholder-white/25 focus:outline-none transition-all duration-200'
const inputStyle = (hasError: boolean) => ({
  background: 'rgba(255,255,255,0.06)',
  border: hasError ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.1)',
  boxShadow: hasError ? '0 0 0 3px rgba(239,68,68,0.1)' : 'none',
})
const btnPrimary = { background: 'linear-gradient(135deg, #FF4D00, #FF7A3D)', color: '#fff', boxShadow: '0 4px 16px rgba(255,77,0,0.3)' }
const btnSecondary = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }

import { CATALOG_CATEGORIES } from '@/data/catalog-data'

const CATEGORIES = CATALOG_CATEGORIES.map(c => c.name)

const SUPPLIER_OPTIONS: { value: BuyerPreferencesForm['preferredSuppliers']; label: string; desc: string }[] = [
  { value: 'local', label: 'Local', desc: 'Within my city' },
  { value: 'state', label: 'State', desc: 'Within my state' },
  { value: 'pan_india', label: 'Pan India', desc: 'Across India' },
  { value: 'global', label: 'Global', desc: 'International suppliers' },
]

interface Props {
  data: BuyerRegistrationState
  onNext: (data: Partial<BuyerPreferencesForm>) => void
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
  const [errors, setErrors] = useState<{ categories?: string }>({})

  const toggleCategory = (cat: string) => {
    setPrimaryCategories(prev => {
      if (prev.includes(cat)) return prev.filter(c => c !== cat)
      if (prev.length >= 10) return prev
      return [...prev, cat]
    })
  }

  const handleSubmit = () => {
    if (primaryCategories.length === 0) {
      setErrors({ categories: 'Select at least 1 category' })
      return
    }
    setErrors({})
   onNext({
  primaryCategories,
  preferredSuppliers,
  notificationEmail,
  notificationSms,
  newsletter,
})
  }

  const Toggle = ({ checked, onToggle }: { checked: boolean; onToggle: () => void }) => (
    <button
      type="button"
      onClick={onToggle}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200"
      style={{ background: checked ? '#FF4D00' : 'rgba(255,255,255,0.15)' }}
    >
      <span
        className="inline-block h-4 w-4 rounded-full bg-white transition-transform duration-200"
        style={{ transform: checked ? 'translateX(22px)' : 'translateX(3px)' }}
      />
    </button>
  )

  return (
    <StepCard title="Preferences & Notifications" subtitle="Tell us what you're looking for">
      <div className="space-y-8">
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-white/90 text-sm font-medium">Primary Categories *</p>
            <span className="text-xs text-white/40">{primaryCategories.length}/10 selected</span>
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
                    background: selected ? 'rgba(255,77,0,0.1)' : 'rgba(255,255,255,0.04)',
                    border: selected ? '1px solid rgba(255,77,0,0.6)' : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <span className={selected ? 'text-[#FF7A3D]' : 'text-white/60'}>{cat}</span>
                </button>
              );
            })}
          </div>
          {errors.categories && <p className="text-red-400 text-xs mt-2">{errors.categories}</p>}
        </div>

        <div>
          <p className="text-white/90 text-sm font-medium mb-3">Preferred Supplier Region *</p>
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
                    background: selected ? 'rgba(255,77,0,0.1)' : 'rgba(255,255,255,0.04)',
                    border: selected ? '1px solid rgba(255,77,0,0.6)' : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <p className={`text-sm font-medium ${selected ? 'text-[#FF7A3D]' : 'text-white/80'}`}>{opt.label}</p>
                  <p className="text-xs text-white/40 mt-0.5">{opt.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-white/90 text-sm font-medium">Notification Settings</p>
          <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="text-sm text-white/70">Email notifications for RFQ updates</span>
            <Toggle checked={notificationEmail} onToggle={() => setNotificationEmail(p => !p)} />
          </div>
          <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="text-sm text-white/70">SMS alerts for urgent orders</span>
            <Toggle checked={notificationSms} onToggle={() => setNotificationSms(p => !p)} />
          </div>
          <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="text-sm text-white/70">Subscribe to TRADINGO marketplace newsletter</span>
            <Toggle checked={newsletter} onToggle={() => setNewsletter(p => !p)} />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onBack} className="flex-1 py-3 rounded-xl text-sm font-medium transition-all" style={btnSecondary}>Back</button>
          <button onClick={handleSubmit} className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all" style={btnPrimary}>Continue</button>
        </div>
      </div>
    </StepCard>
  )
}