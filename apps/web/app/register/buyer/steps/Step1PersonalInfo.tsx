'use client'

import { useState, useEffect, useCallback } from 'react'
import { CheckCircle2, Mail, Phone } from 'lucide-react'
import type { PersonalInfoForm } from '@/types/buyer-registration'
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

interface Props {
  data: Partial<PersonalInfoForm>
  onNext: (data: PersonalInfoForm) => void
}

export default function Step1PersonalInfo({ data, onNext }: Props) {
  const [firstName, setFirstName] = useState(data.firstName ?? '')
  const [lastName, setLastName] = useState(data.lastName ?? '')
  const [email, setEmail] = useState(data.email ?? '')
  const [mobile, setMobile] = useState(data.mobile ?? '')
  const [password, setPassword] = useState(data.password ?? '')
  const [confirmPassword, setConfirmPassword] = useState(data.confirmPassword ?? '')
  const [emailVerified, setEmailVerified] = useState(data.emailVerified ?? false)
  const [mobileVerified, setMobileVerified] = useState(data.mobileVerified ?? false)
  const [emailOtp, setEmailOtp] = useState('')
  const [mobileOtp, setMobileOtp] = useState('')
  const [emailOtpError, setEmailOtpError] = useState('')
  const [mobileOtpError, setMobileOtpError] = useState('')
  const [showEmailOtp, setShowEmailOtp] = useState(false)
  const [showMobileOtp, setShowMobileOtp] = useState(false)
  const [emailCountdown, setEmailCountdown] = useState(0)
  const [mobileCountdown, setMobileCountdown] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [confirmingPassword, setConfirmingPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const isMobileValid = /^[6-9]\d{9}$/.test(mobile)
  const passwordsMatch = password === confirmPassword && confirmPassword !== ''

  useEffect(() => {
    if (emailCountdown > 0) {
      const t = setTimeout(() => setEmailCountdown(c => c - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [emailCountdown])

  useEffect(() => {
    if (mobileCountdown > 0) {
      const t = setTimeout(() => setMobileCountdown(c => c - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [mobileCountdown])

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
    if (!firstName.trim()) e.firstName = 'First name is required'
    else if (firstName.trim().length < 3) e.firstName = 'First name must be at least 3 characters'
    if (!lastName.trim()) e.lastName = 'Last name is required'
    else if (lastName.trim().length < 3) e.lastName = 'Last name must be at least 3 characters'
    if (!isEmailValid) e.email = 'Please enter a valid email address'
    if (!emailVerified) e.email = 'Email verification is required'
    if (!isMobileValid) e.mobile = 'Please enter a valid 10-digit mobile number'
    if (!mobileVerified) e.mobile = 'Mobile verification is required'
    if (!password || password.length < 8) e.password = 'Password must be at least 8 characters'
    if (!confirmPassword) e.confirmPassword = 'Please confirm your password'
    if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const markTouched = useCallback((field: string) => setTouched(prev => ({ ...prev, [field]: true })), [])

  const sendEmailOtp = () => {
    if (!isEmailValid) return
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
      setEmailOtpError('Invalid OTP. Please try 123456 for demo.')
    }
  }

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
      setMobileOtpError('Invalid OTP. Please try 123456 for demo.')
    }
  }

  const handleNext = () => {
    if (!validate()) return
    onNext({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      mobile: mobile,
      password: password,
      confirmPassword: confirmPassword,
      emailVerified: emailVerified,
      mobileVerified: mobileVerified,
    })
  }

  return (
    <StepCard icon={<CheckCircle2 className="text-white" />} title="Personal Information" subtitle="Create your buyer account with TRADINGO">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="First Name" required error={touched.firstName ? errors.firstName : undefined}>
            <input
              className={INPUT_CLASS}
              style={inputStyle(!!errors.firstName && touched.firstName)}
              placeholder="First name"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              onBlur={() => markTouched('firstName')}
            />
          </FormField>

          <FormField label="Last Name" required error={touched.lastName ? errors.lastName : undefined}>
            <input
              className={INPUT_CLASS}
              style={inputStyle(!!errors.lastName && touched.lastName)}
              placeholder="Last name"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              onBlur={() => markTouched('lastName')}
            />
          </FormField>
        </div>

        <FormField label="Email Address" required error={touched.email ? errors.email : undefined}>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
            <input
              className={INPUT_CLASS} style={{ ...inputStyle(!!errors.email && touched.email), paddingLeft: '40px' }}
              placeholder="you@company.com"
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); if (emailVerified) setEmailVerified(false); setShowEmailOtp(false) }}
              onBlur={() => markTouched('email')}
              disabled={emailVerified}
            />
          </div>
          {emailVerified && (
            <p className="text-green-400 text-xs flex items-center gap-1 mt-1">
              <CheckCircle2 size={12} /> Email Verified
            </p>
          )}
          {isEmailValid && !emailVerified && !showEmailOtp && (
            <button
              type="button"
              onClick={sendEmailOtp}
              className="mt-2 px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90"
              style={btnPrimary}
            >
              Send Email OTP
            </button>
          )}
          {showEmailOtp && !emailVerified && (
            <div className="mt-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-white/50 text-xs mb-2">Enter 6-digit OTP sent to {email}</p>
              <div className="flex gap-2 items-center">
                <input
                  className={INPUT_CLASS}
                  style={{ ...inputStyle(false), letterSpacing: '0.3em', textAlign: 'center', maxWidth: 160 }}
                  placeholder="000000"
                  maxLength={6}
                  value={emailOtp}
                  onChange={e => { setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setEmailOtpError('') }}
                />
                <button
                  type="button"
                  onClick={verifyEmailOtp}
                  className="px-4 py-3 rounded-xl text-xs font-bold hover:opacity-90"
                  style={btnPrimary}
                >
                  Verify
                </button>
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

        <FormField label="Mobile Number" required error={touched.mobile ? errors.mobile : undefined}>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
            <div className="flex items-center px-3 rounded-xl text-white text-sm" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginLeft: '0', marginRight: '8px', height: '42px', width: '60px' }}>
              +91
            </div>
            <input
              className={INPUT_CLASS}
              style={{ ...inputStyle(!!errors.mobile && touched.mobile), flex: 1, paddingLeft: '70px' }}
              placeholder="9876543210"
              maxLength={10}
              inputMode="numeric"
              value={mobile}
              onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 10); setMobile(v); if (mobileVerified) setMobileVerified(false); setShowMobileOtp(false) }}
              onBlur={() => markTouched('mobile')}
              disabled={mobileVerified}
            />
          </div>
          {mobileVerified && (
            <p className="text-green-400 text-xs flex items-center gap-1 mt-1">
              <CheckCircle2 size={12} /> Mobile Verified
            </p>
          )}
          {isMobileValid && !mobileVerified && !showMobileOtp && (
            <button
              type="button"
              onClick={sendMobileOtp}
              className="mt-2 px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90"
              style={btnPrimary}
            >
              Send Mobile OTP
            </button>
          )}
          {showMobileOtp && !mobileVerified && (
            <div className="mt-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-white/50 text-xs mb-2">Enter 6-digit OTP sent to +91 {mobile}</p>
              <div className="flex gap-2 items-center">
                <input
                  className={INPUT_CLASS}
                  style={{ ...inputStyle(false), letterSpacing: '0.3em', textAlign: 'center', maxWidth: 160 }}
                  placeholder="000000"
                  maxLength={6}
                  value={mobileOtp}
                  onChange={e => { setMobileOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setMobileOtpError('') }}
                />
                <button
                  type="button"
                  onClick={verifyMobileOtp}
                  className="px-4 py-3 rounded-xl text-xs font-bold hover:opacity-90"
                  style={btnPrimary}
                >
                  Verify
                </button>
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

        <FormField label="Password" required error={touched.password ? errors.password : undefined}>
          <div className="relative">
            <input
              className={INPUT_CLASS}
              style={inputStyle(!!errors.password && touched.password)}
              placeholder="Create a password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onBlur={() => markTouched('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-xs hover:text-white/60"
            >
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
            <input
              className={INPUT_CLASS}
              style={inputStyle(!!errors.confirmPassword && touched.confirmPassword)}
              placeholder="Confirm password"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              onBlur={() => markTouched('confirmPassword')}
            />
            {confirmPassword && passwordsMatch && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400 text-sm">✓</span>
            )}
          </div>
        </FormField>

        <div className="flex gap-3">
          <button
            onClick={handleNext}
            className="w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
            style={btnPrimary}
          >
            Continue →
          </button>
        </div>
      </div>
    </StepCard>
  )
}