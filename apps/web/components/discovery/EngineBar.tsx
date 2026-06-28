'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Zap, FileText, MessageCircle,
  Shield, Lock,
} from 'lucide-react'
import { TradingoLogoIcon } from '../shared/tradingo-logo'

const ENGINES = [
  {
    id: 'TRADFIND',    icon: Search,         color: '#3D8BFF',
    title: 'TRADFIND',  subtitle: 'Smart Discovery',
    desc: 'AI-powered search across 33,600+ products and services. Hindi, English, Hinglish supported.',
  },
  {
    id: 'TRADMATCH',   icon: Zap,            color: '#9B5DE5',
    title: 'TRADMATCH', subtitle: 'AI Matchmaking',
    desc: 'Your RFQ is auto-routed to the top 20 verified vendors using scoring: category, location, trust, response rate.',
  },
  {
    id: 'TRADRFQ',     icon: FileText,       color: '#F15BB5',
    title: 'TRADRFQ',   subtitle: 'RFQ & Negotiation',
    desc: 'Post bulk requirements, receive multi-vendor quotes, compare, negotiate, and convert to order.',
  },
  {
    id: 'TRADCONNECT', icon: MessageCircle,  color: '#2DE0E0',
    title: 'TRADCONNECT', subtitle: 'Secure Chat',
    desc: 'WhatsApp-style B2B chat. Phone numbers are never shared. Direct connect between buyers and sellers.',
  },
  {
    id: 'TRADTRUST',   icon: Shield,         color: '#F2C94C',
    title: 'TRADTRUST', subtitle: 'Verification',
    desc: '5-layer KYC: PAN, GST, Aadhaar, Business Registration, Bank. Trust score shown on every seller.',
  },
  {
    id: 'TRADZERO',    icon: Lock,           color: '#FF7A3D',
    title: 'TRADZERO',  subtitle: 'Zero-Risk Payments',
    desc: 'Escrow holds your payment. Released to seller only after you confirm delivery. Dispute resolution included.',
  },
]

export default function EngineBar() {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="rounded-2xl p-3"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(16px)',
      }}>
      <div className="flex items-center justify-end mb-3 px-1">
        {expanded && (
          <button onClick={() => setExpanded(null)}
            className="text-[10px] text-white/35 hover:text-white/60">
            Close X
          </button>
        )}
      </div>

      <div className="relative">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {ENGINES.map(e => {
            const Icon  = e.icon
            const open  = expanded === e.id
            return (
              <button
                key={e.id}
                onClick={() => setExpanded(open ? null : e.id)}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all duration-200 text-center"
                style={{
                  background: open ? `${e.color}15` : 'transparent',
                  border:     open ? `1px solid ${e.color}40` : '1px solid transparent',
                }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: `${e.color}15` }}>
                  <Icon size={15} style={{ color: e.color }} />
                </div>
                <span className="text-[9px] font-bold text-white/70">{e.title}</span>
                <span className="text-[8px] text-white/35 leading-tight">{e.subtitle}</span>
              </button>
            )
          })}
        </div>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <div className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(31,3,24,0.9)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(12px)',
            }}>
            <TradingoLogoIcon height={40} />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (() => {
          const e = ENGINES.find(x => x.id === expanded)!
          return (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="mt-3 px-3 py-3 rounded-xl"
                style={{
                  background: `${e.color}0D`,
                  border: `1px solid ${e.color}25`,
                }}>
                <p className="text-white/70 text-xs leading-relaxed">{e.desc}</p>
              </div>
            </motion.div>
          )
        })()}
      </AnimatePresence>
    </div>
  )
}
