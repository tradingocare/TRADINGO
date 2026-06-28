'use client'
import Link         from 'next/link'
import { motion }   from 'framer-motion'
import { useRef }   from 'react'
import {
  BadgeCheck, Crown, MapPin, Star,
  Package, Zap, Shield, Building2, ArrowRight,
} from 'lucide-react'

interface CompanyCardData {
  id:             string
  name:           string
  slug:           string
  logo?:          string
  bannerUrl?:     string
  banner?:        string
  description?:   string
  tagline?:       string
  city:           string
  state:          string
  categories:     string[]
  sellerType?:    string
  isVerified:     boolean
  isTradgoElite?: boolean
  trustScore:     number
  rating:         number
  reviewCount:    number
  orderCount?:    number
  responseTime?:  string
  productCount?:  number
  isGstVerified?: boolean
  yearsActive?:   number
  [key: string]: any
}

const GLOW_COLORS = [
  '#FF4D00','#9B5DE5','#3D8BFF',
  '#2DE0E0','#F2C94C','#F15BB5',
]

export default function CompanyCard({
  company, index = 0,
}: { company: CompanyCardData; index?: number }) {
  const ref   = useRef<HTMLDivElement>(null)
  const glow  = GLOW_COLORS[index % GLOW_COLORS.length]

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    ref.current.style.setProperty('--mx', `${((e.clientX-rect.left)/rect.width)*100}%`)
    ref.current.style.setProperty('--my', `${((e.clientY-rect.top)/rect.height)*100}%`)
  }

  return (
    <Link href={`/companies/${company.slug}`}>
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        whileHover={{ y: -4, scale: 1.01 }}
        transition={{ duration: 0.25 }}
        className="relative rounded-2xl overflow-hidden cursor-pointer group h-full"
        style={{
          background:    'rgba(255,255,255,0.04)',
          backdropFilter:'blur(20px)',
          border:        '1px solid rgba(255,255,255,0.08)',
          boxShadow:     '0 4px 24px rgba(0,0,0,0.3)',
        }}
      >
        <div className="absolute inset-0 pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-400 rounded-2xl"
          style={{
            background: `radial-gradient(200px circle at var(--mx,50%) var(--my,50%), ${glow}12, transparent 65%)`,
          }} />

        <div className="absolute inset-0 rounded-2xl pointer-events-none z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ boxShadow: `inset 0 0 0 1px ${glow}30` }} />

        <div className="relative h-24 overflow-hidden"
          style={{
            background: (company.bannerUrl || company.banner)
              ? `url(${company.bannerUrl || company.banner}) center/cover`
              : `linear-gradient(135deg, ${glow}18, rgba(31,3,24,0.8))`,
          }}>
          <div className="absolute inset-0"
            style={{ background:'linear-gradient(to bottom, transparent 40%, rgba(15,5,20,0.95))' }} />

          <div className="absolute top-2.5 right-2.5 flex gap-1.5">
            {company.isTradgoElite && (
              <span className="flex items-center gap-0.5 text-[9px] font-bold px-2 py-0.5 rounded-full"
                style={{ background:'rgba(242,201,76,0.2)', border:'1px solid rgba(242,201,76,0.4)', color:'#F2C94C' }}>
                <Crown size={9} /> Elite
              </span>
            )}
            {company.isVerified && (
              <span className="flex items-center gap-0.5 text-[9px] font-bold px-2 py-0.5 rounded-full"
                style={{ background:'rgba(34,197,94,0.2)', border:'1px solid rgba(34,197,94,0.4)', color:'#4ade80' }}>
                <BadgeCheck size={9} /> Verified
              </span>
            )}
          </div>
        </div>

        <div className="px-4 -mt-8 pb-4 relative z-20">
          <div className="flex items-end gap-3 mb-3">
            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center font-black text-lg"
              style={{
                background: company.logo ? 'transparent' : `${glow}18`,
                border: `2px solid rgba(15,5,20,1)`,
                boxShadow: `0 4px 16px rgba(0,0,0,0.5), 0 0 0 1px ${glow}25`,
                color: glow,
              }}>
              {company.logo
                ? <img src={company.logo} alt={company.name}
                    className="w-full h-full object-cover" />
                : company.name?.[0]?.toUpperCase()
              }
            </div>

            <div className="flex-1 min-w-0 pb-0.5">
              <h3 className="text-white font-bold text-sm leading-tight group-hover:text-[#FF4D00] transition-colors truncate">
                {company.name}
              </h3>
              {company.city && (
                <p className="text-white/40 text-[10px] flex items-center gap-1 mt-0.5">
                  <MapPin size={9} style={{ color:'#FF4D00' }} />
                  {company.city}{company.state ? `, ${company.state}` : ''}
                </p>
              )}
            </div>

            <ArrowRight size={15} className="text-white/20 group-hover:text-[#FF4D00] flex-shrink-0 mb-1 transition-all group-hover:translate-x-1 duration-200" />
          </div>

          {(company.tagline || company.description) && (
            <p className="text-white/45 text-[10px] leading-relaxed line-clamp-2 mb-3">
              {company.tagline || company.description}
            </p>
          )}

          {company.categories?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {company.categories.slice(0, 3).map((cat: string) => (
                <span key={cat}
                  className="text-[9px] px-2 py-0.5 rounded-full"
                  style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.5)' }}>
                  {cat}
                </span>
              ))}
              {company.categories.length > 3 && (
                <span className="text-[9px] text-white/25">+{company.categories.length - 3} more</span>
              )}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 pt-3"
            style={{ borderTop:'1px solid rgba(255,255,255,0.07)' }}>
            <div className="text-center">
              <div className="flex items-center justify-center gap-0.5 mb-0.5">
                <Star size={10} className="fill-yellow-400 text-yellow-400" />
                <span className="text-white font-bold text-xs">{company.rating?.toFixed(1) ?? '0.0'}</span>
              </div>
              <p className="text-white/30 text-[8px]">{company.reviewCount ?? 0} reviews</p>
            </div>
            <div className="text-center"
              style={{ borderLeft:'1px solid rgba(255,255,255,0.07)', borderRight:'1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center justify-center gap-0.5 mb-0.5">
                <Shield size={10} style={{ color: (company.trustScore ?? 0) >= 80 ? '#4ade80' : (company.trustScore ?? 0) >= 60 ? '#F2C94C' : '#f87171' }} />
                <span className="text-white font-bold text-xs">{company.trustScore ?? 0}</span>
              </div>
              <p className="text-white/30 text-[8px]">Trust Score</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-0.5 mb-0.5">
                <Package size={10} style={{ color:'#FF4D00' }} />
                <span className="text-white font-bold text-xs">
                  {company.productCount
                    ? company.productCount >= 1000
                      ? `${(company.productCount/1000).toFixed(1)}K`
                      : company.productCount
                    : '—'}
                </span>
              </div>
              <p className="text-white/30 text-[8px]">Products</p>
            </div>
          </div>

          <div className="mt-2.5 h-1 rounded-full overflow-hidden"
            style={{ background:'rgba(255,255,255,0.07)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width:`${Math.min(company.trustScore ?? 0, 100)}%` }}
              transition={{ duration:0.8, delay:0.2 }}
              className="h-full rounded-full"
              style={{
                background: (company.trustScore ?? 0) >= 80
                  ? 'linear-gradient(90deg,#4ade80,#22c55e)'
                  : (company.trustScore ?? 0) >= 60
                    ? 'linear-gradient(90deg,#F2C94C,#f59e0b)'
                    : 'linear-gradient(90deg,#f87171,#ef4444)',
              }} />
          </div>

          {company.responseTime && (
            <p className="text-white/30 text-[9px] flex items-center gap-1 mt-2">
              <Zap size={9} style={{ color:'#FF4D00' }} />
              Responds in {company.responseTime}
            </p>
          )}
        </div>
      </motion.div>
    </Link>
  )
}
