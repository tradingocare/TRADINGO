'use client'
import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import type { SectionProps } from '../../../../types/vendor-onboarding'

const SOCIAL_LINKS = [
  { key: 'website', label: 'Business Website', icon: '🌐', placeholder: 'https://yourcompany.com' },
  { key: 'instagramUrl', label: 'Instagram', icon: '📸', placeholder: 'https://instagram.com/yourpage' },
  { key: 'facebookUrl', label: 'Facebook', icon: '👍', placeholder: 'https://facebook.com/yourpage' },
  { key: 'youtubeUrl', label: 'YouTube', icon: '▶️', placeholder: 'https://youtube.com/@yourchannel' },
  { key: 'linkedinUrl', label: 'LinkedIn', icon: '💼', placeholder: 'https://linkedin.com/company/yourpage' },
  { key: 'whatsappUrl', label: 'WhatsApp Business', icon: '💬', placeholder: '9876543210' },
  { key: 'twitterUrl', label: 'Twitter / X', icon: '🐦', placeholder: 'https://twitter.com/yourhandle' },
  { key: 'indiamartUrl', label: 'IndiaMART', icon: '🛒', placeholder: 'https://indiamart.com/yourprofile' },
  { key: 'tradeindiaUrl', label: 'TradeIndia', icon: '🇮🇳', placeholder: 'https://tradeindia.com/yourprofile' },
]

export default function Section7WebsiteSocial({ vendor, onSave, onNext, onBack }: SectionProps) {
  const [links, setLinks] = useState<Record<string,string>>({
    website: vendor?.website || '',
    instagramUrl: vendor?.instagramUrl || '',
    facebookUrl: vendor?.facebookUrl || '',
    youtubeUrl: vendor?.youtubeUrl || '',
    linkedinUrl: vendor?.linkedinUrl || '',
    whatsappUrl: vendor?.whatsappUrl || '',
    twitterUrl: vendor?.twitterUrl || '',
    indiamartUrl: vendor?.indiamartUrl || '',
    tradeindiaUrl: vendor?.tradeindiaUrl || '',
  })
  const [saving, setSaving] = useState(false)

  const count = Object.values(links).filter(Boolean).length

  const presenceLabel = useMemo(() => {
    if (count >= 6) return 'Fully Digital'
    if (count >= 4) return 'Strong Presence'
    if (count >= 2) return 'Active Online'
    return 'Starter'
  }, [count])

  const presenceColor = useMemo(() => {
    if (count >= 6) return '#4ade80'
    if (count >= 4) return '#3D8BFF'
    if (count >= 2) return '#F2C94C'
    return '#f87171'
  }, [count])

  const save = useCallback(async () => {
    setSaving(true)
    try {
      const { default: api } = await import('../../../../lib/api/client')
      await api.patch('/seller/profile', links)
      onSave({ score: Math.min(count, 5) })
    } finally { setSaving(false) }
  }, [links, count, onSave])

  return (
    <div className="max-w-2xl">
      <h2 className="text-white font-bold text-xl mb-1">Website & Social Media</h2>
      <p className="text-white/40 text-sm mb-6">Connect your online presence</p>

      <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/60 text-xs font-semibold">Digital Presence Score</span>
          <span className="text-xs font-bold" style={{ color: presenceColor }}>{presenceLabel}</span>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden bg-white/10">
          <div className="h-full rounded-full transition-all" style={{ width: `${(count / 9) * 100}%`, background: presenceColor }} />
        </div>
        <p className="text-white/30 text-[10px] mt-2">Vendors with 3+ social links get 1.8x more buyer inquiries</p>
      </div>

      <div className="space-y-3">
        {SOCIAL_LINKS.map(link => (
          <div key={link.key} className="flex items-center gap-3">
            <span className="text-base w-6">{link.icon}</span>
            <input value={links[link.key]}
              onChange={e => setLinks(prev => ({ ...prev, [link.key]: e.target.value }))}
              placeholder={link.placeholder}
              className="flex-1 px-4 py-3 rounded-xl text-white text-sm bg-white/5 border border-white/10 focus:outline-none focus:border-[#FF4D00] transition-colors"
            />
            {links[link.key] && <span className="text-green-400 text-xs">✓</span>}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mt-8">
        {onBack && <button onClick={onBack} className="px-4 py-2 text-sm text-white/50 hover:text-white/80">Back</button>}
        <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
          onClick={save} disabled={saving}
          className="px-6 py-3 rounded-xl font-bold text-sm disabled:opacity-40"
          style={{ background:'linear-gradient(135deg,#FF4D00,#FF7A3D)', color:'#fff' }}>
          {saving ? 'Saving...' : `Save (${count} links) & Continue`}
        </motion.button>
      </div>
    </div>
  )
}
