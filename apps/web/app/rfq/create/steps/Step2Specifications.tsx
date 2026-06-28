"use client"

import React from 'react'
import FormField from './vendor-registration/components/FormField'
const INPUT_CLASS = 'w-full px-4 py-3 rounded-xl text-white text-sm placeholder-white/25 focus:outline-none transition-all duration-200'

const inputStyle = (hasError: boolean) => ({
  background: 'rgba(255,255,255,0.06)',
  border: hasError ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.1)',
  boxShadow: hasError ? '0 0 0 3px rgba(239,68,68,0.1)' : 'none',
})

export interface RfqForm {
  title: string
  category: string
  description: string
  quantity: string
  unit: string
  technicalRequirements: string
  qualityStandards: string
  deliveryLocation: string
  preferredRegions: string
  deliveryTimeline: string
  paymentTerms: string
  agreeToTerms: boolean
}

interface Step2SpecificationsProps {
  form: RfqForm
  errors: Record<string, string>
  update: (key: keyof RfqForm, value: string) => void
}

export default function Step2Specifications({ form, errors, update }: Step2SpecificationsProps) {
  const regions = [
    "North", "South", "East", "West", "Northeast", "Northwest",
    "Southeast", "Southwest"
  ]
  
  const paymentTerms = [
    "Net 30", "Net 45", "Net 60", "Net 90", "Letter of Credit",
    "Cash on Delivery", "Wire Transfer", "Escrow"
  ]
  
  return (
    <div className="space-y-4">
      <FormField label="Technical Requirements" required hint="Technical specifications and requirements (minimum 30 characters)" error={errors.technicalRequirements}>
        <textarea
          className={INPUT_CLASS}
          style={{ ...inputStyle(!!errors.technicalRequirements), minHeight: '100px', resize: 'vertical' }}
          value={form.technicalRequirements}
          onChange={e => update('technicalRequirements', e.target.value)}
          placeholder="e.g. Grade: AISI 1020, Size: 2x4 Inches, Surface Finish: Mill Finish, Packaging: PALLETS (40 pcs/pallet)"
          maxLength={2000}
          rows={4}
        />
        <div className="flex justify-between mt-1">
          {errors.technicalRequirements ? (
            <p className="text-red-400 text-xs">{errors.technicalRequirements}</p>
          ) : <span />}
          <span className="text-white/20 text-xs">{form.technicalRequirements.length}/2000</span>
        </div>
      </FormField>

      <FormField label="Quality Standards" hint="Quality standards to be met (optional)" error={errors.qualityStandards}>
        <textarea
          className={INPUT_CLASS}
          style={{ ...inputStyle(!!errors.qualityStandards), minHeight: '80px', resize: 'vertical' }}
          value={form.qualityStandards}
          onChange={e => update('qualityStandards', e.target.value)}
          placeholder="e.g. ISO 9001, ASTM, DIN, customer-specific requirements"
          maxLength={500}
          rows={2}
        />
        <span className="text-white/20 text-xs">{form.qualityStandards.length}/500</span>
      </FormField>

      <FormField label="Delivery Location" required hint="Full delivery address or city/region" error={errors.deliveryLocation}>
        <input
          className={INPUT_CLASS}
          style={inputStyle(!!errors.deliveryLocation)}
          value={form.deliveryLocation}
          onChange={e => update('deliveryLocation', e.target.value)}
          placeholder="e.g. New Delhi, Delhi, 110001 OR Pimple Saudagar, Pune, Maharashtra"
          maxLength={200}
        />
      </FormField>

      <FormField label="Preferred Regions" hint="Geographic preferences (optional)" error={errors.preferredRegions}>
        <select
          className={INPUT_CLASS}
          style={{ ...inputStyle(!!errors.preferredRegions), appearance: 'none' }}
          value={form.preferredRegions}
          onChange={e => update('preferredRegions', e.target.value)}
        >
          <option value="" style={{ background: '#1D0001', color: 'rgba(255,255,255,0.5)' }}>Select preferred region</option>
          {regions.map(r => (
            <option key={r} value={r} style={{ background: '#1D0001' }}>{r}</option>
          ))}
        </select>
      </FormField>

      <FormField label="Delivery Timeline" required hint="Expected delivery timeframe" error={errors.deliveryTimeline}>
        <input
          className={INPUT_CLASS}
          style={inputStyle(!!errors.deliveryTimeline)}
          value={form.deliveryTimeline}
          onChange={e => update('deliveryTimeline', e.target.value)}
          placeholder="e.g. 3 weeks, 45 days, Within June 2026"
          maxLength={100}
        />
      </FormField>

      <FormField label="Payment Terms" hint="Preferred payment terms (optional)" error={errors.paymentTerms}>
        <select
          className={INPUT_CLASS}
          style={{ ...inputStyle(!!errors.paymentTerms), appearance: 'none' }}
          value={form.paymentTerms}
          onChange={e => update('paymentTerms', e.target.value)}
        >
          <option value="" style={{ background: '#1D0001', color: 'rgba(255,255,255,0.5)' }}>Select payment terms</option>
          {paymentTerms.map(p => (
            <option key={p} value={p} style={{ background: '#1D0001' }}>{p}</option>
          ))}
        </select>
      </FormField>
    </div>
  )
}