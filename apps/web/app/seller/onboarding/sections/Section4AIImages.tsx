'use client'
import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import UploadZone from '../../../../components/shared/UploadZone'
import type { SectionProps } from '../../../../types/vendor-onboarding'
import { Sparkles } from 'lucide-react'

const ENHANCEMENTS = [
  { value: 'studio', label: 'Professional Studio' },
  { value: 'white', label: 'White Background' },
  { value: 'lifestyle', label: 'Lifestyle Context' },
  { value: 'marketplace', label: 'Marketplace Standard' },
]

export default function Section4AIImages({ vendor, onSave, onNext, onBack }: SectionProps) {
  const [uploads, setUploads] = useState<string[]>([])
  const [enhancement, setEnhancement] = useState('studio')
  const [enhancing, setEnhancing] = useState(false)
  const [enhanced, setEnhanced] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const enhanceImages = useCallback(async () => {
    if (uploads.length === 0) return
    setEnhancing(true)
    // Stub: simulate AI processing delay
    await new Promise(r => setTimeout(r, 2000))
    setEnhanced(uploads)
    setEnhancing(false)
  }, [uploads])

  const save = useCallback(async () => {
    setSaving(true)
    try {
      const { default: api } = await import('../../../../lib/api/client')
      if (enhanced.length > 0) {
        await api.patch('/seller/profile', { aiGeneratedImages: enhanced })
      }
      onSave({ score: enhanced.length > 0 ? 8 : 0 })
    } finally { setSaving(false) }
  }, [enhanced, onSave])

  return (
    <div className="max-w-3xl">
      <h2 className="text-white font-bold text-xl mb-1">AI Product Images</h2>
      <p className="text-white/40 text-sm mb-6">Upload real product photos and enhance them with AI</p>

      <div className="space-y-6">
        <div>
          <label className="text-white/70 text-xs font-semibold mb-2 block">Upload Your Product Photos</label>
          <UploadZone
            label="Upload 1-3 product photos (mobile photos work)"
            accept="image/jpeg,image/png"
            maxSizeMB={5}
            multiple
            preview="image"
            folder="products/raw"
            onUpload={urls => setUploads(prev => [...prev, ...urls].slice(0, 3))}
            existing={uploads}
          />
        </div>

        {uploads.length > 0 && (
          <div>
            <label className="text-white/70 text-xs font-semibold mb-2 block">AI Enhancement Type</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {ENHANCEMENTS.map(e => (
                <button key={e.value} onClick={() => setEnhancement(e.value)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: enhancement === e.value ? 'rgba(255,77,0,0.15)' : 'rgba(255,255,255,0.05)',
                    border: enhancement === e.value ? '1px solid rgba(255,77,0,0.35)' : '1px solid rgba(255,255,255,0.1)',
                    color: enhancement === e.value ? '#FF4D00' : 'rgba(255,255,255,0.6)',
                  }}>{e.label}</button>
              ))}
            </div>

            {enhanced.length === 0 && (
              <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                onClick={enhanceImages} disabled={enhancing}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm"
                style={{ background:'linear-gradient(135deg,#9B5DE5,#3D8BFF)', color:'#fff' }}>
                <Sparkles size={14} />
                {enhancing ? 'AI is enhancing your images...' : 'Generate AI-Enhanced Images'}
              </motion.button>
            )}

            {enhancing && (
              <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full border-2 border-t-[#FF4D00] border-white/10 animate-spin" />
                  <p className="text-white/60 text-sm">AI is processing your images...</p>
                </div>
              </div>
            )}

            {enhanced.length > 0 && (
              <div className="mt-4">
                <p className="text-green-400 text-xs font-semibold mb-3">✓ {enhanced.length} images enhanced successfully</p>
                <div className="flex gap-3">
                  {enhanced.map((url, i) => (
                    <div key={i} className="relative group">
                      <img src={url} alt={`Enhanced ${i + 1}`} className="w-32 h-32 object-cover rounded-xl" />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all flex items-end p-2">
                        <span className="text-white text-[10px] font-semibold">Enhanced</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-[#FF4D00] text-xs font-semibold mb-1">💡 Tips for best AI results:</p>
          <ul className="text-white/40 text-xs space-y-1">
            <li>✓ Shoot in natural daylight</li>
            <li>✓ Single product per photo</li>
            <li>✓ Keep background simple (wall/floor)</li>
            <li>✓ Fill 80% of frame with product</li>
          </ul>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-8">
        {onBack && <button onClick={onBack} className="px-4 py-2 text-sm text-white/50 hover:text-white/80">Back</button>}
        <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
          onClick={save} disabled={saving}
          className="px-6 py-3 rounded-xl font-bold text-sm disabled:opacity-40"
          style={{ background:'linear-gradient(135deg,#FF4D00,#FF7A3D)', color:'#fff' }}>
          {saving ? 'Saving...' : enhanced.length > 0 ? 'Use These Images & Continue' : 'Skip & Continue'}
        </motion.button>
      </div>
    </div>
  )
}
