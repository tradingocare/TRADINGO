'use client'
import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import type { SectionProps } from '../../../../types/vendor-onboarding'
import { Star, Rocket, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

const SECTIONS_FINAL = [
  { key:'basicInfo',       label:'Basic Info',        maxScore:10 },
  { key:'categories',      label:'Categories',         maxScore:15 },
  { key:'visuals',         label:'Logo & Banner',      maxScore:10 },
  { key:'aiImages',        label:'AI Images',          maxScore:8  },
  { key:'catalog',         label:'Product Catalog',    maxScore:15 },
  { key:'documents',       label:'Documents',          maxScore:12 },
  { key:'websiteAndSocial',label:'Website & Social',   maxScore:5  },
  { key:'products',        label:'Products',           maxScore:20 },
  { key:'ratingsSetup',    label:'Ratings & Reviews',  maxScore:5  },
]

const SELF_RATING_FIELDS = [
  { key: 'quality', label: 'Product Quality' },
  { key: 'packaging', label: 'Packaging' },
  { key: 'service', label: 'Customer Service' },
  { key: 'delivery', label: 'Delivery Timeliness' },
]

export default function Section9Ratings({ vendor, onSave, onBack, totalScore = 0, onGoLive }: SectionProps & { totalScore?: number; onGoLive?: () => void }) {
  const [reviewMode, setReviewMode] = useState<'open'|'verified'|'approved'>('open')
  const [message, setMessage] = useState('Hi [Buyer Name], thank you for your order of [Product Name]. We hope you\'re satisfied. Please take a moment to share your experience on TRADINGO — it helps us serve you better!')
  const [importUrls, setImportUrls] = useState({ indiamart: '', tradeindia: '', google: '' })
  const [selfRatings, setSelfRatings] = useState<Record<string,number>>({ quality: 4, packaging: 4, service: 4, delivery: 4 })
  const [saving, setSaving] = useState(false)

  const save = useCallback(async () => {
    setSaving(true)
    try {
      const { default: api } = await import('../../../../lib/api/client')
      await api.patch('/seller/profile', {
        reviewPreferences: { mode: reviewMode, message },
        selfRatings,
      })
      onSave({ score: 5 })
      toast.success('Ratings setup saved!')
    } catch { toast.error('Error saving') }
    finally { setSaving(false) }
  }, [reviewMode, message, selfRatings, onSave])

  const sectionScores: Record<string, number> = {
    basicInfo: vendor?.basicInfoScore ?? 10,
    categories: vendor?.categories?.length > 0 ? 15 : 0,
    visuals: (vendor?.logo ? 5 : 0) + (vendor?.bannerUrl ? 5 : 0),
    aiImages: 0,
    catalog: vendor?.catalogPdfUrl ? 15 : 0,
    documents: 6,
    websiteAndSocial: vendor?.website ? 5 : 0,
    products: Math.min((vendor?.productCount ?? 0) * 4, 20),
    ratingsSetup: 0,
  }

  return (
    <div className="max-w-3xl">
      <h2 className="text-white font-bold text-xl mb-1">Ratings & Reviews Setup</h2>
      <p className="text-white/40 text-sm mb-6">Configure how reviews work for your store</p>

      <div className="space-y-6">
        <div>
          <label className="text-white/70 text-xs font-semibold mb-3 block">How would you like to collect reviews?</label>
          <div className="space-y-2">
            {[
              { value: 'open', label: 'Open Reviews', desc: 'Any buyer who orders from you can leave a review' },
              { value: 'verified', label: 'Verified-Only Reviews', desc: 'Only buyers with confirmed orders can review' },
              { value: 'approved', label: 'Reviews with Approval', desc: 'You approve/reject reviews before they appear (not recommended)' },
            ].map(r => (
              <button key={r.value} onClick={() => setReviewMode(r.value as typeof reviewMode)}
                className="w-full text-left p-4 rounded-xl transition-all"
                style={{
                  background: reviewMode === r.value ? 'rgba(255,77,0,0.08)' : 'rgba(255,255,255,0.03)',
                  border: reviewMode === r.value ? '1px solid rgba(255,77,0,0.3)' : '1px solid rgba(255,255,255,0.08)',
                }}>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                    style={{ borderColor: reviewMode === r.value ? '#FF4D00' : 'rgba(255,255,255,0.2)' }}>
                    {reviewMode === r.value && <div className="w-2 h-2 rounded-full bg-[#FF4D00]" />}
                  </div>
                  <span className="text-white text-sm font-medium">{r.label}</span>
                </div>
                <p className="text-white/40 text-xs ml-6 mt-1">{r.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-white/70 text-xs font-semibold mb-2 block">Review Invitation Message</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-white text-sm bg-white/5 border border-white/10 focus:outline-none focus:border-[#FF4D00] min-h-[80px]"
            maxLength={300} />
          <span className="text-white/20 text-xs">{message.length}/300</span>
        </div>

        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <label className="flex items-center gap-2 cursor-pointer mb-3">
            <input type="checkbox" className="accent-[#FF4D00]"
              onChange={e => { if (!e.target.checked) setImportUrls({ indiamart: '', tradeindia: '', google: '' }) }} />
            <span className="text-white text-sm">I have reviews on other platforms</span>
          </label>
          <div className="space-y-2">
            <input placeholder="IndiaMART profile URL" value={importUrls.indiamart}
              onChange={e => setImportUrls(p => ({ ...p, indiamart: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg text-white text-xs bg-white/5 border border-white/10 focus:outline-none focus:border-[#FF4D00]" />
            <input placeholder="TradeIndia profile URL" value={importUrls.tradeindia}
              onChange={e => setImportUrls(p => ({ ...p, tradeindia: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg text-white text-xs bg-white/5 border border-white/10 focus:outline-none focus:border-[#FF4D00]" />
            <input placeholder="Google My Business URL" value={importUrls.google}
              onChange={e => setImportUrls(p => ({ ...p, google: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg text-white text-xs bg-white/5 border border-white/10 focus:outline-none focus:border-[#FF4D00]" />
          </div>
        </div>

        <div>
          <label className="text-white/70 text-xs font-semibold mb-3 block">Self Assessment</label>
          <p className="text-white/30 text-xs mb-3">Rate your business on these factors (buyers will verify over time)</p>
          <div className="space-y-2">
            {SELF_RATING_FIELDS.map(field => (
              <div key={field.key} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                <span className="text-white/70 text-sm">{field.label}</span>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(s => (
                    <button key={s} onClick={() => setSelfRatings(p => ({ ...p, [field.key]: s }))}>
                      <Star size={16} className={s <= (selfRatings[field.key] || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-white/20'} />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Final Summary */}
        <div className="p-6 rounded-xl bg-white/5 border border-white/10">
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <Rocket size={18} className="text-[#FF4D00]" /> Your Profile Summary
          </h3>
          <div className="space-y-2">
            {SECTIONS_FINAL.map(s => {
              const score = sectionScores[s.key] ?? 0
              const pct = Math.min((score / s.maxScore) * 100, 100)
              return (
                <div key={s.key} className="flex items-center gap-3">
                  <span className="text-xs font-semibold"
                    style={{ color: pct >= 80 ? '#4ade80' : pct >= 50 ? '#F2C94C' : '#f87171' }}>
                    {pct >= 80 ? '✓' : pct >= 50 ? '○' : '○'}
                  </span>
                  <span className="flex-1 text-white text-xs">{s.label}</span>
                  <div className="w-24 h-1.5 rounded-full overflow-hidden bg-white/10">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: pct >= 80 ? '#4ade80' : pct >= 50 ? '#F2C94C' : '#f87171' }} />
                  </div>
                  <span className="text-white/40 text-xs w-12 text-right">{score}/{s.maxScore}</span>
                </div>
              )
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white font-bold text-lg">Total Score</span>
              <span className="text-2xl font-black" style={{ color: totalScore >= 70 ? '#4ade80' : totalScore >= 40 ? '#F2C94C' : '#f87171' }}>
                {totalScore}/100
              </span>
            </div>

            {totalScore >= 70 ? (
              <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                onClick={onGoLive}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-base"
                style={{ background:'linear-gradient(135deg,#FF4D00,#FF7A3D)', color:'#fff' }}>
                <Sparkles size={18} /> Launch My Store on TRADINGO
              </motion.button>
            ) : (
              <div className="p-4 rounded-xl text-center"
                style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)' }}>
                <p className="text-white/50 text-sm font-medium">Complete {70 - totalScore} more points to go live</p>
                <p className="text-white/30 text-xs mt-1">Complete more sections above to unlock marketplace listing</p>
              </div>
            )}
          </div>
        </div>
      </div>

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
