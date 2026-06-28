"use client"

import React from 'react'
import FormField from './vendor-registration/components/FormField'

const INPUT_CLASS = 'w-full px-4 py-3 rounded-xl text-white text-sm placeholder-white/25 focus:outline-none transition-all duration-200'

const inputStyle = (hasError: boolean) => ({
  background: 'rgba(255,255,255,0.06)',
  border: hasError ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.1)',
  boxShadow: hasError ? '0 0 0 3px rgba(239,68,68,0.1)' : 'none',
})

export type RfqFormValue = string | boolean

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

interface Step1BasicProps {
  form: RfqForm
  errors: Record<string, string>
  update: (key: keyof RfqForm, value: RfqFormValue) => void
}

export default function Step1Basic({ form, errors, update }: Step1BasicProps) {
  return (
    <div className="space-y-4">
      <FormField label="RFQ Title" required hint="Clear, descriptive title for your RFQ" error={errors.title}>
        <input
          className={INPUT_CLASS}
          style={inputStyle(!!errors.title)}
          value={form.title}
          onChange={e => update('title', e.target.value)}
          placeholder="E.g. Industrial Milling Machine - Precision Required"
          maxLength={100}
        />
      </FormField>

      <FormField label="Category" required hint="Select the most relevant category" error={errors.category}>
        <select
          className={INPUT_CLASS}
          style={{ ...inputStyle(!!errors.category), appearance: 'none' }}
          value={form.category}
          onChange={e => update('category', e.target.value)}
        >
          <option value="" style={{ background: '#1D0001', color: 'rgba(255,255,255,0.5)' }}>Select a category</option>
          <option value="Automation" style={{ background: '#1D0001' }}>Automation</option>
          <option value="Material Handling" style={{ background: '#1D0001' }}>Material Handling</option>
          <option value="Industrial Equipment" style={{ background: '#1D0001' }}>Industrial Equipment</option>
          <option value="Machinery" style={{ background: '#1D0001' }}>Machinery</option>
          <option value="Tools & Hardware" style={{ background: '#1D0001' }}>Tools & Hardware</option>
          <option value="Construction Materials" style={{ background: '#1D0001' }}>Construction Materials</option>
          <option value="Electronics & Electrical" style={{ background: '#1D0001' }}>Electronics & Electrical</option>
          <option value="Plumbing & HVAC" style={{ background: '#1D0001' }}>Plumbing & HVAC</option>
        </select>
      </FormField>

      <FormField label="Description" required hint="Detailed description of requirements (minimum 20 characters)" error={errors.description}>
        <textarea
          className={INPUT_CLASS}
          style={{ ...inputStyle(!!errors.description), minHeight: '100px', resize: 'vertical' }}
          value={form.description}
          onChange={e => update('description', e.target.value)}
          placeholder="Describe your requirements in detail. Include material, specifications, quality standards, usage context, and any special considerations..."
          maxLength={1000}
          rows={4}
        />
        <div className="flex justify-between mt-1">
          <span className="text-white/20 text-xs">{form.description.length}/1000</span>
        </div>
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Quantity" hint="Number of units/items (optional)" error={errors.quantity}>
          <input
            className={INPUT_CLASS}
            style={inputStyle(!!errors.quantity)}
            type="number"
            min="1"
            value={form.quantity}
            onChange={e => update('quantity', e.target.value)}
            placeholder="e.g. 100"
          />
        </FormField>

        <FormField label="Unit" hint="Unit of measurement (optional)" error={errors.unit}>
          <select
            className={INPUT_CLASS}
            style={{ ...inputStyle(!!errors.unit), appearance: 'none' }}
            value={form.unit}
            onChange={e => update('unit', e.target.value)}
          >
            <option value="" style={{ background: '#1D0001', color: 'rgba(255,255,255,0.5)' }}>Select unit</option>
            <option value="pieces" style={{ background: '#1D0001' }}>pieces</option>
            <option value="kg" style={{ background: '#1D0001' }}>kg</option>
            <option value="tonnes" style={{ background: '#1D0001' }}>tonnes</option>
            <option value="meters" style={{ background: '#1D0001' }}>meters</option>
            <option value="liters" style={{ background: '#1D0001' }}>liters</option>
            <option value="boxes" style={{ background: '#1D0001' }}>boxes</option>
            <option value="sets" style={{ background: '#1D0001' }}>sets</option>
            <option value="pairs" style={{ background: '#1D0001' }}>pairs</option>
          </select>
        </FormField>
      </div>
    </div>
  )
}