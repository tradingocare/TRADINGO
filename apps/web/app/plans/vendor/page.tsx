'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import api from '../../../lib/api/client'
import { CheckCircle2, X, Zap, Crown, Star, Shield, Sparkles, ArrowRight } from 'lucide-react'

interface Plan {
  id: string; planId: string; name: string; description: string
  pricePlanA: number; pricePlanB: number; pricePlanC: number
  features: string[]; sortOrder: number
}

const PLANS_META: Record<string, { icon: any; badge?: string; color: string }> = {
  Trade_Start:   { icon: Star,   color: '#6b7280' },
  Trade_Smart:   { icon: Shield, color: '#3D8BFF' },
  Trade_Plus:    { icon: Shield, color: '#9B5DE5' },
  Trade_Pro:     { icon: Crown,  color: '#FF4D00', badge: 'Recommended' },
  Trade_Premium: { icon: Crown,  color: '#F2C94C', badge: 'Premium' },
  Trade_Elite:   { icon: Zap,    color: '#4ade80', badge: 'Ultimate' },
}

const ALL_FEATURES = [
  { key:'buyerVisibility', label:'Buyer Visibility' },
  { key:'goReach', label:'GO Reach' },
  { key:'chat', label:'Chat' },
  { key:'rfq', label:'RFQ' },
  { key:'flexiblePricing', label:'Flexible Pricing' },
  { key:'directOrders', label:'Direct Orders' },
  { key:'sellerBadge', label:'Seller Badge' },
  { key:'branding', label:'Branding' },
  { key:'businessProfile', label:'Business Profile' },
  { key:'website', label:'Website' },
  { key:'cataloguePdf', label:'Catalogue PDF' },
  { key:'analytics', label:'Analytics' },
  { key:'relationshipManager', label:'Relationship Manager' },
  { key:'featuredVisibility', label:'Featured Visibility' },
  { key:'everything', label:'Everything' },
]

const PLAN_TIERS = [
  { id:'A', label:'Plan A', suffix:'/year', multiplier:1 },
  { id:'B', label:'Plan B', suffix:'/2 years', multiplier:2 },
  { id:'C', label:'Plan C', suffix:'/3 years', multiplier:3 },
]

const formatPrice = (n: number) => '₹' + n.toLocaleString('en-IN')

export default function PlansPage() {
  const router = useRouter()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [tier, setTier] = useState('A')
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  useEffect(() => {
    api.get('/membership/plans')
      .then((r: any) => {
        const d = r.data?.data || r.data || r
        setPlans(Array.isArray(d) ? d : [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const getPrice = (plan: Plan, t: string) => {
    const base = t === 'B' ? plan.pricePlanB : t === 'C' ? plan.pricePlanC : plan.pricePlanA
    return base
  }

  const hasFeature = (planFeatures: string[], featureKey: string): boolean | string => {
    const labels = ALL_FEATURES.find(f => f.key === featureKey)?.label
    if (!labels) return false
    return planFeatures.some(f => f.toLowerCase().includes(labels.toLowerCase()))
  }

  const choosePlan = (planId: string) => {
    setSelectedPlan(planId)
    const params = new URLSearchParams({ planId, tier })
    router.push(`/plans/vendor/purchase?${params}`)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background:'#1D0001' }}>
      <div className="w-12 h-12 rounded-full border-2 border-t-[#FF4D00] border-white/10 animate-spin" />
    </div>
  )

  const currentTier = PLAN_TIERS.find(t => t.id === tier)!

  return (
    <div className="min-h-screen" style={{ background:'#1D0001' }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background:'radial-gradient(circle,#9B5DE520,transparent 70%)', filter:'blur(80px)' }} />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full opacity-8"
          style={{ background:'radial-gradient(circle,#FF4D0018,transparent 70%)', filter:'blur(80px)' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <motion.h1 initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
            className="text-white font-black text-3xl sm:text-4xl mb-3">
            Choose Your <span style={{ background:'linear-gradient(135deg,#FF4D00,#FF7A3D)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Membership</span> Plan
          </motion.h1>
          <p className="text-white/40 text-sm max-w-xl mx-auto">
            Pick the plan that fits your business. Upgrade anytime as you grow.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-10">
          {PLAN_TIERS.map(t => (
            <button key={t.id} onClick={() => setTier(t.id)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: tier === t.id ? 'rgba(255,77,0,0.12)' : 'rgba(255,255,255,0.04)',
                border: tier === t.id ? '1px solid rgba(255,77,0,0.35)' : '1px solid rgba(255,255,255,0.08)',
                color: tier === t.id ? '#FF4D00' : 'rgba(255,255,255,0.5)',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-12">
          {plans.map((plan, i) => {
            const meta = PLANS_META[plan.name.replace(/\s/g, '_')] || PLANS_META.Trade_Start
            const Icon = meta.icon
            const price = getPrice(plan, tier)
            return (
              <motion.div key={plan.id} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: i * 0.05 }}
                className="relative rounded-2xl p-5 transition-all duration-300 flex flex-col"
                style={{
                  background: meta.badge === 'Recommended' ? 'rgba(255,77,0,0.06)' : 'rgba(255,255,255,0.03)',
                  border: meta.badge === 'Recommended' ? '1px solid rgba(255,77,0,0.3)' : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: meta.badge === 'Recommended' ? '0 0 30px rgba(255,77,0,0.1)' : 'none',
                }}>
                {meta.badge && (
                  <span className="absolute -top-2.5 left-3 px-2.5 py-0.5 rounded-full text-[9px] font-bold"
                    style={{
                      background: 'linear-gradient(135deg,#FF4D00,#FF7A3D)',
                      color: '#fff',
                    }}>
                    {meta.badge}
                  </span>
                )}
                <Icon size={22} style={{ color: meta.color }} className="mb-2" />
                <h3 className="text-white font-bold text-base mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-0.5 mb-3">
                  <span className="text-white font-black text-2xl">{formatPrice(price)}</span>
                  <span className="text-white/30 text-xs">{currentTier.suffix}</span>
                </div>
                <ul className="space-y-2 mb-5 flex-1">
                  {(plan.features as string[]).slice(0, 6).map((f, fi) => (
                    <li key={fi} className="flex items-center gap-2 text-white/50 text-[11px]">
                      <CheckCircle2 size={10} className="text-green-400 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                  onClick={() => choosePlan(plan.planId)}
                  className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5"
                  style={{
                    background: meta.badge === 'Recommended' ? 'linear-gradient(135deg,#FF4D00,#FF7A3D)' : 'rgba(255,255,255,0.06)',
                    border: meta.badge !== 'Recommended' ? '1px solid rgba(255,255,255,0.1)' : 'none',
                    color: meta.badge === 'Recommended' ? '#fff' : 'rgba(255,255,255,0.8)',
                  }}>
                  Choose Plan <ArrowRight size={14} />
                </motion.button>
              </motion.div>
            )
          })}
        </div>

        <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/[0.02]">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-white font-bold text-lg">Full Feature Comparison</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-6 py-4 text-white/50 text-xs font-semibold">Feature</th>
                  {plans.map(p => (
                    <th key={p.id} className="px-4 py-4 text-white text-xs font-bold text-center">{p.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ALL_FEATURES.map(f => (
                  <tr key={f.key} className="border-b border-white/5">
                    <td className="px-6 py-3 text-white/60 text-xs">{f.label}</td>
                    {plans.map(p => {
                      const has = (p.features as string[]).some(pf => pf.toLowerCase().includes(f.label.toLowerCase()))
                      return (
                        <td key={p.id} className="px-4 py-3 text-center">
                          {has ? <CheckCircle2 size={14} className="mx-auto text-green-400" /> : <X size={14} className="mx-auto text-white/15" />}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
