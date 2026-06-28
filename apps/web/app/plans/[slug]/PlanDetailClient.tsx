'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import api from '../../../lib/api/client'
import { useAuthStore } from '../../../store/auth-store'
import { CheckCircle2, ArrowLeft, ArrowRight, Zap, Crown, Star, Shield } from 'lucide-react'

interface Plan {
  id: string; planId: string; name: string; description: string
  pricePlanA: number; pricePlanB: number; pricePlanC: number
  features: string[]; sortOrder: number
}

const PLANS_META: Record<string, { icon: any; color: string }> = {
  Trade_Start:   { icon: Star,   color: '#6b7280' },
  Trade_Smart:   { icon: Shield, color: '#3D8BFF' },
  Trade_Plus:    { icon: Shield, color: '#9B5DE5' },
  Trade_Pro:     { icon: Crown,  color: '#FF4D00' },
  Trade_Premium: { icon: Crown,  color: '#F2C94C' },
  Trade_Elite:   { icon: Zap,    color: '#4ade80' },
}

const PLAN_TIERS = [
  { id:'A', label:'Plan A', suffix:'/year', desc:'Best for first-year sellers' },
  { id:'B', label:'Plan B', suffix:'/2 years', desc:'Best value — 2-year commitment' },
  { id:'C', label:'Plan C', suffix:'/3 years', desc:'Maximum savings — 3-year commitment' },
]

const formatPrice = (n: number) => '₹' + n.toLocaleString('en-IN')

export default function PlanDetailClient() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const slug = params.slug as string
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)
  const [tier, setTier] = useState('A')

  useEffect(() => {
    api.get(`/membership/plans/${slug}`)
      .then((r: any) => {
        const d = r.data?.data || r.data || r
        setPlan(d)
      })
      .catch(() => router.push('/plans'))
      .finally(() => setLoading(false))
  }, [slug, router])

  const handlePurchase = () => {
    if (user) {
      const params = new URLSearchParams({ planId: slug, tier })
      router.push(`/plans/vendor/purchase?${params}`)
    } else {
      const params = new URLSearchParams({ next: `/plans/vendor/purchase?planId=${slug}&tier=${tier}` })
      router.push(`/login?${params}`)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background:'#0A0A0F' }}>
      <div className="w-12 h-12 rounded-full border-2 border-t-[#FF4D00] border-white/10 animate-spin" />
    </div>
  )

  if (!plan) return null

  const meta = PLANS_META[plan.name.replace(/\s/g, '_')] || PLANS_META.Trade_Start
  const Icon = meta.icon
  const price = tier === 'B' ? plan.pricePlanB : tier === 'C' ? plan.pricePlanC : plan.pricePlanA
  const currentTier = PLAN_TIERS.find(t => t.id === tier)!

  return (
    <div className="min-h-screen" style={{ background:'#0A0A0F' }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background:'radial-gradient(circle,#9B5DE520,transparent 70%)', filter:'blur(80px)' }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        <button onClick={() => router.push('/plans')}
          className="flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors mb-8 text-sm">
          <ArrowLeft size={14} /> Back to Plans
        </button>

        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
          className="rounded-2xl p-8 border"
          style={{
            background: 'rgba(255,255,255,0.03)',
            borderColor: 'rgba(255,255,255,0.1)',
          }}>
          <div className="flex items-center gap-3 mb-4">
            <Icon size={28} style={{ color: meta.color }} />
            <h1 className="text-white font-black text-2xl">{plan.name}</h1>
          </div>
          <p className="text-white/50 text-sm mb-6">{plan.description}</p>

          <div className="flex items-center gap-2 mb-6">
            {PLAN_TIERS.map(t => (
              <button key={t.id} onClick={() => setTier(t.id)}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all text-left"
                style={{
                  background: tier === t.id ? 'rgba(255,77,0,0.12)' : 'rgba(255,255,255,0.04)',
                  border: tier === t.id ? '1px solid rgba(255,77,0,0.35)' : '1px solid rgba(255,255,255,0.08)',
                  color: tier === t.id ? '#FF4D00' : 'rgba(255,255,255,0.5)',
                }}>
                <div>{t.label}</div>
                <div className="text-[10px] opacity-60">{t.desc}</div>
              </button>
            ))}
          </div>

          <div className="flex items-baseline gap-1.5 mb-6">
            <span className="text-white font-black text-4xl">{formatPrice(price)}</span>
            <span className="text-white/30 text-sm">{currentTier.suffix}</span>
          </div>

          <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
            onClick={handlePurchase}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 mb-8"
            style={{
              background: 'linear-gradient(135deg,#FF4D00,#FF7A3D)',
              color: '#fff',
            }}>
            {user ? 'Purchase Now' : 'Sign Up & Purchase'} <ArrowRight size={14} />
          </motion.button>

          <h3 className="text-white font-bold text-base mb-4">Features</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(plan.features as string[]).map((f, fi) => (
              <div key={fi} className="flex items-center gap-2 text-white/60 text-sm">
                <CheckCircle2 size={14} className="text-green-400 flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
