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

interface Step3ReviewProps {
  form: RfqForm
  errors: Record<string, string>
  update: (key: keyof RfqForm, value: RfqFormValue) => void
  onSubmit: () => void
}

export default function Step3Review({ form, errors, update, onSubmit }: Step3ReviewProps) {
  const requiredAgreements = [form.agreeToTerms]

  const isSubmitDisabled = !form.agreeToTerms

  const formatFieldValue = (key: string, value: RfqFormValue): string => {
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No'
    }

    if (!value || value.trim() === '') {
      return 'Not provided'
    }

    if (key === 'description' || key === 'technicalRequirements' || key === 'qualityStandards') {
      if (value.length > 100) {
        return `${value.substring(0, 100)}...`
      }
      return value
    }

    if (typeof value === 'string') {
      return value
    }

    return String(value)
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-white/50 mb-4">
        Please review all your RFQ details before submitting. You can edit any field by going back to previous steps.
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
        {[
          { label: 'RFQ Title', value: form.title, key: 'title' },
          { label: 'Category', value: form.category, key: 'category' },
          { label: 'Description', value: form.description, key: 'description' },
          { label: 'Quantity', value: form.quantity, key: 'quantity' },
          { label: 'Unit', value: form.unit, key: 'unit' },
          { label: 'Technical Requirements', value: form.technicalRequirements, key: 'technicalRequirements' },
          { label: 'Quality Standards', value: form.qualityStandards, key: 'qualityStandards' },
          { label: 'Delivery Location', value: form.deliveryLocation, key: 'deliveryLocation' },
          { label: 'Preferred Regions', value: form.preferredRegions, key: 'preferredRegions' },
          { label: 'Delivery Timeline', value: form.deliveryTimeline, key: 'deliveryTimeline' },
          { label: 'Payment Terms', value: form.paymentTerms, key: 'paymentTerms' },
        ].map((item) => (
          <div
            key={item.key}
            className="flex justify-between items-start py-2 border-b border-white/5"
          >
            <span className="text-white/40 text-sm w-40 flex-shrink-0">{item.label}</span>
            <span className="text-white text-sm text-right flex-1">
              {formatFieldValue(item.key, item.value as any)}
            </span>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-white/10">
        <FormField label="Terms & Conditions" required error={errors.agreeToTerms}>
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={form.agreeToTerms}
              onChange={e => update('agreeToTerms', e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded accent-[#FF4D00]"
            />
            <div className="text-white/50 text-sm group-hover:text-white/70 transition-colors">
              <span className="text-red-400 mr-1">*</span>I agree that the above RFQ details are accurate and I intend to proceed with this request for quotation.
            </div>
          </label>
        </FormField>
      </div>

      <div className="bg-white/5 rounded-lg p-3 mt-4">
        <div className="text-white/60 text-xs">
          <div className="font-medium text-white/80 mb-1">Important Notes:</div>
          <ul className="space-y-1 ml-4 list-disc text-white/50">
            <li>All submitted RFQs are non-binding requests for quotation</li>
            <li>Response time typically varies by seller and RFQ complexity</li>
            <li>You may receive multiple quotes from different sellers</li>
            <li>Contact sellers directly through the RFQ response section</li>
          </ul>
        </div>
      </div>
    </div>
  )
}