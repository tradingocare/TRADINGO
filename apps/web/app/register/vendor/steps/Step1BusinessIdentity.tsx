'use client'

import { useState } from 'react'
import type { BusinessIdentityForm } from '@/types/vendor-registration'
import StepCard from '../components/StepCard'
import FormField from '../components/FormField'

const INPUT_CLASS = 'w-full px-4 py-3 rounded-xl text-white text-sm placeholder-white/25 focus:outline-none transition-all duration-200'
const inputStyle = (hasError: boolean) => ({
  background: 'rgba(255,255,255,0.06)',
  border: hasError ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.1)',
  boxShadow: hasError ? '0 0 0 3px rgba(239,68,68,0.1)' : 'none',
})
const btnPrimary = { background: 'linear-gradient(135deg, #FF4D00, #FF7A3D)', color: '#fff', boxShadow: '0 4px 16px rgba(255,77,0,0.3)' }

const BUSINESS_TYPES = [
  { value: 'sole_proprietorship', label: 'Sole Proprietorship', desc: 'Single owner' },
  { value: 'partnership', label: 'Partnership', desc: '2+ partners' },
  { value: 'private_limited', label: 'Private Limited', desc: 'Pvt Ltd company' },
  { value: 'llp', label: 'LLP', desc: 'Limited Liability Partnership' },
  { value: 'public_limited', label: 'Public Limited', desc: 'Listed/unlisted public company' },
  { value: 'huf', label: 'HUF', desc: 'Hindu Undivided Family' },
  { value: 'trust', label: 'Trust', desc: 'Charitable trust/NGO' },
  { value: 'other', label: 'Other', desc: 'Any other' },
]

const SELLER_TYPES = [
  { value: 'manufacturer', label: 'Manufacturer', desc: 'You make/produce' },
  { value: 'wholesaler', label: 'Wholesaler', desc: 'Buy and sell bulk' },
  { value: 'distributor', label: 'Distributor', desc: 'Distribute for brands' },
  { value: 'retailer', label: 'Retailer', desc: 'Sell to end buyers' },
  { value: 'service_provider', label: 'Service Provider', desc: 'Services not products' },
]

const EMPLOYEE_OPTIONS = ['Just Me', '2-10', '11-50', '51-200', '201-500', '500+']
const TURNOVER_OPTIONS = ['Below 10L', '10L-50L', '50L-1Cr', '1Cr-5Cr', '5Cr-25Cr', '25Cr-100Cr', 'Above 100Cr']

const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: currentYear - 1949 }, (_, i) => currentYear - i)

interface Props {
  data: Partial<BusinessIdentityForm>
  onNext: (data: BusinessIdentityForm) => void
}

export default function Step1BusinessIdentity({ data, onNext }: Props) {
  const [businessName, setBusinessName] = useState(data.businessName ?? '')
  const [tradeName, setTradeName] = useState(data.tradeName ?? '')
  const [businessType, setBusinessType] = useState(data.businessType ?? '')
  const [sellerType, setSellerType] = useState(data.sellerType ?? '')
  const [yearEstablished, setYearEstablished] = useState(data.yearEstablished ?? '')
  const [totalEmployees, setTotalEmployees] = useState(data.totalEmployees ?? '')
  const [annualTurnover, setAnnualTurnover] = useState(data.annualTurnover ?? '')
  const [website, setWebsite] = useState(data.website ?? '')

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!businessName.trim()) e.businessName = 'Business name is required'
    else if (businessName.trim().length < 3) e.businessName = 'Minimum 3 characters'
    else if (businessName.trim().length > 100) e.businessName = 'Maximum 100 characters'
    if (tradeName && tradeName.length > 80) e.tradeName = 'Maximum 80 characters'
    if (!businessType) e.businessType = 'Select a business type'
    if (!sellerType) e.sellerType = 'Select seller type'
    if (!yearEstablished) e.yearEstablished = 'Select year established'
    if (!totalEmployees) e.totalEmployees = 'Select employee count'
    if (!annualTurnover) e.annualTurnover = 'Select annual turnover'
    if (website && !/^https?:\/\/.+\..+/.test(website)) e.website = 'Enter a valid URL (https://...)'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleNext = () => {
    if (!validate()) return
    onNext({ businessName: businessName.trim(), tradeName: tradeName.trim() || undefined, businessType: businessType as BusinessIdentityForm['businessType'], sellerType: sellerType as BusinessIdentityForm['sellerType'], yearEstablished, totalEmployees, annualTurnover, website: website.trim() || undefined })
  }

  const markTouched = (field: string) => setTouched(prev => ({ ...prev, [field]: true }))

  const RadioCardGrid = ({ items, value, onChange, cols = 2 }: { items: { value: string; label: string; desc: string }[]; value: string; onChange: (v: string) => void; cols?: number }) => (
    <div className={`grid gap-2.5`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {items.map(item => {
        const selected = value === item.value
        return (
          <button key={item.value} type="button" onClick={() => onChange(item.value)}
            className="text-left p-3 rounded-xl transition-all duration-200"
            style={{
              background: selected ? 'rgba(255,77,0,0.1)' : 'rgba(255,255,255,0.03)',
              border: selected ? '1px solid rgba(255,77,0,0.5)' : '1px solid rgba(255,255,255,0.07)',
            }}>
            <p className="text-white text-xs font-semibold">{item.label}</p>
            <p className="text-white/40 text-[10px] mt-0.5">{item.desc}</p>
          </button>
        )
      })}
    </div>
  )

  return (
    <StepCard icon={<span className="text-lg">🏢</span>} title="Business Identity" subtitle="Tell us about your business">
      <div className="space-y-5">
        <FormField label="Business Name" required error={touched.businessName ? errors.businessName : undefined} hint="As registered with government/GST">
          <input className={INPUT_CLASS} style={inputStyle(!!errors.businessName && touched.businessName)} placeholder="e.g. Kumar Enterprises"
            value={businessName} onChange={e => setBusinessName(e.target.value)} onBlur={() => markTouched('businessName')} />
        </FormField>

        <FormField label="Trade Name" hint="The name customers know you by">
          <input className={INPUT_CLASS} style={inputStyle(!!errors.tradeName)} placeholder="e.g. Kumar Traders"
            value={tradeName} onChange={e => setTradeName(e.target.value)} onBlur={() => markTouched('tradeName')} />
        </FormField>

        <FormField label="Business Type" required error={touched.businessType ? errors.businessType : undefined}>
          <RadioCardGrid items={BUSINESS_TYPES} value={businessType} onChange={v => { setBusinessType(v); markTouched('businessType') }} />
        </FormField>

        <FormField label="Seller Type" required error={touched.sellerType ? errors.sellerType : undefined}>
          <RadioCardGrid items={SELLER_TYPES} value={sellerType} onChange={v => { setSellerType(v); markTouched('sellerType') }} />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Year Established" required error={touched.yearEstablished ? errors.yearEstablished : undefined}>
            <select className={INPUT_CLASS} style={inputStyle(!!errors.yearEstablished && touched.yearEstablished)}
              value={yearEstablished} onChange={e => { setYearEstablished(e.target.value); markTouched('yearEstablished') }}>
              <option value="" className="bg-[#1D0001]">Select year</option>
              {YEARS.map(y => <option key={y} value={y} className="bg-[#1D0001]">{y}</option>)}
            </select>
          </FormField>

          <FormField label="Total Employees" required error={touched.totalEmployees ? errors.totalEmployees : undefined}>
            <select className={INPUT_CLASS} style={inputStyle(!!errors.totalEmployees && touched.totalEmployees)}
              value={totalEmployees} onChange={e => { setTotalEmployees(e.target.value); markTouched('totalEmployees') }}>
              <option value="" className="bg-[#1D0001]">Select range</option>
              {EMPLOYEE_OPTIONS.map(o => <option key={o} value={o} className="bg-[#1D0001]">{o}</option>)}
            </select>
          </FormField>
        </div>

        <FormField label="Annual Turnover" required error={touched.annualTurnover ? errors.annualTurnover : undefined}>
          <select className={INPUT_CLASS} style={inputStyle(!!errors.annualTurnover && touched.annualTurnover)}
            value={annualTurnover} onChange={e => { setAnnualTurnover(e.target.value); markTouched('annualTurnover') }}>
            <option value="" className="bg-[#1D0001]">Select turnover range</option>
            {TURNOVER_OPTIONS.map(o => <option key={o} value={o} className="bg-[#1D0001]">{o}</option>)}
          </select>
        </FormField>

        <FormField label="Website" error={touched.website ? errors.website : undefined}>
          <input className={INPUT_CLASS} style={inputStyle(!!errors.website && touched.website)} placeholder="https://yourwebsite.com"
            value={website} onChange={e => setWebsite(e.target.value)} onBlur={() => markTouched('website')} />
        </FormField>

        <button onClick={handleNext}
          className="w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
          style={btnPrimary}>
          Continue →
        </button>
      </div>
    </StepCard>
  )
}
