'use client'
import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import UploadZone from '../../../../components/shared/UploadZone'
import type { SectionProps } from '../../../../types/vendor-onboarding'

export default function Section3Visuals({ vendor, onSave, onNext, onBack }: SectionProps) {
  const [logoUrl, setLogoUrl] = useState(vendor?.logo || '')
  const [bannerUrl, setBannerUrl] = useState(vendor?.bannerUrl || vendor?.banner || '')
  const [saving, setSaving] = useState(false)

  const save = useCallback(async () => {
    setSaving(true)
    try {
      const { default: api } = await import('../../../../lib/api/client')
      await api.patch('/seller/profile', { logo: logoUrl, banner: bannerUrl })
      const score = (logoUrl ? 5 : 0) + (bannerUrl ? 5 : 0)
      onSave({ score })
    } finally { setSaving(false) }
  }, [logoUrl, bannerUrl, onSave])

  return (
    <div className="max-w-3xl">
      <h2 className="text-white font-bold text-xl mb-1">Logo & Banner</h2>
      <p className="text-white/40 text-sm mb-6">Upload your brand visuals</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="text-white/70 text-xs font-semibold mb-2 block">Company Logo</label>
          <UploadZone
            label="Upload your logo"
            accept="image/jpeg,image/png,image/svg+xml,image/webp"
            maxSizeMB={2}
            preview="image"
            folder="logos"
            onUpload={urls => setLogoUrl(urls[0])}
            existing={logoUrl ? [logoUrl] : []}
            hint="Recommended: 400×400px, transparent PNG"
          />
          {logoUrl && (
            <div className="mt-3 flex items-center gap-3 p-3 rounded-xl bg-white/5">
              <img src={logoUrl} alt="Logo preview" className="w-12 h-12 rounded-full object-cover" />
              <span className="text-green-400 text-xs font-semibold">✓ Logo uploaded</span>
            </div>
          )}
        </div>

        <div>
          <label className="text-white/70 text-xs font-semibold mb-2 block">Banner Image</label>
          <UploadZone
            label="Upload your banner"
            accept="image/jpeg,image/png,image/webp"
            maxSizeMB={5}
            preview="image"
            folder="banners"
            onUpload={urls => setBannerUrl(urls[0])}
            existing={bannerUrl ? [bannerUrl] : []}
            hint="Recommended: 1200×400px (3:1 ratio)"
          />
        </div>
      </div>

      {(logoUrl || bannerUrl) && (
        <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-white/50 text-xs mb-3">Preview how your company page will look:</p>
          <div className="rounded-xl overflow-hidden">
            {bannerUrl && (
              <div className="h-24 bg-cover bg-center" style={{ backgroundImage: `url(${bannerUrl})` }} />
            )}
            <div className="flex items-center gap-3 p-3 bg-white/5">
              {logoUrl ? (
                <img src={logoUrl} className="w-10 h-10 rounded-full object-cover" alt="" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/40 text-sm font-bold">
                  {vendor?.name?.[0] || '?'}
                </div>
              )}
              <div>
                <p className="text-white font-bold text-sm">{vendor?.name || 'Your Company'}</p>
                <p className="text-white/40 text-xs">{vendor?.city || 'City'}, {vendor?.state || 'State'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mt-8">
        {onBack && <button onClick={onBack} className="px-4 py-2 text-sm text-white/50 hover:text-white/80">Back</button>}
        <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
          onClick={save} disabled={saving}
          className="px-6 py-3 rounded-xl font-bold text-sm disabled:opacity-40"
          style={{ background:'linear-gradient(135deg,#FF4D00,#FF7A3D)', color:'#fff' }}>
          {saving ? 'Saving...' : 'Save & Continue'}
        </motion.button>
      </div>
    </div>
  )
}
