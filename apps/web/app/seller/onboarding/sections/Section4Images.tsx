'use client'
import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import UploadZone from '../../../../components/shared/UploadZone'
import type { SectionProps } from '../../../../types/vendor-onboarding'
import { CheckCircle2 } from 'lucide-react'

const MAX_IMAGES = 5

export default function Section4Images({ vendor, onSave, onNext, onBack }: SectionProps) {
  const [uploads, setUploads] = useState<string[]>(vendor?.productImages || [])
  const [saving, setSaving] = useState(false)

  const save = useCallback(async () => {
    setSaving(true)
    try {
      const { default: api } = await import('../../../../lib/api/client')
      if (uploads.length > 0) {
        await api.patch('/seller/profile', { productImages: uploads })
      }
      onSave({ score: uploads.length > 0 ? 8 : 0 })
    } finally { setSaving(false) }
  }, [uploads, onSave])

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-white font-bold text-xl">Product Images</h2>
        <span className="text-white/40 text-sm">{uploads.length}/{MAX_IMAGES} images</span>
      </div>
      <p className="text-white/40 text-sm mb-6">Upload high-quality product photos to attract buyers</p>

      <div className="mb-6">
        <UploadZone
          label={`Upload up to ${MAX_IMAGES} product photos`}
          accept="image/jpeg,image/png,image/webp"
          maxSizeMB={5}
          multiple
          preview="image"
          folder="products/showcase"
          onUpload={urls => setUploads(prev => [...prev, ...urls].slice(0, MAX_IMAGES))}
          existing={uploads}
        />
      </div>

      {uploads.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-surface border border-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-text-secondary text-xs font-semibold">Uploaded Images</span>
            <span className="text-xs text-green-400 flex items-center gap-1">
              <CheckCircle2 size={11} /> {uploads.length} of {MAX_IMAGES}
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {uploads.map((url, i) => (
              <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-border">
                <img src={url} alt={`Product ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => setUploads(prev => prev.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 rounded-xl bg-surface border border-border">
        <p className="text-[#f59e0b] text-xs font-semibold mb-1">Best practices for product photos:</p>
        <ul className="text-white/40 text-xs space-y-1">
          <li>✓ Use natural daylight or a clean background</li>
          <li>✓ Show the product from multiple angles</li>
          <li>✓ Include a scale reference (e.g., ruler or coin)</li>
          <li>✓ Fill at least 80% of the frame with the product</li>
        </ul>
      </div>

      <div className="flex items-center gap-3 mt-8">
        {onBack && <button onClick={onBack} className="px-4 py-2 text-sm text-white/50 hover:text-white/80 transition-colors">Back</button>}
        <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
          onClick={save} disabled={saving}
          className="px-6 py-3 rounded-xl font-bold text-sm disabled:opacity-40 transition-all"
          style={{ background:'linear-gradient(135deg,#f59e0b,#fbbf24)', color:'#fff' }}>
          {saving ? 'Saving...' : uploads.length > 0 ? 'Save & Continue' : 'Skip & Continue'}
        </motion.button>
      </div>
    </div>
  )
}
