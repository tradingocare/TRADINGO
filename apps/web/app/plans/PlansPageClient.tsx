'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import api from '../../lib/api/client'
import { useAuthStore } from '../../store/auth-store'
import { CheckCircle2, X, Zap, Crown, Star, Sparkles, ArrowRight, Info, Rocket, Shield } from 'lucide-react'

interface Plan {
  id: string; planId: string; name: string; description: string
  pricePlanA: number; pricePlanB: number; pricePlanC: number
  duration: number; isFree: boolean; badgeText: string | null
  features: string[]; sortOrder: number; visibility: string
}

const PLANS_META: Record<string, { icon: any; badge?: string; color: string }> = {
  'TRAD UP™':   { icon: Rocket, color: '#3D8BFF', badge: 'Launch Offer' },
  'Trade Smart™': { icon: Shield, color: '#FF4D00', badge: 'Best Value' },
}

const FEATURE_COMPARISON = [
  { label: 'Business Profile', tradUp: true, tradeSmart: true },
  { label: 'Basic Verification', tradUp: true, tradeSmart: true },
  { label: 'Product Listing', tradUp: 'Configurable', tradeSmart: true },
  { label: 'Receive RFQs', tradUp: true, tradeSmart: true },
  { label: 'Buyer Chat', tradUp: true, tradeSmart: true },
  { label: 'Basic Search Visibility', tradUp: true, tradeSmart: true },
  { label: 'Basic Dashboard', tradUp: true, tradeSmart: true },
  { label: 'Basic Orders', tradUp: true, tradeSmart: true },
  { label: 'Basic Notifications', tradUp: true, tradeSmart: true },
  { label: 'GOCASH Enabled', tradUp: false, tradeSmart: true },
  { label: 'Premium Badge', tradUp: false, tradeSmart: true },
  { label: 'Priority Search Ranking', tradUp: false, tradeSmart: true },
  { label: 'Advanced Analytics', tradUp: false, tradeSmart: true },
  { label: 'Campaign Participation', tradUp: false, tradeSmart: true },
  { label: 'Referral Rewards', tradUp: false, tradeSmart: true },
  { label: 'Exports', tradUp: false, tradeSmart: true },
  { label: 'Advanced RFQ', tradUp: false, tradeSmart: true },
  { label: 'Premium Dashboard', tradUp: false, tradeSmart: true },
]

const formatPrice = (n: number) => '₹' + n.toLocaleString('en-IN')

export default function PlansPageClient() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/membership/plans/launch')
      .then((r: any) => {
        const d = r.data?.data || r.data || r
        setPlans(Array.isArray(d) ? d : [])
      })
      .catch(() => setError('Failed to load plans'))
      .finally(() => setLoading(false))
  }, [])

  const tradUpPlan = plans.find(p => p.planId === 'trad-up')
  const tradeSmartPlan = plans.find(p => p.planId === 'trade-smart-launch')

  const handleChoose = (planId: string) => {
    if (user) {
      router.push(`/subscription/purchase?planId=${planId}`)
    } else {
      router.push(`/login?next=${encodeURIComponent(`/subscription/purchase?planId=${planId}`)}`)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background:'#0A0A0F' }}>
      <div className="w-12 h-12 rounded-full border-2 border-t-[#FF4D00] border-white/10 animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background:'#0A0A0F' }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background:'radial-gradient(circle,#3D8BFF20,transparent 70%)', filter:'blur(80px)' }} />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full opacity-8"
          style={{ background:'radial-gradient(circle,#FF4D0018,transparent 70%)', filter:'blur(80px)' }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-12">
        {/* Launch Badge */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase"
            style={{
              background: 'linear-gradient(135deg,#FF4D00,#FF7A3D)',
              color: '#fff',
            }}>
            <Sparkles size={14} /> Launch Offer — Limited Time
          </span>
        </div>

        <div className="text-center mb-10">
          <motion.h1 initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
            className="text-white font-black text-3xl sm:text-5xl mb-3">
            Start Your <span style={{ background:'linear-gradient(135deg,#FF4D00,#FF7A3D)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>TRADINGO</span> Journey
          </motion.h1>
          <p className="text-white/40 text-sm max-w-2xl mx-auto">
            Join India&apos;s fastest growing B2B marketplace. Choose from two launch plans designed to help your business grow.
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">{error}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 max-w-3xl mx-auto">
          {/* TRAD UP™ Card */}
          {tradUpPlan && (
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
              className="relative rounded-2xl p-6 transition-all duration-300 flex flex-col border"
              style={{
                background: 'linear-gradient(135deg,rgba(61,139,255,0.06),rgba(61,139,255,0.02))',
                borderColor: 'rgba(61,139,255,0.25)',
              }}>
              <div className="absolute -top-3 left-4 px-3 py-0.5 rounded-full text-[10px] font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#3D8BFF,#6BA8FF)' }}>
                Launch Offer
              </div>
              <Rocket size={28} style={{ color: '#3D8BFF' }} className="mb-3" />
              <h3 className="text-white font-bold text-xl mb-1">TRAD UP™</h3>
              <p className="text-white/40 text-xs mb-4">Launch Membership — Start selling with zero investment</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-white font-black text-4xl">₹0</span>
              </div>
              <p className="text-white/30 text-xs mb-5">Valid for 6 months • No credit card required</p>
              <ul className="space-y-2 mb-6 flex-1">
                {(tradUpPlan.features as string[]).slice(0, 8).map((f, fi) => (
                  <li key={fi} className="flex items-center gap-2 text-white/50 text-xs">
                    <CheckCircle2 size={12} className="text-blue-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                onClick={() => handleChoose('trad-up')}
                className="w-full py-3.5 rounded-xl font-bold text-sm"
                style={{
                  background: 'linear-gradient(135deg,#3D8BFF,#6BA8FF)',
                  color: '#fff',
                }}>
                Get Started Free <ArrowRight size={14} className="inline ml-1" />
              </motion.button>
            </motion.div>
          )}

          {/* Trade Smart™ Card */}
          {tradeSmartPlan && (
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
              className="relative rounded-2xl p-6 transition-all duration-300 flex flex-col border"
              style={{
                background: 'linear-gradient(135deg,rgba(255,77,0,0.08),rgba(255,77,0,0.02))',
                borderColor: 'rgba(255,77,0,0.3)',
                boxShadow: '0 0 40px rgba(255,77,0,0.12)',
              }}>
              <div className="absolute -top-3 left-4 px-3 py-0.5 rounded-full text-[10px] font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#FF4D00,#FF7A3D)' }}>
                Best Value
              </div>
              <Shield size={28} style={{ color: '#FF4D00' }} className="mb-3" />
              <h3 className="text-white font-bold text-xl mb-1">Trade Smart™</h3>
              <p className="text-white/40 text-xs mb-4">Everything in TRAD UP™ plus premium features</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-white font-black text-4xl">{formatPrice(tradeSmartPlan.pricePlanA)}</span>
                <span className="text-white/30 text-xs">/year</span>
              </div>
              <p className="text-white/30 text-xs mb-5">GOCASH enabled • Premium badge • Priority ranking</p>
              <ul className="space-y-2 mb-6 flex-1">
                {(tradeSmartPlan.features as string[]).slice(0, 8).map((f, fi) => (
                  <li key={fi} className="flex items-center gap-2 text-white/50 text-xs">
                    <CheckCircle2 size={12} className="text-orange-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                onClick={() => handleChoose('trade-smart-launch')}
                className="w-full py-3.5 rounded-xl font-bold text-sm"
                style={{
                  background: 'linear-gradient(135deg,#FF4D00,#FF7A3D)',
                  color: '#fff',
                }}>
                Choose Trade Smart <ArrowRight size={14} className="inline ml-1" />
              </motion.button>
            </motion.div>
          )}
        </div>

        {/* Feature Comparison Table */}
        {tradUpPlan && tradeSmartPlan && (
          <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/[0.02] max-w-4xl mx-auto">
            <div className="p-6 border-b border-white/10 flex items-center gap-2">
              <Info size={16} className="text-white/30" />
              <h2 className="text-white font-bold text-lg">Feature Comparison</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-6 py-4 text-white/50 text-xs font-semibold w-1/2">Feature</th>
                    <th className="px-4 py-4 text-blue-400 text-xs font-bold text-center">TRAD UP™</th>
                    <th className="px-4 py-4 text-orange-400 text-xs font-bold text-center">Trade Smart™</th>
                  </tr>
                </thead>
                <tbody>
                  {FEATURE_COMPARISON.map((f, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="px-6 py-3 text-white/60 text-xs">{f.label}</td>
                      <td className="px-4 py-3 text-center">
                        {f.tradUp === true ? <CheckCircle2 size={14} className="mx-auto text-blue-400" />
                          : f.tradUp === false ? <X size={14} className="mx-auto text-white/15" />
                          : <span className="text-white/30 text-[10px]">{f.tradUp}</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {f.tradeSmart === true ? <CheckCircle2 size={14} className="mx-auto text-green-400" />
                          : <X size={14} className="mx-auto text-white/15" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Coming Soon Banner */}
        <div className="text-center mt-10 p-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.01] max-w-4xl mx-auto">
          <p className="text-white/30 text-sm">
            More plans coming soon — <span className="text-white/50 font-semibold">Trade Plus</span>,{' '}
            <span className="text-white/50 font-semibold">Trade Pro</span>,{' '}
            <span className="text-white/50 font-semibold">Trade Premium</span> &amp;{' '}
            <span className="text-white/50 font-semibold">Trade Elite</span>
          </p>
          <p className="text-white/20 text-xs mt-1">Future plans will be enabled by Super Admin when ready</p>
        </div>

        <div className="text-center mt-6">
          <p className="text-white/20 text-xs">
            All plans include GST invoice. Prices are in INR. TRAD UP™ auto-expires after 6 months.
          </p>
        </div>
      </div>
    </div>
  )
}
