'use client'

import { useState, useRef } from 'react'
import type { GSTForm } from '@/types/vendor-registration'
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

const GST_REGEX = /^\d{2}[A-Z]{5}\d{4}[A-Z]\d[Z][A-Z\d]$/

const EXEMPT_REASONS = [
  { value: 'turnover_below_limit', label: 'Below ₹20L threshold' },
  { value: 'agriculture', label: 'Agriculture / Farm' },
  { value: 'exempt_category', label: 'Exempt category' },
  { value: 'new_business', label: 'New business, will register soon' },
]

interface Props {
  data: Partial<GSTForm>
  onNext: (data: GSTForm) => void
  onBack: () => void
}

export default function Step4GSTVerification({ data, onNext, onBack }: Props) {
  const [hasGst, setHasGst] = useState(data.hasGst ?? true)
  const [gstNumber, setGstNumber] = useState(data.gstNumber ?? '')
  const [gstBusinessName, setGstBusinessName] = useState(data.gstBusinessName ?? '')
  const [gstAddress, setGstAddress] = useState(data.gstAddress ?? '')
  const [gstState, setGstState] = useState(data.gstState ?? '')
  const [gstVerified, setGstVerified] = useState(data.gstVerified ?? false)
  const [gstCertificateImage, setGstCertificateImage] = useState<File | null>(null)
  const [gstCertPreview, setGstCertPreview] = useState<string | null>(null)
  const [gstExemptReason, setGstExemptReason] = useState(data.gstExemptReason ?? '')
  const [verifying, setVerifying] = useState(false)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [uploadError, setUploadError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const isGstValid = GST_REGEX.test(gstNumber)

  const handleGstChange = (val: string) => {
    const upper = val.toUpperCase().slice(0, 15)
    setGstNumber(upper)
    if (gstVerified) { setGstVerified(false); setGstBusinessName(''); setGstAddress(''); setGstState('') }
  }

  const verifyGst = () => {
    if (!isGstValid) return
    setVerifying(true)
    setTimeout(() => {
      setGstBusinessName('KUMAR TRADING CO')
      setGstAddress('123 Main Road, Patna, Bihar 800001')
      setGstState('Bihar')
      setGstVerified(true)
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
    setGstCertificateImage(file)
    if (file.type !== 'application/pdf') {
      const reader = new FileReader()
      reader.onload = ev => setGstCertPreview(ev.target?.result as string)
      reader.readAsDataURL(file)
    } else {
      setGstCertPreview(null)
    }
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (hasGst) {
      if (!gstNumber) e.gstNumber = 'GST number is required'
      else if (!isGstValid) e.gstNumber = 'Invalid GSTIN format (15 characters)'
      if (!gstVerified) e.gstNumber = 'GST must be verified'
    } else {
      if (!gstExemptReason) e.gstExemptReason = 'Select a reason'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleNext = () => {
    if (!validate()) return
    if (hasGst) {
      onNext({ hasGst: true, gstNumber, gstBusinessName, gstAddress, gstState, gstVerified, gstCertificateImage })
    } else {
      onNext({ hasGst: false, gstExemptReason: gstExemptReason as GSTForm['gstExemptReason'] })
    }
  }

  return (
    <StepCard icon={<span className="text-lg">📋</span>} title="GST Verification" subtitle="Tax compliance details">
      <div className="space-y-5">
        <div className="p-3 rounded-xl text-white/50 text-xs" style={{ background: 'rgba(255,77,0,0.05)', border: '1px solid rgba(255,77,0,0.1)' }}>
          <p className="font-semibold text-white/60 mb-1">Why GST matters:</p>
          <p>✓ B2B buyers require GST invoices</p>
          <p>✓ GST-verified badge</p>
          <p>✓ Unlocks bulk orders</p>
          <p>✓ Required for orders above ₹50K</p>
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={() => setHasGst(true)}
            className="flex-1 py-3 rounded-xl font-bold text-sm transition-all"
            style={hasGst ? btnPrimary : btnSecondary}>
            YES — I have GST
          </button>
          <button type="button" onClick={() => setHasGst(false)}
            className="flex-1 py-3 rounded-xl font-bold text-sm transition-all"
            style={!hasGst ? btnPrimary : btnSecondary}>
            NO — No GST
          </button>
        </div>

        {hasGst ? (
          <>
            <FormField label="GST Number (GSTIN)" required error={touched.gstNumber ? errors.gstNumber : undefined}>
              <div className="flex gap-2">
                <input className={INPUT_CLASS} style={{ ...inputStyle(!!errors.gstNumber && touched.gstNumber), flex: 1, letterSpacing: '0.08em', textTransform: 'uppercase' }}
                  placeholder="22AAAAA0000A1Z5" maxLength={15} value={gstNumber}
                  onChange={e => handleGstChange(e.target.value)} onBlur={() => setTouched(p => ({ ...p, gstNumber: true }))}
                  disabled={gstVerified} />
                {!gstVerified && isGstValid && (
                  <button type="button" onClick={verifyGst} disabled={verifying}
                    className="px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all hover:opacity-90 disabled:opacity-50"
                    style={btnPrimary}>
                    {verifying ? 'Verifying...' : 'Verify GST'}
                  </button>
                )}
              </div>
              {gstVerified && <p className="text-green-400 text-xs flex items-center gap-1 mt-1">✓ GST Verified</p>}
            </FormField>

            {gstVerified && (
              <div className="p-4 rounded-xl space-y-3" style={{ background: 'rgba(255,77,0,0.05)', border: '1px solid rgba(255,77,0,0.1)' }}>
                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Business Name</p>
                  <p className="text-white text-sm font-semibold">{gstBusinessName}</p>
                </div>
                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Registered Address</p>
                  <p className="text-white text-xs">{gstAddress}</p>
                </div>
                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">State</p>
                  <p className="text-white text-xs">{gstState}</p>
                </div>
              </div>
            )}

            <FormField label="GST Certificate" error={uploadError || undefined} hint="JPG, PNG or PDF, max 5MB">
              <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={handleFileChange} />
              {gstCertificateImage ? (
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {gstCertPreview ? (
                    <img src={gstCertPreview} alt="GST preview" className="w-16 h-16 rounded-lg object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg flex items-center justify-center text-white/40 text-xs" style={{ background: 'rgba(255,255,255,0.05)' }}>PDF</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs truncate">{gstCertificateImage.name}</p>
                    <p className="text-white/30 text-[10px]">{(gstCertificateImage.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                  <button type="button" onClick={() => { setGstCertificateImage(null); setGstCertPreview(null); if (fileRef.current) fileRef.current.value = '' }}
                    className="text-white/40 text-xs hover:text-red-400">Remove</button>
                </div>
              ) : (
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="w-full py-6 rounded-xl border border-dashed text-white/30 text-xs hover:text-white/50 transition-colors"
                  style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  Click to upload GST certificate
                </button>
              )}
            </FormField>
          </>
        ) : (
          <>
            <FormField label="Reason for no GST" required error={touched.gstExemptReason ? errors.gstExemptReason : undefined}>
              <div className="space-y-2">
                {EXEMPT_REASONS.map(r => {
                  const selected = gstExemptReason === r.value
                  return (
                    <button key={r.value} type="button" onClick={() => { setGstExemptReason(r.value); setTouched(p => ({ ...p, gstExemptReason: true })) }}
                      className="w-full text-left p-3 rounded-xl transition-all duration-200"
                      style={{
                        background: selected ? 'rgba(255,77,0,0.1)' : 'rgba(255,255,255,0.03)',
                        border: selected ? '1px solid rgba(255,77,0,0.5)' : '1px solid rgba(255,255,255,0.07)',
                      }}>
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full border flex items-center justify-center"
                          style={{ borderColor: selected ? '#FF4D00' : 'rgba(255,255,255,0.2)' }}>
                          {selected && <div className="w-2 h-2 rounded-full" style={{ background: '#FF4D00' }} />}
                        </div>
                        <span className="text-white text-xs">{r.label}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </FormField>

            <div className="p-3 rounded-xl text-white/50 text-xs" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              Even without GST, you can sell on TRADINGO. Buyers will see <span className="text-white/70">GST Not Applicable</span>. You can add GST later.
            </div>
          </>
        )}

        <div className="flex gap-3">
          <button onClick={onBack} className="flex-1 py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-80" style={btnSecondary}>← Back</button>
          <button onClick={handleNext} className="flex-1 py-3.5 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98]" style={btnPrimary}>Continue →</button>
        </div>
      </div>
    </StepCard>
  )
}
