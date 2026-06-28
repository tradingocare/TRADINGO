'use client'

import { useState, useCallback } from 'react'
import { Briefcase } from 'lucide-react'
import type { CompanyProfileForm } from '@/types/buyer-registration'
import StepCard from '../../vendor/components/StepCard'
import FormField from '../../vendor/components/FormField'

const INPUT_CLASS = 'w-full px-4 py-3 rounded-xl text-white text-sm placeholder-white/25 focus:outline-none transition-all duration-200'
const inputStyle = (hasError: boolean) => ({
  background: 'rgba(255,255,255,0.06)',
  border: hasError ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.1)',
  boxShadow: hasError ? '0 0 0 3px rgba(239,68,68,0.1)' : 'none',
})
const btnPrimary = { background: 'linear-gradient(135deg, #FF4D00, #FF7A3D)', color: '#fff', boxShadow: '0 4px 16px rgba(255,77,0,0.3)' }
const btnSecondary = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }

const DESIGNATIONS = ['Proprietor', 'Partner', 'Director', 'CEO/MD', 'Procurement Manager', 'Purchase Head', 'Manager', 'Other']

const BUSINESS_TYPES: { value: CompanyProfileForm['companyType']; label: string; desc: string }[] = [
  { value: 'individual', label: 'Individual', desc: 'Self-employed or sole proprietorship' },
  { value: 'partnership', label: 'Partnership', desc: '2+ partners in business' },
  { value: 'private_limited', label: 'Private Limited', desc: 'Registered private limited company' },
  { value: 'llp', label: 'LLP', desc: 'Limited Liability Partnership' },
  { value: 'public_limited', label: 'Public Limited', desc: 'Listed or unlisted public company' },
]

const YEARS = Array.from({ length: 60 }, (_, i) => new Date().getFullYear() - i)

import { CATALOG_CATEGORIES } from '@/data/catalog-data'

const INDUSTRIES = CATALOG_CATEGORIES.map(c => c.name)

const COMPANY_SIZES = ['Just Me', '2-10', '11-50', '51-200', '201-500', '500+']

const ANNUAL_PROCUREMENT = ['Below 10L', '10L-50L', '50L-1Cr', '1Cr-5Cr', '5Cr-25Cr', '25Cr-100Cr', 'Above 100Cr']

interface Props {
  data: Partial<CompanyProfileForm>
  onNext: (data: CompanyProfileForm) => void
  onBack: () => void
}

export default function Step2CompanyProfile({ data, onNext, onBack }: Props) {
  const [form, setForm] = useState<Partial<CompanyProfileForm>>({
    companyName: '',
    companyType: undefined,
    yearEstablished: '',
    industry: '',
    companySize: '',
    annualProcurement: '',
    gstNumber: '',
    website: '',
    designation: '',
    ...data,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const set = useCallback((key: keyof CompanyProfileForm, value: unknown) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: '' }))
  }, [])

  const markTouched = useCallback((field: string) => setTouched(prev => ({ ...prev, [field]: true })), [])

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!form.companyName?.trim()) errs.companyName = 'Company name is required'
    else if (form.companyName.trim().length < 3) errs.companyName = 'Minimum 3 characters'
    else if (form.companyName.trim().length > 100) errs.companyName = 'Maximum 100 characters'
    if (!form.designation) errs.designation = 'Select designation'
    if (!form.companyType) errs.companyType = 'Select business type'
    if (!form.yearEstablished) errs.yearEstablished = 'Select year established'
    if (!form.industry) errs.industry = 'Select industry'
    if (!form.companySize) errs.companySize = 'Select company size'
    if (!form.annualProcurement) errs.annualProcurement = 'Select annual procurement'
    if (form.gstNumber && form.gstNumber.length !== 15) errs.gstNumber = 'GSTIN must be 15 characters'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleNext = () => {
    if (!validate()) return
    onNext({
      companyName: form.companyName!.trim(),
      companyType: form.companyType!,
      yearEstablished: form.yearEstablished!,
      industry: form.industry!,
      companySize: form.companySize!,
      annualProcurement: form.annualProcurement!,
      gstNumber: form.gstNumber?.trim() || undefined,
      website: form.website?.trim() || undefined,
      designation: form.designation!,
    })
  }

  return (
    <StepCard
      icon={<Briefcase size={20} style={{ color: '#FF4D00' }} />}
      title="Company Profile"
      subtitle="Tell us about your business"
    >
      <div className="space-y-5">
        <FormField label="Company Name" required hint="As registered with your company" error={touched.companyName ? errors.companyName : undefined}>
          <input className={INPUT_CLASS} style={inputStyle(!!errors.companyName && touched.companyName)} placeholder="Company name"
            value={form.companyName || ''} onChange={e => set('companyName', e.target.value)} onBlur={() => markTouched('companyName')} />
        </FormField>

        <FormField label="Designation" required error={touched.designation ? errors.designation : undefined}>
          <select className={INPUT_CLASS} style={{ ...inputStyle(!!errors.designation && touched.designation), color: form.designation ? '#fff' : 'rgba(255,255,255,0.25)' }}
            value={form.designation || ''} onChange={e => { set('designation', e.target.value); markTouched('designation') }}>
            <option value="" disabled className="bg-[#1D0001]">Select designation</option>
            {DESIGNATIONS.map(d => <option key={d} value={d} className="bg-[#1D0001]">{d}</option>)}
          </select>
        </FormField>

        <FormField label="Company Type" required error={touched.companyType ? errors.companyType : undefined}>
          <div className="grid grid-cols-2 gap-2">
            {BUSINESS_TYPES.map(bt => {
              const selected = form.companyType === bt.value
              return (
                <button key={bt.value} type="button" onClick={() => { set('companyType', bt.value); markTouched('companyType') }}
                  className="px-3 py-2.5 rounded-xl text-xs font-medium text-left transition-all duration-200"
                  style={{
                    background: selected ? 'rgba(255,77,0,0.15)' : 'rgba(255,255,255,0.04)',
                    border: selected ? '1px solid rgba(255,77,0,0.5)' : '1px solid rgba(255,255,255,0.08)',
                    color: selected ? '#FF7A3D' : 'rgba(255,255,255,0.7)',
                  }}>
                  <p className="font-semibold">{bt.label}</p>
                  <p className="text-[10px] mt-0.5 text-white/40">{bt.desc}</p>
                </button>
              )
            })}
          </div>
        </FormField>

        <FormField label="Year Established" required error={touched.yearEstablished ? errors.yearEstablished : undefined}>
          <select className={INPUT_CLASS} style={{ ...inputStyle(!!errors.yearEstablished && touched.yearEstablished), color: form.yearEstablished ? '#fff' : 'rgba(255,255,255,0.25)' }}
            value={form.yearEstablished || ''} onChange={e => { set('yearEstablished', e.target.value); markTouched('yearEstablished') }}>
            <option value="" disabled className="bg-[#1D0001]">Select year</option>
            {YEARS.map(y => <option key={y} value={y} className="bg-[#1D0001]">{y}</option>)}
          </select>
        </FormField>

        <FormField label="Industry" required error={touched.industry ? errors.industry : undefined}>
          <select className={INPUT_CLASS} style={{ ...inputStyle(!!errors.industry && touched.industry), color: form.industry ? '#fff' : 'rgba(255,255,255,0.25)' }}
            value={form.industry || ''} onChange={e => { set('industry', e.target.value); markTouched('industry') }}>
            <option value="" disabled className="bg-[#1D0001]">Select industry</option>
            {INDUSTRIES.map(i => <option key={i} value={i} className="bg-[#1D0001]">{i}</option>)}
          </select>
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Company Size" required error={touched.companySize ? errors.companySize : undefined}>
            <select className={INPUT_CLASS} style={{ ...inputStyle(!!errors.companySize && touched.companySize), color: form.companySize ? '#fff' : 'rgba(255,255,255,0.25)' }}
              value={form.companySize || ''} onChange={e => { set('companySize', e.target.value); markTouched('companySize') }}>
              <option value="" disabled className="bg-[#1D0001]">Select</option>
              {COMPANY_SIZES.map(s => <option key={s} value={s} className="bg-[#1D0001]">{s}</option>)}
            </select>
          </FormField>

          <FormField label="Annual Procurement" required error={touched.annualProcurement ? errors.annualProcurement : undefined}>
            <select className={INPUT_CLASS} style={{ ...inputStyle(!!errors.annualProcurement && touched.annualProcurement), color: form.annualProcurement ? '#fff' : 'rgba(255,255,255,0.25)' }}
              value={form.annualProcurement || ''} onChange={e => { set('annualProcurement', e.target.value); markTouched('annualProcurement') }}>
              <option value="" disabled className="bg-[#1D0001]">Select</option>
              {ANNUAL_PROCUREMENT.map(a => <option key={a} value={a} className="bg-[#1D0001]">{a}</option>)}
            </select>
          </FormField>
        </div>

        <FormField label="GST Number" error={touched.gstNumber ? errors.gstNumber : undefined}>
          <input className={INPUT_CLASS} style={inputStyle(!!errors.gstNumber && touched.gstNumber)} placeholder="15-character GSTIN" maxLength={15}
            value={form.gstNumber || ''} onChange={e => set('gstNumber', e.target.value.toUpperCase())} onBlur={() => markTouched('gstNumber')} />
        </FormField>

        <FormField label="Website" error={touched.website ? errors.website : undefined}>
          <input className={INPUT_CLASS} style={inputStyle(!!errors.website && touched.website)} placeholder="https://yourcompany.com" type="url"
            value={form.website || ''} onChange={e => set('website', e.target.value)} onBlur={() => markTouched('website')} />
        </FormField>

        <div className="flex gap-3">
          <button onClick={onBack} className="flex-1 py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-80" style={btnSecondary}>← Back</button>
          <button onClick={handleNext} className="flex-1 py-3.5 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98]" style={btnPrimary}>Continue →</button>
        </div>
      </div>
    </StepCard>
  )
}