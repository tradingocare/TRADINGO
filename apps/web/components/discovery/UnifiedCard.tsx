'use client'
import { useState, useRef } from 'react'
import Link              from 'next/link'
import { motion }        from 'framer-motion'
import {
  Star, MapPin, Shield, BadgeCheck,
  Zap, MessageCircle, FileText, Bookmark,
  ArrowLeftRight, Coins, Crown,
  ShoppingCart, Truck,
} from 'lucide-react'
import { DiscoveryResult } from '../../types/discovery'
import { useAuthStore }    from '../../store/auth-store'
import { toast }             from '@/components/ui/use-toast'
import { useRouter }       from 'next/navigation'
import api                 from '../../lib/api/client'
import SellerBadge, { resolveSellerInfo } from '../shared/SellerBadge'

const GEO_COLORS: Record<number, string> = {
  1: '#FF4D00', 2: '#FF7A3D', 3: '#F2C94C',
  4: '#2DE0E0', 5: '#3D8BFF', 6: '#9B5DE5',
}
const GEO_LABELS: Record<number, string> = {
  1: 'My Area',  2: 'My City', 3: 'My District',
  4: 'My State', 5: 'Pan India', 6: 'Global',
}

interface Props {
  item:         DiscoveryResult
  colorIndex?:  number
  onCompare?:   (item: DiscoveryResult) => void
  inCompare?:   boolean
}

export default function UnifiedCard({
  item, onCompare, inCompare,
}: Props) {
  const [imgIdx] = useState(0)
  const [saved, setSaved]   = useState(false)
  const router   = useRouter()
  const { user } = useAuthStore()
  const ref      = useRef<HTMLDivElement>(null)
  const geoColor = GEO_COLORS[item.geoRing] || '#FF4D00'

  const requireAuth = (fn: () => void) => {
    if (!user) { toast({ title: 'Login karein pehle', variant: 'destructive' }); router.push('/login'); return }
    fn()
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const el = ref.current!
    const rect = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${((e.clientX-rect.left)/rect.width)*100}%`)
    el.style.setProperty('--my', `${((e.clientY-rect.top)/rect.height)*100}%`)
  }

  const handleSave = () => requireAuth(async () => {
    try {
      await api.post('/v1/recommendations/track', {
        eventType: saved ? 'unsave' : 'save',
        entityId: item.id, entityType: item.type, source: 'discovery',
      })
      setSaved(s => !s)
      toast({ title: saved ? 'Removed from saved' : 'Saved!' })
    } catch { toast({ title: 'Try again', variant: 'destructive' }) }
  })

  const isService = item.type === 'service'
  const href      = `/${isService ? 'services' : 'products'}/${item.slug}`

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.25 }}
      className="relative rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <div className="absolute inset-0 pointer-events-none z-10 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-2xl"
        style={{
          background: `radial-gradient(200px circle at var(--mx,50%) var(--my,50%), ${geoColor}15, transparent 70%)`,
        }} />

      <div className="relative aspect-[4/3] overflow-hidden flex-shrink-0">
        {item.images?.length ? (
          <img
            src={item.images[imgIdx]}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${geoColor}18, #1D000120)` }}>
            <span className="text-4xl opacity-40">
              {isService ? '\uD83D\uDEE0\uFE0F' : '\uD83D\uDCE6'}
            </span>
          </div>
        )}

        <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap">
          {item.isVerified && (
            <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/35 text-green-400">
              <BadgeCheck size={9} /> Verified
            </span>
          )}
          {item.seller.isTradgoElite && (
            <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(242,201,76,0.15)', border: '1px solid rgba(242,201,76,0.4)', color: '#F2C94C' }}>
              <Crown size={9} /> Elite
            </span>
          )}
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: `${geoColor}18`, border: `1px solid ${geoColor}35`, color: geoColor }}>
            {isService ? 'Service' : 'Product'}
          </span>
        </div>

        <button onClick={handleSave}
          className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all"
          style={{ background: 'rgba(0,0,0,0.45)' }}>
          <Bookmark size={13}
            className={saved ? 'fill-[#FF4D00] text-[#FF4D00]' : 'text-white'} />
        </button>

        {item.geoRing && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full"
            style={{
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(8px)',
              border: `1px solid ${geoColor}30`,
              color: geoColor,
            }}>
            <MapPin size={9} />
            {item.distanceKm ? `${item.distanceKm} km` : GEO_LABELS[item.geoRing]}
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-3.5 gap-2.5">
        <p className="text-white/30 text-[9px] truncate">
          {item.categoryName}{item.subCategory ? ` > ${item.subCategory}` : ''}
        </p>

        <SellerBadge
          seller={resolveSellerInfo(item)}
          size="xs"
          showLocation={true}
          showLogo={false}
          linkToProfile={true}
          className="mb-1.5"
        />

        <Link href={href}>
          <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2 hover:text-[#FF4D00] transition-colors cursor-pointer">
            {item.name}
          </h3>
        </Link>

        <div className="flex items-center gap-2 text-[10px] text-white/45">
          <span suppressHydrationWarning className="flex items-center gap-0.5">
            <Star size={10} className="text-yellow-400 fill-yellow-400" />
            {item.rating?.toFixed(1) ?? '0.0'}
            <span suppressHydrationWarning className="text-white/25">({item.reviewCount ?? 0})</span>
          </span>
          <span className="w-px h-3 bg-white/15" />
          <span className="flex items-center gap-1">
            <Zap size={9} style={{ color: geoColor }} />
            {item.responseTime || '< 24 hrs'}
          </span>
          {item.trustScore >= 80 && (
            <>
              <span className="w-px h-3 bg-white/15" />
              <span className="flex items-center gap-1 text-green-400">
                <Shield size={9} />
                {item.trustScore}
              </span>
            </>
          )}
        </div>

        {isService ? (
          <div>
            <p suppressHydrationWarning className="text-white font-bold text-sm">
              {item.pricingModel === 'hourly' ? 'Custom Pricing'
                : item.price ? `Rs ${item.price?.toLocaleString('en-IN')}` : 'Get Quote'}
            </p>
            {item.coverageArea && (
              <p className="text-white/35 text-[10px] mt-0.5">{item.coverageArea}</p>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-baseline gap-1.5">
              <span suppressHydrationWarning className="text-white font-bold text-base">
                Rs {item.price?.toLocaleString('en-IN')}
              </span>
              <span suppressHydrationWarning className="text-white/30 text-xs">/{item.unit}</span>
            </div>
            {item.moq && (
              <p className="text-white/35 text-[10px] mt-0.5">
                MOQ: {item.moq} {item.unit}
              </p>
            )}
          </div>
        )}

        {!isService && item.priceSlabs && item.priceSlabs.length > 1 && (
          <div className="grid grid-cols-3 gap-1">
            {item.priceSlabs.slice(0, 3).map((s, i, arr) => (
              <div key={i}
                className="text-center rounded-lg py-1"
                style={{
                  background: i===arr.length-1 ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)',
                }}>
                <p className="text-[8px] text-white/30">
                  {s.minQty}{s.maxQty ? `-${s.maxQty}` : '+'}
                </p>
                <p className={`text-[10px] font-bold ${i===arr.length-1 ? 'text-green-400' : 'text-white'}`}>
                  Rs {s.price}
                </p>
              </div>
            ))}
          </div>
        )}

        {!isService && item.deliveryEta && (
          <div className="flex items-center gap-1.5 text-[10px] text-white/45">
            <Truck size={10} />
            {item.deliveryEta}
            {item.inStock && (
              <span className="text-green-400 ml-auto">In Stock</span>
            )}
          </div>
        )}

        {item.gocashEarn && item.gocashEarn > 0 && (
          <div className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full self-start"
            style={{
              background: 'rgba(242,201,76,0.1)',
              border: '1px solid rgba(242,201,76,0.25)',
              color: '#F2C94C',
            }}>
            <Coins size={10} />
            Earn {item.gocashEarn} GOCASH
          </div>
        )}

        <div className="flex-1" />

        <div className="flex gap-2">
          <Link href={href} className="flex-1">
            <motion.span
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-bold cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #FF4D00, #FF7A3D)',
                color: '#fff',
              }}>
              <ShoppingCart size={12} />
              {isService ? 'View Service' : 'Buy Now'}
            </motion.span>
          </Link>

          <button
            onClick={() => requireAuth(() =>
              router.push(`/rfq/create?entityId=${item.id}`))}
            className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.7)',
            }}>
            <FileText size={12} /> RFQ
          </button>

          <button
            onClick={() => requireAuth(() =>
              router.push(`/messages?seller=${item.seller.id}&entity=${item.id}`))}
            className="flex items-center justify-center px-3 py-2 rounded-xl text-xs transition-all"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.7)',
            }}>
            <MessageCircle size={12} />
          </button>

          {onCompare && (
            <button
              onClick={() => onCompare(item)}
              className="flex items-center justify-center px-2.5 py-2 rounded-xl text-xs transition-all"
              style={{
                background: inCompare ? 'rgba(255,77,0,0.12)' : 'rgba(255,255,255,0.04)',
                border: inCompare ? '1px solid rgba(255,77,0,0.35)' : '1px solid rgba(255,255,255,0.08)',
                color: inCompare ? '#FF4D00' : 'rgba(255,255,255,0.5)',
              }}>
              <ArrowLeftRight size={12} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
