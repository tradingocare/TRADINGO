'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuthStore } from '../../../store/auth-store'
import { getAccessToken } from '../../../lib/auth'
import api from '../../../lib/api/client'
import toast from 'react-hot-toast'
import { CheckCircle2, Sparkles } from 'lucide-react'

import Section1BasicInfo from './sections/Section1BasicInfo'
import Section2Categories from './sections/Section2Categories'
import Section3Visuals from './sections/Section3Visuals'
import Section4AIImages from './sections/Section4AIImages'
import Section5Catalog from './sections/Section5Catalog'
import Section6Documents from './sections/Section6Documents'
import Section7WebsiteSocial from './sections/Section7WebsiteSocial'
import Section8Products from './sections/Section8Products'
import Section9Ratings from './sections/Section9Ratings'

const SECTIONS = [
  { key:'basicInfo',       title:'Basic Info',        icon:'🏢', maxScore:10 },
  { key:'categories',      title:'Categories',         icon:'📂', maxScore:15 },
  { key:'visuals',         title:'Logo & Banner',      icon:'🖼️', maxScore:10 },
  { key:'aiImages',        title:'AI Product Images',  icon:'🤖', maxScore:8  },
  { key:'catalog',         title:'Product Catalog',    icon:'📋', maxScore:15 },
  { key:'documents',       title:'Company Documents',  icon:'📄', maxScore:12 },
  { key:'websiteAndSocial',title:'Website & Social',   icon:'🌐', maxScore:5  },
  { key:'products',        title:'List Products',      icon:'📦', maxScore:20 },
  { key:'ratingsSetup',    title:'Ratings & Reviews',  icon:'⭐', maxScore:5  },
]

export default function OnboardingClient() {
  const { user, setAuth } = useAuthStore()
  const router = useRouter()
  const [authReady, setAuthReady] = useState(false)

  const [activeSection, setActiveSection] = useState(0)
  const [scores, setScores] = useState<Record<string,number>>({})
  const [completed, setCompleted] = useState<Record<string,boolean>>({})
  const [vendor, setVendor] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getAccessToken()

    if (!token) {
      router.push(`/login?next=${encodeURIComponent('/seller/onboarding')}`)
      return
    }

    if (user) {
      if (user.role !== 'SELLER') {
        router.push('/')
      } else {
        setAuthReady(true)
      }
      return
    }

    api.get('/auth/me')
      .then((r: any) => {
        const u = r.data?.user || r.data
        setAuth(u, token)
        if (u.role !== 'SELLER') {
          router.push('/')
        } else {
          setAuthReady(true)
        }
      })
      .catch(() => {
        router.push(`/login?next=${encodeURIComponent('/seller/onboarding')}`)
      })
  }, [user, router, setAuth])

  useEffect(() => {
    if (!authReady) return
    api.get('/seller/profile')
      .then((r: any) => {
        const d = r.data?.data || r.data || r
        setVendor(d)
        calculateCompletion(d)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [authReady])

  const calculateCompletion = (v: any) => {
    const s: Record<string,number> = {}
    const c: Record<string,boolean> = {}

    const biScore = [v.name, v.description, v.sellerType].filter(Boolean).length * 3.3
    s.basicInfo = Math.min(Math.round(biScore), 10)
    c.basicInfo = biScore >= 8

    s.categories = (v.categories?.length ?? 0) > 0 ? 15 : 0
    c.categories = (v.categories?.length ?? 0) > 0

    s.visuals = (v.logo ? 5 : 0) + (v.bannerUrl ? 5 : 0)
    c.visuals = !!(v.logo && v.bannerUrl)

    s.aiImages = 0
    c.aiImages = false

    s.catalog = 0
    c.catalog = false

    const docs = [v.gstCertUrl, v.panCardUrl, v.tradeLicenseUrl].filter(Boolean).length
    s.documents = Math.min(docs * 4, 12)
    c.documents = docs >= 2

    const socials = [v.website, v.instagramUrl, v.linkedinUrl, v.youtubeUrl].filter(Boolean).length
    s.websiteAndSocial = Math.min(socials * 2, 5)
    c.websiteAndSocial = socials >= 1

    const prodScore = Math.min((v.productCount ?? 0) * 4, 20)
    s.products = prodScore
    c.products = (v.productCount ?? 0) >= 1

    s.ratingsSetup = 0
    c.ratingsSetup = false

    setScores(s)
    setCompleted(c)
  }

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0)

  const onSectionSave = useCallback((sectionKey: string, score: number) => {
    setScores(prev => ({ ...prev, [sectionKey]: score }))
    setCompleted(prev => {
      const maxScore = SECTIONS.find(s => s.key === sectionKey)?.maxScore ?? 10
      return { ...prev, [sectionKey]: score >= maxScore * 0.8 }
    })
    toast.success('Saved!')
  }, [])

  const goLive = async () => {
    if (totalScore < 70) { toast.error('Complete at least 70% to go live'); return }
    try {
      await api.post('/seller/go-live')
      toast.success('Your store is now LIVE on TRADINGO!')
      router.push('/seller/dashboard')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error going live')
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background:'#1D0001' }}>
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-2 border-t-[#FF4D00] border-white/10 animate-spin mx-auto mb-4" />
        <p className="text-white/40 text-sm">Loading your profile...</p>
      </div>
    </div>
  )

  const scoreColor = totalScore >= 90 ? '#4ade80'
    : totalScore >= 70 ? '#3D8BFF'
    : totalScore >= 40 ? '#F2C94C'
    : '#f87171'

  const scoreLabel = totalScore >= 90 ? 'Fully Active'
    : totalScore >= 70 ? 'Almost Ready'
    : totalScore >= 40 ? 'In Progress'
    : 'Getting Started'

  return (
    <div className="min-h-screen" style={{ background:'#1D0001' }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-12"
          style={{ background:'radial-gradient(circle,#9B5DE520,transparent 70%)', filter:'blur(80px)' }} />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background:'radial-gradient(circle,#FF4D0018,transparent 70%)', filter:'blur(80px)' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-white font-black text-2xl sm:text-3xl">Complete Your Seller Profile</h1>
            <p className="text-white/40 text-sm mt-1">
              The more you complete, the more buyers trust you. Higher completion = more orders.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20">
              <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
                <circle cx="40" cy="40" r="34" fill="none" stroke={scoreColor} strokeWidth="7"
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - totalScore/100)}`}
                  strokeLinecap="round" className="transition-all duration-700" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-black text-white text-lg leading-none">{totalScore}</span>
                <span className="text-white/30 text-[8px]">/ 100</span>
              </div>
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: scoreColor }}>{scoreLabel}</p>
              <p className="text-white/35 text-xs">Profile Score</p>
              {totalScore >= 70 && (
                <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                  onClick={goLive}
                  className="mt-2 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
                  style={{ background:'linear-gradient(135deg,#FF4D00,#FF7A3D)', color:'#fff' }}>
                  <Sparkles size={11} /> Go Live!
                </motion.button>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-1.5 mb-8 overflow-x-auto no-scrollbar pb-1">
          {SECTIONS.map((s, i) => {
            const sectionScore = scores[s.key] ?? 0
            const pct = Math.min((sectionScore / s.maxScore) * 100, 100)
            const done = completed[s.key]
            const active = activeSection === i
            return (
              <button key={s.key} onClick={() => setActiveSection(i)}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 px-3 py-2 rounded-xl transition-all duration-200"
                style={{
                  background: active ? 'rgba(255,77,0,0.12)' : 'rgba(255,255,255,0.04)',
                  border: active ? '1px solid rgba(255,77,0,0.35)' : '1px solid rgba(255,255,255,0.07)',
                  minWidth: '75px',
                }}>
                <div className="flex items-center gap-1">
                  <span className="text-base">{s.icon}</span>
                  {done && <CheckCircle2 size={11} className="text-green-400" />}
                </div>
                <span className="text-[9px] font-semibold text-white/60 text-center leading-tight whitespace-nowrap">{s.title}</span>
                <div className="w-full h-1 rounded-full overflow-hidden bg-white/10">
                  <div className="h-full rounded-full transition-all"
                    style={{ width:`${pct}%`, background: done ? '#4ade80' : active ? '#FF4D00' : '#6b7280' }} />
                </div>
                <span className="text-[8px] text-white/25">{sectionScore}/{s.maxScore}</span>
              </button>
            )
          })}
        </div>

        <motion.div key={activeSection} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.3 }}>
          {activeSection === 0 && <Section1BasicInfo vendor={vendor} onSave={d => onSectionSave('basicInfo', d.score)} onNext={() => setActiveSection(1)} />}
          {activeSection === 1 && <Section2Categories vendor={vendor} onSave={d => onSectionSave('categories', d.score)} onNext={() => setActiveSection(2)} onBack={() => setActiveSection(0)} />}
          {activeSection === 2 && <Section3Visuals vendor={vendor} onSave={d => onSectionSave('visuals', d.score)} onNext={() => setActiveSection(3)} onBack={() => setActiveSection(1)} />}
          {activeSection === 3 && <Section4AIImages vendor={vendor} onSave={d => onSectionSave('aiImages', d.score)} onNext={() => setActiveSection(4)} onBack={() => setActiveSection(2)} />}
          {activeSection === 4 && <Section5Catalog vendor={vendor} onSave={d => onSectionSave('catalog', d.score)} onNext={() => setActiveSection(5)} onBack={() => setActiveSection(3)} />}
          {activeSection === 5 && <Section6Documents vendor={vendor} onSave={d => onSectionSave('documents', d.score)} onNext={() => setActiveSection(6)} onBack={() => setActiveSection(4)} />}
          {activeSection === 6 && <Section7WebsiteSocial vendor={vendor} onSave={d => onSectionSave('websiteAndSocial', d.score)} onNext={() => setActiveSection(7)} onBack={() => setActiveSection(5)} />}
          {activeSection === 7 && <Section8Products vendor={vendor} onSave={d => onSectionSave('products', d.score)} onNext={() => setActiveSection(8)} onBack={() => setActiveSection(6)} />}
          {activeSection === 8 && <Section9Ratings vendor={vendor} onSave={d => onSectionSave('ratingsSetup', d.score)} onBack={() => setActiveSection(7)} totalScore={totalScore} onGoLive={goLive} />}
        </motion.div>
      </div>
    </div>
  )
}
