'use client'
import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import UploadZone from '../../../../components/shared/UploadZone'
import type { SectionProps } from '../../../../types/vendor-onboarding'
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react'

const DOCUMENTS = [
  { key: 'gstCertUrl', label: 'GST Certificate', mandatory: true, accept: '.pdf,.jpg,.png', maxMB: 5 },
  { key: 'panCardUrl', label: 'PAN Card', mandatory: true, accept: '.pdf,.jpg,.png', maxMB: 5 },
  { key: 'bankDocUrl', label: 'Cancelled Cheque / Bank Document', mandatory: true, accept: '.pdf,.jpg,.png', maxMB: 5 },
  { key: 'tradeLicenseUrl', label: 'Trade License / Shop Act', mandatory: false, accept: '.pdf,.jpg,.png', maxMB: 5 },
  { key: 'msmeUrl', label: 'MSME / Udyam Registration', mandatory: false, accept: '.pdf', maxMB: 5 },
  { key: 'incorporationUrl', label: 'Incorporation Certificate', mandatory: false, accept: '.pdf', maxMB: 10 },
  { key: 'iso9001Url', label: 'ISO 9001:2015 Certificate', mandatory: false, accept: '.pdf', maxMB: 5 },
  { key: 'iso14001Url', label: 'ISO 14001 (Environmental)', mandatory: false, accept: '.pdf', maxMB: 5 },
  { key: 'bisUrl', label: 'BIS / ISI Certificate', mandatory: false, accept: '.pdf', maxMB: 5 },
  { key: 'fssaiUrl', label: 'FSSAI License', mandatory: false, accept: '.pdf,.jpg,.png', maxMB: 5 },
  { key: 'drugLicenseUrl', label: 'Drug License', mandatory: false, accept: '.pdf', maxMB: 5 },
  { key: 'iecUrl', label: 'Export Import Code (IEC)', mandatory: false, accept: '.pdf', maxMB: 5 },
]

export default function Section6Documents({ vendor, onSave, onNext, onBack }: SectionProps) {
  const [docs, setDocs] = useState<Record<string,string>>({
    gstCertUrl: vendor?.gstCertUrl || '',
    panCardUrl: vendor?.panCardUrl || '',
  })
  const [saving, setSaving] = useState(false)

  const count = Object.values(docs).filter(Boolean).length
  const score = Math.min(count * 2, 12)

  const save = useCallback(async () => {
    setSaving(true)
    try {
      const { default: api } = await import('../../../../lib/api/client')
      await api.patch('/seller/documents', docs)
      onSave({ score })
    } finally { setSaving(false) }
  }, [docs, score, onSave])

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-white font-bold text-xl">Company Documents</h2>
        <span className="text-white/40 text-sm">Score: {score}/12</span>
      </div>
      <p className="text-white/40 text-sm mb-6">Upload your business documents to build trust with buyers</p>

      <div className="space-y-3">
        {DOCUMENTS.map((doc) => {
          const uploaded = !!docs[doc.key]
          return (
            <div key={doc.key}
              className="flex items-center gap-4 p-4 rounded-xl transition-all"
              style={{
                background: uploaded ? 'rgba(34,197,94,0.05)' : 'rgba(255,255,255,0.03)',
                border: uploaded ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(255,255,255,0.08)',
              }}>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm font-medium">{doc.label}</span>
                  {doc.mandatory && <span className="text-[#FF4D00] text-[10px]">*</span>}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {uploaded ? (
                    <span className="flex items-center gap-1 text-green-400 text-xs">
                      <CheckCircle2 size={11} /> Uploaded
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-white/30 text-xs">
                      <Clock size={11} /> Not uploaded
                    </span>
                  )}
                </div>
              </div>
              {uploaded ? (
                <button onClick={() => setDocs(prev => ({ ...prev, [doc.key]: '' }))}
                  className="text-xs text-white/30 hover:text-red-400 transition-colors">
                  Replace
                </button>
              ) : (
                <UploadZone
                  label="Upload"
                  accept={doc.accept}
                  maxSizeMB={doc.maxMB}
                  folder={`documents/${doc.key}`}
                  onUpload={urls => setDocs(prev => ({ ...prev, [doc.key]: urls[0] }))}
                />
              )}
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-3 mt-8">
        {onBack && <button onClick={onBack} className="px-4 py-2 text-sm text-white/50 hover:text-white/80">Back</button>}
        <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
          onClick={save} disabled={saving}
          className="px-6 py-3 rounded-xl font-bold text-sm disabled:opacity-40"
          style={{ background:'linear-gradient(135deg,#FF4D00,#FF7A3D)', color:'#fff' }}>
          {saving ? 'Saving...' : `Save (${count} docs) & Continue`}
        </motion.button>
      </div>
    </div>
  )
}
