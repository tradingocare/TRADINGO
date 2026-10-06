'use client'

import { useState, useCallback } from 'react'
import { Briefcase } from 'lucide-react'
import type { CompanyProfileForm, BusinessAddressForm } from '@/types/buyer-registration'
import { Select } from '@/components/ui/select'
import StepCard from '../../vendor/components/StepCard'
import FormField from '../../vendor/components/FormField'

const INPUT_CLASS = 'w-full px-4 py-3 rounded-xl text-text-primary text-sm placeholder:text-text-tertiary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:border-[var(--input-focus-border)] transition-all duration-200'
const inputStyle = (hasError: boolean) => ({
  background: 'var(--bg-elevated)',
  border: hasError ? '1px solid rgba(239,68,68,0.5)' : '1px solid var(--border-color)',
  boxShadow: hasError ? '0 0 0 3px rgba(239,68,68,0.1)' : undefined,
})
const btnPrimary = { background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', color: '#fff', boxShadow: '0 4px 16px rgba(245, 158, 11, 0.3)' }
const btnSecondary = { background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }

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

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
]

interface Props {
  data: Partial<CompanyProfileForm>
  addressData: Partial<BusinessAddressForm>
  onNext: (data: CompanyProfileForm, address: BusinessAddressForm) => void
  onBack: () => void
}

export default function Step2CompanyProfile({ data, addressData, onNext, onBack }: Props) {
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
  const [address, setAddress] = useState<Partial<BusinessAddressForm>>({
    addressLine1: '',
    addressLine2: '',
    city: '',
    district: '',
    state: '',
    pincode: '',
    ...addressData,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const set = useCallback((key: keyof CompanyProfileForm, value: unknown) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: '' }))
  }, [])

  const markTouched = useCallback((field: string) => setTouched(prev => ({ ...prev, [field]: true })), [])

  const setAddressField = useCallback((key: keyof BusinessAddressForm, value: string) => {
    setAddress(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: '' }))
  }, [])

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
    if (!address.addressLine1?.trim()) errs.addressLine1 = 'Address is required'
    else if (address.addressLine1.trim().length < 5) errs.addressLine1 = 'Minimum 5 characters'
    if (!address.city?.trim()) errs.city = 'City is required'
    if (!address.district?.trim()) errs.district = 'District is required'
    if (!address.state) errs.state = 'Select state'
    if (!/^\d{6}$/.test(address.pincode || '')) errs.pincode = 'Enter a valid 6-digit pincode'
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
    }, {
      addressLine1: address.addressLine1!.trim(),
      addressLine2: address.addressLine2?.trim() || undefined,
      city: address.city!.trim(),
      district: address.district!.trim(),
      state: address.state!,
      pincode: address.pincode!,
    })
  }

  return (
    <StepCard
      icon={<Briefcase size={20} style={{ color: '#f59e0b' }} />}
      title="Company Profile"
      subtitle="Tell us about your business"
    >
      <div className="space-y-5">
        <FormField label="Company Name" required hint="As registered with your company" error={touched.companyName ? errors.companyName : undefined}>
          <input className={INPUT_CLASS} style={inputStyle(!!errors.companyName && touched.companyName)} placeholder="Company name"
            value={form.companyName || ''} onChange={e => set('companyName', e.target.value)} onBlur={() => markTouched('companyName')} />
        </FormField>

        <FormField label="Designation" required error={touched.designation ? errors.designation : undefined}>
          <Select value={form.designation || ''} onChange={e => { set('designation', e.target.value); markTouched('designation') }}>
            <option value="" disabled>Select designation</option>
            {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
          </Select>
        </FormField>

        <FormField label="Company Type" required error={touched.companyType ? errors.companyType : undefined}>
          <div className="grid grid-cols-2 gap-2">
            {BUSINESS_TYPES.map(bt => {
              const selected = form.companyType === bt.value
              return (
                <button key={bt.value} type="button" onClick={() => { set('companyType', bt.value); markTouched('companyType') }}
                  className="px-3 py-2.5 rounded-xl text-xs font-medium text-left transition-all duration-200"
                  style={{
                    background: selected ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-elevated)',
                    border: selected ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid var(--border-color)',
                    color: selected ? '#fbbf24' : 'var(--text-secondary)',
                  }}>
                  <p className="font-semibold">{bt.label}</p>
                  <p className="text-[10px] mt-0.5 text-text-tertiary">{bt.desc}</p>
                </button>
              )
            })}
          </div>
        </FormField>

        <FormField label="Year Established" required error={touched.yearEstablished ? errors.yearEstablished : undefined}>
          <Select value={form.yearEstablished || ''} onChange={e => { set('yearEstablished', e.target.value); markTouched('yearEstablished') }}>
            <option value="" disabled>Select year</option>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </Select>
        </FormField>

        <FormField label="Industry" required error={touched.industry ? errors.industry : undefined}>
          <Select value={form.industry || ''} onChange={e => { set('industry', e.target.value); markTouched('industry') }}>
            <option value="" disabled>Select industry</option>
            {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
          </Select>
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Company Size" required error={touched.companySize ? errors.companySize : undefined}>
            <Select value={form.companySize || ''} onChange={e => { set('companySize', e.target.value); markTouched('companySize') }}>
              <option value="" disabled>Select</option>
              {COMPANY_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </FormField>

          <FormField label="Annual Procurement" required error={touched.annualProcurement ? errors.annualProcurement : undefined}>
            <Select value={form.annualProcurement || ''} onChange={e => { set('annualProcurement', e.target.value); markTouched('annualProcurement') }}>
              <option value="" disabled>Select</option>
              {ANNUAL_PROCUREMENT.map(a => <option key={a} value={a}>{a}</option>)}
            </Select>
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

        <div className="pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <p className="text-text-primary text-sm font-semibold mb-4">Business Address</p>
          <div className="space-y-4">
            <FormField label="Address Line 1" required error={errors.addressLine1}>
              <input className={INPUT_CLASS} style={inputStyle(!!errors.addressLine1)} placeholder="Street, area, landmark"
                value={address.addressLine1 || ''} onChange={e => setAddressField('addressLine1', e.target.value)} />
            </FormField>

            <FormField label="Address Line 2" error={errors.addressLine2}>
              <input className={INPUT_CLASS} style={inputStyle(!!errors.addressLine2)} placeholder="Building, floor (optional)"
                value={address.addressLine2 || ''} onChange={e => setAddressField('addressLine2', e.target.value)} />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="City" required error={errors.city}>
                <input className={INPUT_CLASS} style={inputStyle(!!errors.city)} placeholder="City"
                  value={address.city || ''} onChange={e => setAddressField('city', e.target.value)} />
              </FormField>
              <FormField label="District" required error={errors.district}>
                <input className={INPUT_CLASS} style={inputStyle(!!errors.district)} placeholder="District"
                  value={address.district || ''} onChange={e => setAddressField('district', e.target.value)} />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="State" required error={errors.state}>
                <Select value={address.state || ''} onChange={e => setAddressField('state', e.target.value)}>
                  <option value="" disabled>Select state</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
              </FormField>
              <FormField label="Pincode" required error={errors.pincode}>
                <input className={INPUT_CLASS} style={inputStyle(!!errors.pincode)} placeholder="6-digit pincode" inputMode="numeric" maxLength={6}
                  value={address.pincode || ''} onChange={e => setAddressField('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} />
              </FormField>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onBack} className="flex-1 py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-80" style={btnSecondary}>← Back</button>
          <button onClick={handleNext} className="flex-1 py-3.5 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98]" style={btnPrimary}>Continue →</button>
        </div>
      </div>
    </StepCard>
  )
}
