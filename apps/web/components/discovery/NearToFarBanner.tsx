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
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
      <MapPin size={14} style={{ color: '#FF4D00' }} className="flex-shrink-0" />
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
              background: active ? `${ring.color}18` : 'rgba(255,255,255,0.04)',
              border:     active ? `1px solid ${ring.color}50` : '1px solid rgba(255,255,255,0.08)',
              color:      active ? ring.color : 'rgba(255,255,255,0.5)',
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
