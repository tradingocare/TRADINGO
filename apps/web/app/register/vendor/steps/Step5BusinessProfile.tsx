'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Briefcase, Upload, X, ChevronDown, MapPin } from 'lucide-react'
import StepCard from '../components/StepCard'
import FormField from '../components/FormField'
import { lookupPincode } from '@/lib/utils/india-lookup'
import type { BusinessProfileForm } from '@/types/vendor-registration'

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

const LEAD_TIMES = [
  'Same day / Ready stock', '1-3 days', '4-7 days', '1-2 weeks', '2-4 weeks', '4-8 weeks', 'Depends on order size',
]

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
  data: Partial<BusinessProfileForm>
  onNext: (data: BusinessProfileForm) => void
  onBack: () => void
}

export default function Step5BusinessProfile({ data, onNext, onBack }: Props) {
  const [form, setForm] = useState<Partial<BusinessProfileForm>>({
    description: '',
    tagline: '',
    primaryCategory: '',
    secondaryCategories: [],
    productTypes: '',
    moqRange: '',
    supplyCapacity: '',
    leadTime: '',
    exportCapability: false,
    exportCountries: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    district: '',
    state: '',
    pincode: '',
    ...data,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [catSearch, setCatSearch] = useState('')
  const [showCatDropdown, setShowCatDropdown] = useState(false)
  const [pincodeLookup, setPincodeLookup] = useState<string>('')
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const logoRef = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)
  const catDropdownRef = useRef<HTMLDivElement>(null)
  const [showSecondary, setShowSecondary] = useState(false)
  const [secSearch, setSecSearch] = useState('')

  useEffect(() => {
    if (form.logo && form.logo instanceof File) {
      const url = URL.createObjectURL(form.logo)
      setLogoPreview(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [form.logo])

  useEffect(() => {
    if (form.bannerImage && form.bannerImage instanceof File) {
      const url = URL.createObjectURL(form.bannerImage)
      setBannerPreview(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [form.bannerImage])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target as Node)) {
        setShowCatDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const set = useCallback((key: keyof BusinessProfileForm, value: unknown) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: '' }))
  }, [])

  const pincodeLookupTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const handlePincode = useCallback((val: string) => {
    set('pincode', val)
    setPincodeLookup('')
    if (val.length === 6 && /^\d{6}$/.test(val)) {
      clearTimeout(pincodeLookupTimeout.current)
      pincodeLookupTimeout.current = setTimeout(async () => {
        const result = await lookupPincode(val)
        if (result) {
          setPincodeLookup(`✓ Location found: ${result.city}, ${result.state}`)
          set('city', result.city)
          set('district', result.district)
          set('state', result.state)
        }
      }, 400)
    }
  }, [set])

  const filteredCategories = CATEGORIES.filter(c =>
    c.toLowerCase().includes(catSearch.toLowerCase())
  )

  const filteredSecondary = CATEGORIES.filter(c =>
    c.toLowerCase().includes(secSearch.toLowerCase()) &&
    c !== form.primaryCategory &&
    !(form.secondaryCategories || []).includes(c)
  )

  const addSecondary = (cat: string) => {
    const current = form.secondaryCategories || []
    if (current.length < 5) {
      set('secondaryCategories', [...current, cat])
    }
    setSecSearch('')
    setShowSecondary(false)
  }

  const removeSecondary = (cat: string) => {
    set('secondaryCategories', (form.secondaryCategories || []).filter(c => c !== cat))
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      set('logo', file)
    }
  }

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      set('bannerImage', file)
    }
  }

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!form.description || form.description.length < 50) errs.description = 'Description must be at least 50 characters'
    if (form.description && form.description.length > 500) errs.description = 'Description must be under 500 characters'
    if (!form.primaryCategory) errs.primaryCategory = 'Select a primary category'
    if (!form.productTypes) errs.productTypes = 'Enter product types'
    if (!form.moqRange) errs.moqRange = 'Enter MOQ range'
    if (!form.supplyCapacity) errs.supplyCapacity = 'Enter supply capacity'
    if (!form.leadTime) errs.leadTime = 'Select lead time'
    if (!form.addressLine1) errs.addressLine1 = 'Enter address'
    if (!form.pincode || !/^\d{6}$/.test(form.pincode || '')) errs.pincode = 'Enter valid 6-digit pincode'
    if (!form.city) errs.city = 'Enter city'
    if (!form.state) errs.state = 'Select state'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = () => {
    if (validate()) {
      onNext(form as BusinessProfileForm)
    }
  }

  return (
    <StepCard
      icon={<Briefcase size={20} style={{ color: '#FF4D00' }} />}
      title="Business Profile"
      subtitle="Tell us about your business and location"
    >
      <div className="flex flex-col gap-5">
        <FormField label="Business Description" required error={errors.description}>
          <textarea
            className={INPUT_CLASS}
            style={{ ...inputStyle(!!errors.description), resize: 'none', minHeight: '100px' }}
            value={form.description || ''}
            onChange={e => set('description', e.target.value)}
            placeholder="Tell buyers about your business..."
            maxLength={500}
          />
          <div className="flex justify-end">
            <span className="text-white/25 text-[10px]">{(form.description || '').length}/500</span>
          </div>
        </FormField>

        <FormField label="Tagline" error={errors.tagline}>
          <input
            className={INPUT_CLASS}
            style={inputStyle(false)}
            value={form.tagline || ''}
            onChange={e => set('tagline', e.target.value)}
            placeholder="Your business tagline..."
            maxLength={100}
          />
          <div className="flex justify-end">
            <span className="text-white/25 text-[10px]">{(form.tagline || '').length}/100</span>
          </div>
        </FormField>

        <FormField label="Primary Category" required error={errors.primaryCategory}>
          <div className="relative" ref={catDropdownRef}>
            <input
              className={INPUT_CLASS}
              style={inputStyle(!!errors.primaryCategory)}
              value={form.primaryCategory || catSearch}
              onChange={e => {
                setCatSearch(e.target.value)
                set('primaryCategory', '')
                setShowCatDropdown(true)
              }}
              onFocus={() => setShowCatDropdown(true)}
              placeholder="Search categories..."
            />
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
            <AnimatePresence>
              {showCatDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute z-20 w-full mt-1 rounded-xl max-h-48 overflow-y-auto"
                  style={{ background: 'rgba(30,10,25,0.98)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  {filteredCategories.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => { set('primaryCategory', c); setCatSearch(''); setShowCatDropdown(false) }}
                      className="w-full text-left px-4 py-2.5 text-sm text-white/80 hover:text-white transition-colors"
                      style={{ background: c === form.primaryCategory ? 'rgba(255,77,0,0.12)' : 'transparent' }}
                    >
                      {c}
                    </button>
                  ))}
                  {filteredCategories.length === 0 && (
                    <p className="px-4 py-3 text-white/30 text-xs">No categories found</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </FormField>

        <FormField label="Secondary Categories" hint="Up to 5 categories (cannot include primary)">
          <div className="flex flex-wrap gap-2 mb-2">
            {(form.secondaryCategories || []).map(cat => (
              <span
                key={cat}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs text-white/80"
                style={{ background: 'rgba(255,77,0,0.12)', border: '1px solid rgba(255,77,0,0.3)' }}
              >
                {cat}
                <button type="button" onClick={() => removeSecondary(cat)} className="ml-0.5 text-white/50 hover:text-white">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
          {(form.secondaryCategories || []).length < 5 && (
            <div className="relative">
              <input
                className={INPUT_CLASS}
                style={inputStyle(false)}
                value={secSearch}
                onChange={e => { setSecSearch(e.target.value); setShowSecondary(true) }}
                onFocus={() => setShowSecondary(true)}
                placeholder="Add secondary category..."
              />
              <AnimatePresence>
                {showSecondary && secSearch && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute z-20 w-full mt-1 rounded-xl max-h-40 overflow-y-auto"
                    style={{ background: 'rgba(30,10,25,0.98)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    {filteredSecondary.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => addSecondary(c)}
                        className="w-full text-left px-4 py-2.5 text-sm text-white/80 hover:text-white transition-colors"
                      >
                        {c}
                      </button>
                    ))}
                    {filteredSecondary.length === 0 && (
                      <p className="px-4 py-3 text-white/30 text-xs">No matching categories</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </FormField>

        <FormField label="Product Types" required error={errors.productTypes}>
          <input
            className={INPUT_CLASS}
            style={inputStyle(!!errors.productTypes)}
            value={form.productTypes || ''}
            onChange={e => set('productTypes', e.target.value)}
            placeholder="MS Pipes, GI Pipes, TMT Bars..."
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="MOQ Range" required error={errors.moqRange}>
            <input
              className={INPUT_CLASS}
              style={inputStyle(!!errors.moqRange)}
              value={form.moqRange || ''}
              onChange={e => set('moqRange', e.target.value)}
              placeholder="e.g. 10 kg, 100 pieces"
            />
          </FormField>

          <FormField label="Supply Capacity" required error={errors.supplyCapacity}>
            <input
              className={INPUT_CLASS}
              style={inputStyle(!!errors.supplyCapacity)}
              value={form.supplyCapacity || ''}
              onChange={e => set('supplyCapacity', e.target.value)}
              placeholder="e.g. 500 units/month"
            />
          </FormField>
        </div>

        <FormField label="Lead Time" required error={errors.leadTime}>
          <div className="relative">
            <select
              className={INPUT_CLASS}
              style={{ ...inputStyle(!!errors.leadTime), appearance: 'none', cursor: 'pointer', color: form.leadTime ? '#fff' : 'rgba(255,255,255,0.25)' }}
              value={form.leadTime || ''}
              onChange={e => set('leadTime', e.target.value)}
            >
              <option value="" disabled>Select lead time...</option>
              {LEAD_TIMES.map(t => (
                <option key={t} value={t} style={{ background: '#1D0001', color: '#fff' }}>{t}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
          </div>
        </FormField>

        <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Export Capability</p>
              <p className="text-white/35 text-xs">Can you supply outside India?</p>
            </div>
            <button
              type="button"
              onClick={() => set('exportCapability', !form.exportCapability)}
              className="relative w-12 h-6 rounded-full transition-colors duration-200"
              style={{ background: form.exportCapability ? 'linear-gradient(135deg, #FF4D00, #FF7A3D)' : 'rgba(255,255,255,0.08)' }}
            >
              <span
                className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200"
                style={{ transform: form.exportCapability ? 'translateX(24px)' : 'translateX(0)' }}
              />
            </button>
          </div>
          <AnimatePresence>
            {form.exportCapability && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <input
                  className={INPUT_CLASS}
                  style={inputStyle(false)}
                  value={form.exportCountries || ''}
                  onChange={e => set('exportCountries', e.target.value)}
                  placeholder="Comma-separated countries (e.g. UAE, Saudi Arabia, Oman)"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
        <p className="text-white/40 text-xs font-semibold uppercase tracking-wider">Business Location</p>

        <FormField label="Address Line 1" required error={errors.addressLine1}>
          <input
            className={INPUT_CLASS}
            style={inputStyle(!!errors.addressLine1)}
            value={form.addressLine1 || ''}
            onChange={e => set('addressLine1', e.target.value)}
            placeholder="Street address..."
            maxLength={100}
          />
        </FormField>

        <FormField label="Address Line 2">
          <input
            className={INPUT_CLASS}
            style={inputStyle(false)}
            value={form.addressLine2 || ''}
            onChange={e => set('addressLine2', e.target.value)}
            placeholder="Landmark, area..."
            maxLength={100}
          />
        </FormField>

        <FormField label="Pincode" required error={errors.pincode}>
          <div className="relative">
            <input
              className={INPUT_CLASS}
              style={inputStyle(!!errors.pincode)}
              value={form.pincode || ''}
              onChange={e => handlePincode(e.target.value)}
              placeholder="6-digit pincode"
              maxLength={6}
              inputMode="numeric"
            />
            <MapPin size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
          </div>
          {pincodeLookup && (
            <p className="text-green-400 text-[10px] flex items-center gap-1">{pincodeLookup}</p>
          )}
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="City" required error={errors.city}>
            <input
              className={INPUT_CLASS}
              style={inputStyle(!!errors.city)}
              value={form.city || ''}
              onChange={e => set('city', e.target.value)}
              placeholder="City"
            />
          </FormField>

          <FormField label="District">
            <input
              className={INPUT_CLASS}
              style={inputStyle(false)}
              value={form.district || ''}
              onChange={e => set('district', e.target.value)}
              placeholder="District"
            />
          </FormField>
        </div>

        <FormField label="State" required error={errors.state}>
          <div className="relative">
            <select
              className={INPUT_CLASS}
              style={{ ...inputStyle(!!errors.state), appearance: 'none', cursor: 'pointer', color: form.state ? '#fff' : 'rgba(255,255,255,0.25)' }}
              value={form.state || ''}
              onChange={e => set('state', e.target.value)}
            >
              <option value="" disabled>Select state...</option>
              {INDIAN_STATES.map(s => (
                <option key={s} value={s} style={{ background: '#1D0001', color: '#fff' }}>{s}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
          </div>
        </FormField>

        <div className="h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Logo" hint="Strongly Recommended — Sellers with logos get 2x more clicks">
            <div
              onClick={() => logoRef.current?.click()}
              className="relative flex flex-col items-center justify-center gap-2 rounded-xl p-4 cursor-pointer transition-all duration-200 hover:border-[#FF4D00]/30"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.12)', minHeight: '120px' }}
            >
              {logoPreview ? (
                <img src={logoPreview} alt="Logo preview" className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <Upload size={20} className="text-white/25" />
              )}
              <p className="text-white/25 text-[10px]">{logoPreview ? 'Change logo' : 'Upload logo'}</p>
              <input ref={logoRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            </div>
          </FormField>

          <FormField label="Banner Image" hint="Landscape image recommended">
            <div
              onClick={() => bannerRef.current?.click()}
              className="relative flex flex-col items-center justify-center gap-2 rounded-xl p-4 cursor-pointer transition-all duration-200 hover:border-[#FF4D00]/30"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.12)', minHeight: '120px' }}
            >
              {bannerPreview ? (
                <img src={bannerPreview} alt="Banner preview" className="w-full h-20 rounded-lg object-cover" />
              ) : (
                <Upload size={20} className="text-white/25" />
              )}
              <p className="text-white/25 text-[10px]">{bannerPreview ? 'Change banner' : 'Upload banner'}</p>
              <input ref={bannerRef} type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
            </div>
          </FormField>
        </div>

        <div className="flex gap-3 mt-2">
          <button type="button" onClick={onBack}
            className="flex-1 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
            style={btnSecondary}>
            Back
          </button>
          <button type="button" onClick={handleSubmit}
            className="flex-1 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-200 hover:brightness-110"
            style={btnPrimary}>
            Continue
          </button>
        </div>
      </div>
    </StepCard>
  )
}
