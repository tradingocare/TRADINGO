'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CreditCard, Eye, EyeOff, Upload, Shield, Loader2, CheckCircle } from 'lucide-react'
import StepCard from '../components/StepCard'
import FormField from '../components/FormField'
import { lookupIfsc } from '@/lib/utils/india-lookup'
import type { BankDetailsForm } from '@/types/vendor-registration'

const INPUT_CLASS = 'w-full px-4 py-3 rounded-xl text-white text-sm placeholder-white/25 focus:outline-none transition-all duration-200'
const inputStyle = (hasError: boolean) => ({
  background: 'rgba(255,255,255,0.06)',
  border: hasError ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.1)',
  boxShadow: hasError ? '0 0 0 3px rgba(239,68,68,0.1)' : 'none',
})
const btnPrimary = { background: 'linear-gradient(135deg, #FF4D00, #FF7A3D)', color: '#fff', boxShadow: '0 4px 16px rgba(255,77,0,0.3)' }
const btnSecondary = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }

interface Props {
  data: Partial<BankDetailsForm>
  onNext: (data: BankDetailsForm) => void
  onBack: () => void
}

export default function Step6BankDetails({ data, onNext, onBack }: Props) {
  const [form, setForm] = useState<Partial<BankDetailsForm>>({
    accountHolderName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    bankName: '',
    branchName: '',
    accountType: 'current',
    ...data,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showAccount, setShowAccount] = useState(false)
  const [ifscVerified, setIfscVerified] = useState(false)
  const [ifscLoading, setIfscLoading] = useState(false)
  const [ifscError, setIfscError] = useState('')
  const [chequePreview, setChequePreview] = useState<string | null>(null)
  const chequeRef = useRef<HTMLInputElement>(null)

  const set = useCallback((key: keyof BankDetailsForm, value: unknown) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: '' }))
    if (key === 'ifscCode') {
      setIfscVerified(false)
      setIfscError('')
    }
  }, [])

  const handleIfscVerify = async () => {
    const ifsc = (form.ifscCode || '').toUpperCase().trim()
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
      setIfscError('Invalid IFSC format')
      return
    }
    setIfscLoading(true)
    setIfscError('')
    try {
      const result = await lookupIfsc(ifsc)
      if (result) {
        setIfscVerified(true)
        set('bankName', result.bankName)
        set('branchName', result.branch)
      } else {
        setIfscError('IFSC not found')
      }
    } catch {
      setIfscError('Verification failed')
    }
    setIfscLoading(false)
  }

  const handleChequeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      set('cancelledChequeImage', file)
      const url = URL.createObjectURL(file)
      setChequePreview(url)
    }
  }

  const maskedAccount = (val: string) => {
    if (!val) return ''
    if (showAccount) return val
    return '●'.repeat(Math.max(val.length - 4, 0)) + val.slice(-4)
  }

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!form.accountHolderName || !/^[a-zA-Z\s]+$/.test(form.accountHolderName)) {
      errs.accountHolderName = 'Enter valid name (letters and spaces only)'
    }
    if (!form.accountNumber || !/^\d{9,18}$/.test(form.accountNumber)) {
      errs.accountNumber = 'Account number must be 9-18 digits'
    }
    if (!form.confirmAccountNumber || form.confirmAccountNumber !== form.accountNumber) {
      errs.confirmAccountNumber = 'Account numbers do not match'
    }
    if (!form.ifscCode || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test((form.ifscCode || '').toUpperCase())) {
      errs.ifscCode = 'Enter valid IFSC (e.g. SBIN0001234)'
    }
    if (!ifscVerified) {
      errs.ifscCode = 'Please verify your IFSC'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = () => {
    if (validate()) {
      onNext(form as BankDetailsForm)
    }
  }

  return (
    <StepCard
      icon={<CreditCard size={20} style={{ color: '#FF4D00' }} />}
      title="Bank Details"
      subtitle="Your payment account information"
    >
      <div className="flex flex-col gap-5">
        <div
          className="rounded-xl p-4 flex items-start gap-3"
          style={{ background: 'rgba(255,77,0,0.06)', border: '1px solid rgba(255,77,0,0.15)' }}
        >
          <Shield size={18} className="text-[#FF7A3D] mt-0.5 shrink-0" />
          <p className="text-white/60 text-xs leading-relaxed">
            Your bank account is used for receiving payments via TRADINGO Escrow. 100% secure. ₹0 commission.
          </p>
        </div>

        <FormField label="Account Holder Name" required error={errors.accountHolderName}>
          <input
            className={INPUT_CLASS}
            style={inputStyle(!!errors.accountHolderName)}
            value={form.accountHolderName || ''}
            onChange={e => set('accountHolderName', e.target.value)}
            placeholder="Name as per bank records"
          />
        </FormField>

        <FormField label="Account Number" required error={errors.accountNumber}>
          <div className="relative">
            <input
              className={INPUT_CLASS}
              style={{ ...inputStyle(!!errors.accountNumber), paddingRight: '80px' }}
              value={maskedAccount(form.accountNumber || '')}
              onChange={e => {
                const raw = e.target.value.replace(/[^\d]/g, '')
                set('accountNumber', raw)
              }}
              placeholder="9-18 digits"
              maxLength={18}
            />
            <button
              type="button"
              onClick={() => setShowAccount(!showAccount)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
            >
              {showAccount ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </FormField>

        <FormField label="Confirm Account Number" required error={errors.confirmAccountNumber}>
          <div className="relative">
            <input
              className={INPUT_CLASS}
              style={inputStyle(!!errors.confirmAccountNumber)}
              value={form.confirmAccountNumber || ''}
              onChange={e => set('confirmAccountNumber', e.target.value.replace(/[^\d]/g, ''))}
              placeholder="Re-enter account number"
              maxLength={18}
            />
            {form.confirmAccountNumber && form.confirmAccountNumber === form.accountNumber && !errors.confirmAccountNumber && (
              <CheckCircle size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400" />
            )}
          </div>
        </FormField>

        <FormField label="IFSC Code" required error={errors.ifscCode || ifscError}>
          <div className="flex gap-2">
            <input
              className={INPUT_CLASS}
              style={{ ...inputStyle(!!errors.ifscCode || !!ifscError), textTransform: 'uppercase', letterSpacing: '0.05em' }}
              value={form.ifscCode || ''}
              onChange={e => set('ifscCode', e.target.value.toUpperCase())}
              placeholder="SBIN0001234"
              maxLength={11}
            />
            <button
              type="button"
              onClick={handleIfscVerify}
              disabled={ifscLoading || ifscVerified}
              className="px-4 py-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200"
              style={{
                ...(ifscVerified
                  ? { background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.4)', color: '#4ade80' }
                  : ifscLoading
                    ? { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }
                    : { background: 'rgba(255,77,0,0.12)', border: '1px solid rgba(255,77,0,0.3)', color: '#FF7A3D' }),
              }}
            >
              {ifscLoading ? <Loader2 size={14} className="animate-spin" /> : ifscVerified ? 'Verified' : 'Verify IFSC'}
            </button>
          </div>
        </FormField>

        <AnimatePresence>
          {ifscVerified && form.bankName && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div
                className="rounded-xl p-4 flex items-center gap-3"
                style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.15)' }}
              >
                <CheckCircle size={18} className="text-green-400 shrink-0" />
                <div>
                  <p className="text-green-400 text-xs font-semibold">
                    ✓ IFSC Valid | Bank: {form.bankName} | Branch: {form.branchName}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <FormField label="Account Type" required>
          <div className="flex gap-3">
            {[
              { value: 'current' as const, label: 'Current Account', hint: 'Recommended for businesses' },
              { value: 'savings' as const, label: 'Savings Account', hint: '' },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => set('accountType', opt.value)}
                className="flex-1 rounded-xl p-4 text-left transition-all duration-200"
                style={{
                  background: form.accountType === opt.value ? 'rgba(255,77,0,0.08)' : 'rgba(255,255,255,0.03)',
                  border: form.accountType === opt.value ? '1px solid rgba(255,77,0,0.4)' : '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center"
                    style={{
                      border: form.accountType === opt.value ? '2px solid #FF4D00' : '2px solid rgba(255,255,255,0.2)',
                    }}
                  >
                    {form.accountType === opt.value && (
                      <div className="w-2 h-2 rounded-full" style={{ background: '#FF4D00' }} />
                    )}
                  </div>
                  <span className="text-white/80 text-sm font-medium">{opt.label}</span>
                </div>
                {opt.hint && <p className="text-white/30 text-[10px] ml-6">{opt.hint}</p>}
              </button>
            ))}
          </div>
        </FormField>

        <FormField label="Cancelled Cheque" hint="Recommended">
          <div
            onClick={() => chequeRef.current?.click()}
            className="relative flex flex-col items-center justify-center gap-2 rounded-xl p-6 cursor-pointer transition-all duration-200 hover:border-[#FF4D00]/30"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.12)' }}
          >
            {chequePreview ? (
              <img src={chequePreview} alt="Cancelled cheque" className="max-h-24 rounded-lg object-contain" />
            ) : (
              <>
                <Upload size={20} className="text-white/25" />
                <p className="text-white/25 text-xs">Upload cancelled cheque image</p>
              </>
            )}
            <input ref={chequeRef} type="file" accept="image/*" onChange={handleChequeUpload} className="hidden" />
          </div>
        </FormField>

        <div
          className="rounded-xl p-4 flex items-start gap-3"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <Shield size={16} className="text-white/20 mt-0.5 shrink-0" />
          <p className="text-white/35 text-[11px] leading-relaxed">
            🔒 Your bank details are encrypted with AES-256. TRADINGO will never share with buyers or third parties.
          </p>
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
