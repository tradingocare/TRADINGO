'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ContactCredentialsForm } from '@/types/vendor-registration'
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

const DISPOSABLE_DOMAINS = ['mailinator.com', 'tempmail.com', 'guerrillamail.com', 'throwamail.com', 'yopmail.com', 'trashmail.com', 'guerrillamailblock.com', 'sharklasers.com', 'grr.la', 'dispostable.com']

const DESIGNATIONS = ['Proprietor', 'Partner', 'Director', 'CEO/MD', 'Manager', 'Authorized Signatory', 'Other']

interface Props {
  data: Partial<ContactCredentialsForm>
  onNext: (data: ContactCredentialsForm) => void
  onBack: () => void
}

export default function Step2ContactCredentials({ data, onNext, onBack }: Props) {
  const [ownerName, setOwnerName] = useState(data.ownerName ?? '')
  const [designation, setDesignation] = useState(data.designation ?? '')
  const [mobileNumber, setMobileNumber] = useState(data.mobileNumber ?? '')
  const [alternateMobile, setAlternateMobile] = useState(data.alternateMobile ?? '')
  const [email, setEmail] = useState(data.email ?? '')
  const [password, setPassword] = useState(data.password ?? '')
  const [confirmPassword, setConfirmPassword] = useState(data.confirmPassword ?? '')
  const [showPassword, setShowPassword] = useState(false)

  const [mobileVerified, setMobileVerified] = useState(data.mobileVerified ?? false)
  const [emailVerified, setEmailVerified] = useState(data.emailVerified ?? false)
  const [showMobileOtp, setShowMobileOtp] = useState(false)
  const [showEmailOtp, setShowEmailOtp] = useState(false)
  const [mobileOtp, setMobileOtp] = useState('')
  const [emailOtp, setEmailOtp] = useState('')
  const [mobileCountdown, setMobileCountdown] = useState(0)
  const [emailCountdown, setEmailCountdown] = useState(0)
  const [mobileOtpError, setMobileOtpError] = useState('')
  const [emailOtpError, setEmailOtpError] = useState('')

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const isMobileValid = /^[6-9]\d{9}$/.test(mobileNumber)
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const isEmailDisposable = DISPOSABLE_DOMAINS.some(d => email.toLowerCase().endsWith('@' + d) || email.toLowerCase().endsWith('.' + d))

  useEffect(() => {
    if (mobileCountdown > 0) {
      const t = setTimeout(() => setMobileCountdown(c => c - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [mobileCountdown])

  useEffect(() => {
    if (emailCountdown > 0) {
      const t = setTimeout(() => setEmailCountdown(c => c - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [emailCountdown])

  const getPasswordStrength = (pw: string): { label: string; color: string; width: string } => {
    if (pw.length < 8) return { label: 'Weak', color: '#ef4444', width: '25%' }
    const hasLetters = /[a-zA-Z]/.test(pw)
    const hasNumbers = /\d/.test(pw)
    const hasSymbol = /[^a-zA-Z0-9]/.test(pw)
    const types = [hasLetters, hasNumbers, hasSymbol].filter(Boolean).length
    if (types === 1) return { label: 'Fair', color: '#f59e0b', width: '50%' }
    if (pw.length >= 10 && types >= 3) return { label: 'Strong', color: '#22c55e', width: '100%' }
    return { label: 'Good', color: '#3b82f6', width: '75%' }
  }

  const strength = getPasswordStrength(password)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!ownerName.trim()) e.ownerName = 'Owner name is required'
    else if (ownerName.trim().length < 3) e.ownerName = 'Minimum 3 characters'
    else if (!/^[a-zA-Z\s]+$/.test(ownerName.trim())) e.ownerName = 'Letters and spaces only'
    if (!designation) e.designation = 'Select designation'
    if (!isMobileValid) e.mobileNumber = 'Enter a valid 10-digit mobile (starts 6-9)'
    if (!mobileVerified) e.mobileNumber = 'Mobile must be verified'
    if (email && !isEmailValid) e.email = 'Enter a valid email'
    if (email && isEmailDisposable) e.email = 'Disposable email addresses are not allowed'
    if (!isEmailValid || !email) e.email = 'Email is required'
    if (!emailVerified) e.email = 'Email must be verified'
    if (!password || password.length < 8) e.password = 'Minimum 8 characters'
    if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const markTouched = (field: string) => setTouched(prev => ({ ...prev, [field]: true }))

  const sendMobileOtp = () => {
    if (!isMobileValid) return
    setShowMobileOtp(true)
    setMobileCountdown(60)
    setMobileOtp('')
    setMobileOtpError('')
  }

  const verifyMobileOtp = () => {
    if (mobileOtp === '123456') {
      setMobileVerified(true)
      setShowMobileOtp(false)
      setMobileOtp('')
    } else {
      setMobileOtpError('Invalid OTP. Try 123456 for demo.')
    }
  }

  const sendEmailOtp = () => {
    if (!isEmailValid || isEmailDisposable) return
    setShowEmailOtp(true)
    setEmailCountdown(60)
    setEmailOtp('')
    setEmailOtpError('')
  }

  const verifyEmailOtp = () => {
    if (emailOtp === '123456') {
      setEmailVerified(true)
      setShowEmailOtp(false)
      setEmailOtp('')
    } else {
      setEmailOtpError('Invalid OTP. Try 123456 for demo.')
    }
  }

  const handleNext = () => {
    if (!validate()) return
    onNext({
      ownerName: ownerName.trim(), designation, mobileNumber, alternateMobile: alternateMobile.trim() || undefined,
      email: email.trim(), password, confirmPassword, mobileVerified, emailVerified,
    })
  }

  return (
    <StepCard icon={<span className="text-lg">🔐</span>} title="Contact & Login" subtitle="Your account credentials">
      <div className="space-y-5">
        <FormField label="Owner / Contact Name" required error={touched.ownerName ? errors.ownerName : undefined}>
          <input className={INPUT_CLASS} style={inputStyle(!!errors.ownerName && touched.ownerName)} placeholder="Full name"
            value={ownerName} onChange={e => setOwnerName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))} onBlur={() => markTouched('ownerName')} />
        </FormField>

        <FormField label="Designation" required error={touched.designation ? errors.designation : undefined}>
          <select className={INPUT_CLASS} style={inputStyle(!!errors.designation && touched.designation)}
            value={designation} onChange={e => { setDesignation(e.target.value); markTouched('designation') }}>
            <option value="" className="bg-[#1D0001]">Select</option>
            {DESIGNATIONS.map(d => <option key={d} value={d} className="bg-[#1D0001]">{d}</option>)}
          </select>
        </FormField>

        <FormField label="Mobile Number" required error={touched.mobileNumber ? errors.mobileNumber : undefined}>
          <div className="flex gap-2">
            <div className="flex items-center px-3 rounded-xl text-white text-sm" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              +91
            </div>
            <input className={INPUT_CLASS} style={{ ...inputStyle(!!errors.mobileNumber && touched.mobileNumber), flex: 1 }} placeholder="9876543210" maxLength={10}
              value={mobileNumber} onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 10); setMobileNumber(v); if (mobileVerified) setMobileVerified(false); setShowMobileOtp(false) }}
              onBlur={() => markTouched('mobileNumber')} disabled={mobileVerified} />
            {!mobileVerified && isMobileValid && !showMobileOtp && (
              <button type="button" onClick={sendMobileOtp} className="px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all hover:opacity-90"
                style={btnPrimary}>Send OTP</button>
            )}
          </div>
          {mobileVerified && <p className="text-green-400 text-xs flex items-center gap-1 mt-1">✓ Mobile Verified</p>}
          {showMobileOtp && !mobileVerified && (
            <div className="mt-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-white/50 text-xs mb-2">Enter 6-digit OTP sent to +91 {mobileNumber}</p>
              <div className="flex gap-2 items-center">
                <input className={INPUT_CLASS} style={{ ...inputStyle(false), letterSpacing: '0.3em', textAlign: 'center', maxWidth: 160 }} placeholder="000000" maxLength={6}
                  value={mobileOtp} onChange={e => { setMobileOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setMobileOtpError('') }} />
                <button type="button" onClick={verifyMobileOtp} className="px-4 py-3 rounded-xl text-xs font-bold hover:opacity-90" style={btnPrimary}>Verify</button>
              </div>
              {mobileOtpError && <p className="text-red-400 text-[10px] mt-1">{mobileOtpError}</p>}
              <p className="text-white/30 text-[10px] mt-2">
                {mobileCountdown > 0 ? `Resend OTP in ${mobileCountdown}s` : (
                  <button type="button" onClick={sendMobileOtp} className="underline hover:text-white/60">Resend OTP</button>
                )}
              </p>
            </div>
          )}
        </FormField>

        <FormField label="Alternate Mobile" error={touched.alternateMobile ? errors.alternateMobile : undefined}>
          <div className="flex gap-2">
            <div className="flex items-center px-3 rounded-xl text-white text-sm" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>+91</div>
            <input className={INPUT_CLASS} style={{ ...inputStyle(false), flex: 1 }} placeholder="Optional" maxLength={10}
              value={alternateMobile} onChange={e => setAlternateMobile(e.target.value.replace(/\D/g, '').slice(0, 10))} />
          </div>
        </FormField>

        <FormField label="Email Address" required error={touched.email ? errors.email : undefined}>
          <input className={INPUT_CLASS} style={inputStyle(!!errors.email && touched.email)} placeholder="you@company.com" type="email"
            value={email} onChange={e => { setEmail(e.target.value); if (emailVerified) setEmailVerified(false); setShowEmailOtp(false) }}
            onBlur={() => markTouched('email')} disabled={emailVerified} />
          {emailVerified && <p className="text-green-400 text-xs flex items-center gap-1 mt-1">✓ Email Verified</p>}
          {isEmailValid && isEmailDisposable && <p className="text-red-400 text-[10px] mt-1">Disposable email addresses are not allowed</p>}
          {!emailVerified && isEmailValid && !isEmailDisposable && !showEmailOtp && (
            <button type="button" onClick={sendEmailOtp} className="mt-2 px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90" style={btnPrimary}>Send Email OTP</button>
          )}
          {showEmailOtp && !emailVerified && (
            <div className="mt-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-white/50 text-xs mb-2">Enter 6-digit OTP sent to {email}</p>
              <div className="flex gap-2 items-center">
                <input className={INPUT_CLASS} style={{ ...inputStyle(false), letterSpacing: '0.3em', textAlign: 'center', maxWidth: 160 }} placeholder="000000" maxLength={6}
                  value={emailOtp} onChange={e => { setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setEmailOtpError('') }} />
                <button type="button" onClick={verifyEmailOtp} className="px-4 py-3 rounded-xl text-xs font-bold hover:opacity-90" style={btnPrimary}>Verify</button>
              </div>
              {emailOtpError && <p className="text-red-400 text-[10px] mt-1">{emailOtpError}</p>}
              <p className="text-white/30 text-[10px] mt-2">
                {emailCountdown > 0 ? `Resend OTP in ${emailCountdown}s` : (
                  <button type="button" onClick={sendEmailOtp} className="underline hover:text-white/60">Resend OTP</button>
                )}
              </p>
            </div>
          )}
        </FormField>

        <FormField label="Password" required error={touched.password ? errors.password : undefined}>
          <div className="relative">
            <input className={INPUT_CLASS} style={inputStyle(!!errors.password && touched.password)} placeholder="Min 8 characters"
              type={showPassword ? 'text' : 'password'} value={password}
              onChange={e => setPassword(e.target.value)} onBlur={() => markTouched('password')} />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-xs hover:text-white/60">
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {password.length > 0 && (
            <div className="mt-2">
              <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="h-full rounded-full transition-all duration-300" style={{ width: strength.width, background: strength.color }} />
              </div>
              <p className="text-[10px] mt-1" style={{ color: strength.color }}>{strength.label}</p>
            </div>
          )}
        </FormField>

        <FormField label="Confirm Password" required error={touched.confirmPassword ? errors.confirmPassword : undefined}>
          <div className="relative">
            <input className={INPUT_CLASS} style={inputStyle(!!errors.confirmPassword && touched.confirmPassword)} placeholder="Re-enter password"
              type={showPassword ? 'text' : 'password'} value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)} onBlur={() => markTouched('confirmPassword')} />
            {confirmPassword && confirmPassword === password && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400 text-sm">✓</span>
            )}
          </div>
        </FormField>

        <div className="p-3 rounded-xl text-white/50 text-xs" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          Your Login ID on TRADINGO will be your PAN Number — entered in Step 3.
        </div>

        <div className="flex gap-3">
          <button onClick={onBack} className="flex-1 py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-80" style={btnSecondary}>← Back</button>
          <button onClick={handleNext} className="flex-1 py-3.5 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98]" style={btnPrimary}>Continue →</button>
        </div>
      </div>
    </StepCard>
  )
}
