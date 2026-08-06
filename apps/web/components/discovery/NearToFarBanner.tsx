'use client'
import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'
import { GeoScope } from '../../types/discovery'
import { GEO_RINGS } from '@/data/master-data'

interface Props {
  activeScope:  GeoScope
  counts?:      Record<string, number>
  onScopeChange: (scope: GeoScope) => void
}

export default function NearToFarBanner({ activeScope, counts, onScopeChange }: Props) {
  return (
    <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar rounded-2xl border border-border px-3 py-2"
      style={{
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.04), transparent 50%), radial-gradient(circle at 0% 50%, rgba(255,77,0,0.06), transparent 30%), var(--bg-elevated)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
      }}>
      <MapPin size={13} className="text-accent flex-shrink-0" />
      {GEO_RINGS.map((ring) => {
        const active = activeScope === ring.scope
        const count  = counts?.[ring.scope]
        return (
          <motion.button
            key={ring.scope}
            onClick={() => onScopeChange(ring.scope as GeoScope)}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-all duration-200"
            style={{
              background: active ? `${ring.color}18` : 'var(--bg-elevated)',
              border:     active ? `1px solid ${ring.color}50` : '1px solid var(--border-color)',
              color:      active ? ring.color : 'var(--text-tertiary)',
            }}>
            {ring.label}
            {count !== undefined && (
              <span className="text-[9px] opacity-60">({count})</span>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
