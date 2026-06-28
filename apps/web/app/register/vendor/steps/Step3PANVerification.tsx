'use client'

import { useState, useRef } from 'react'
import type { PANForm } from '@/types/vendor-registration'
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

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/

interface Props {
  data: Partial<PANForm>
  businessType?: string
  onNext: (data: PANForm) => void
  onBack: () => void
}

export default function Step3PANVerification({ data, businessType, onNext, onBack }: Props) {
  const [panNumber, setPanNumber] = useState(data.panNumber ?? '')
  const [panHolderName, setPanHolderName] = useState(data.panHolderName ?? '')
  const [dateOfBirth, setDateOfBirth] = useState(data.dateOfBirth ?? '')
  const [panVerified, setPanVerified] = useState(data.panVerified ?? false)
  const [panCardImage, setPanCardImage] = useState<File | null>(null)
  const [panCardPreview, setPanCardPreview] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [uploadError, setUploadError] = useState('')

  const requiresDob = businessType === 'sole_proprietorship' || businessType === 'huf'
  const isPanValid = PAN_REGEX.test(panNumber)

  const handlePanChange = (val: string) => {
    const upper = val.toUpperCase().slice(0, 10)
    setPanNumber(upper)
    if (panVerified) { setPanVerified(false); setPanHolderName('') }
  }

  const verifyPan = () => {
    if (!isPanValid) return
    setVerifying(true)
    setTimeout(() => {
      setPanHolderName('RAJESH KUMAR')
      setPanVerified(true)
      setVerifying(false)
    }, 1000)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError('')
    if (file.size > 5 * 1024 * 1024) { setUploadError('Max file size is 5MB'); return }
    const allowed = ['image/jpeg', 'image/png', 'application/pdf']
    if (!allowed.includes(file.type)) { setUploadError('JPG, PNG or PDF only'); return }
    setPanCardImage(file)
    if (file.type !== 'application/pdf') {
      const reader = new FileReader()
      reader.onload = ev => setPanCardPreview(ev.target?.result as string)
      reader.readAsDataURL(file)
    } else {
      setPanCardPreview(null)
    }
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!panNumber) e.panNumber = 'PAN number is required'
    else if (!isPanValid) e.panNumber = 'Invalid PAN format (AAAAA9999A)'
    if (!panVerified) e.panNumber = 'PAN must be verified'
    if (!panHolderName.trim()) e.panHolderName = 'PAN holder name is required'
    if (requiresDob && !dateOfBirth) e.dateOfBirth = 'Date of birth is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleNext = () => {
    if (!validate()) return
    onNext({ panNumber, panHolderName: panHolderName.trim(), dateOfBirth: dateOfBirth || undefined, panCardImage, panVerified })
  }

  const maxDob = new Date()
  maxDob.setFullYear(maxDob.getFullYear() - 18)
  const maxDate = maxDob.toISOString().split('T')[0]

  return (
    <StepCard icon={<span className="text-lg">🪪</span>} title="PAN Verification" subtitle="Your identity for TRADINGO login">
      <div className="space-y-5">
        <div className="p-3 rounded-xl text-white/50 text-xs" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          PAN Number is your TRADINGO Login ID. Please enter it carefully.
        </div>

        <FormField label="PAN Number" required error={touched.panNumber ? errors.panNumber : undefined}>
          <div className="flex gap-2">
            <input className={INPUT_CLASS} style={{ ...inputStyle(!!errors.panNumber && touched.panNumber), flex: 1, letterSpacing: '0.1em', textTransform: 'uppercase' }}
              placeholder="ABCDE1234F" maxLength={10} value={panNumber}
              onChange={e => handlePanChange(e.target.value)} onBlur={() => setTouched(p => ({ ...p, panNumber: true }))}
              disabled={panVerified} />
            {!panVerified && isPanValid && (
              <button type="button" onClick={verifyPan} disabled={verifying}
                className="px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all hover:opacity-90 disabled:opacity-50"
                style={btnPrimary}>
                {verifying ? 'Verifying...' : 'Verify PAN'}
              </button>
            )}
          </div>
          {panVerified && <p className="text-green-400 text-xs flex items-center gap-1 mt-1">✓ PAN Verified</p>}
        </FormField>

        <FormField label="PAN Holder Name" required error={touched.panHolderName ? errors.panHolderName : undefined}>
          <input className={INPUT_CLASS} style={inputStyle(!!errors.panHolderName && touched.panHolderName)} placeholder="As printed on PAN card"
            value={panHolderName} onChange={e => setPanHolderName(e.target.value)} onBlur={() => setTouched(p => ({ ...p, panHolderName: true }))} />
        </FormField>

        {requiresDob && (
          <FormField label="Date of Birth" required error={touched.dateOfBirth ? errors.dateOfBirth : undefined}>
            <input className={INPUT_CLASS} style={inputStyle(!!errors.dateOfBirth && touched.dateOfBirth)} type="date" max={maxDate}
              value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} onBlur={() => setTouched(p => ({ ...p, dateOfBirth: true }))} />
          </FormField>
        )}

        <FormField label="PAN Card Image" error={uploadError || undefined} hint="Recommended — JPG, PNG or PDF, max 5MB">
          <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={handleFileChange} />
          {panCardImage ? (
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {panCardPreview ? (
                <img src={panCardPreview} alt="PAN preview" className="w-16 h-16 rounded-lg object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-lg flex items-center justify-center text-white/40 text-xs" style={{ background: 'rgba(255,255,255,0.05)' }}>PDF</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs truncate">{panCardImage.name}</p>
                <p className="text-white/30 text-[10px]">{(panCardImage.size / 1024 / 1024).toFixed(1)} MB</p>
              </div>
              <button type="button" onClick={() => { setPanCardImage(null); setPanCardPreview(null); if (fileRef.current) fileRef.current.value = '' }}
                className="text-white/40 text-xs hover:text-red-400">Remove</button>
            </div>
          ) : (
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-full py-6 rounded-xl border border-dashed text-white/30 text-xs hover:text-white/50 transition-colors"
              style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              Click to upload PAN card image
            </button>
          )}
        </FormField>

        <div className="p-3 rounded-xl space-y-1" style={{ background: 'rgba(255,77,0,0.05)', border: '1px solid rgba(255,77,0,0.1)' }}>
          <p className="text-white/60 text-xs font-semibold">Why we need PAN:</p>
          <p className="text-white/40 text-[10px]">✓ Login ID</p>
          <p className="text-white/40 text-[10px]">✓ GST Invoice generation</p>
          <p className="text-white/40 text-[10px]">✓ Mandatory for transactions above ₹2L</p>
          <p className="text-white/40 text-[10px]">✓ Helps buyers trust</p>
        </div>

        <div className="flex gap-3">
          <button onClick={onBack} className="flex-1 py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-80" style={btnSecondary}>← Back</button>
          <button onClick={handleNext} className="flex-1 py-3.5 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98]" style={btnPrimary}>Continue →</button>
        </div>
      </div>
    </StepCard>
  )
}
