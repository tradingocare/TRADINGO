'use client'
import { useState, useRef } from 'react'
import Link           from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BadgeCheck, Crown, Heart, MapPin,
  Package, ChevronDown, ChevronUp, Truck,
  Coins, ShoppingCart, FileText, MessageCircle,
  ArrowLeftRight, Shield, Info,
  Plus, Minus, TrendingDown,
} from 'lucide-react'
import { useRouter }    from 'next/navigation'
import { useAuthStore } from '../../store/auth-store'
import toast            from 'react-hot-toast'
import api              from '../../lib/api/client'
import SellerBadge, { resolveSellerInfo } from '../shared/SellerBadge'

interface PriceSlab {
  minQty:  number
  maxQty:  number | null
  price:   number
}

interface ProductCardData {
  id:            string
  slug:          string
  name:          string
  images:        string[]
  categoryName:  string
  subCategory?:  string
  isVerified:    boolean
  trustScore:    number
  rating:        number
  reviewCount:   number
  responseTime:  string
  distanceKm?:   number
  city:          string
  state:         string
  inStock:       boolean
  stockQty?:     number
  price:         number
  originalPrice?: number
  unit:          string
  moq:           number
  maxOrderQty?:  number
  deliveryEta?:  string
  gocashRate?:   number
  priceSlabs:    PriceSlab[]
  geoRing?:      number
  seller: {
    id:             string
    name:           string
    slug:           string
    logo?:          string
    isVerified:     boolean
    isTradgoElite?: boolean
    trustScore:     number
    yearsActive?:   number
    city:           string
    state:          string
  }
}

interface Props {
  product:    ProductCardData
  onCompare?: (p: ProductCardData) => void
  inCompare?: boolean
}

const GLASS_PILL = 'backdrop-filter:blur(16px); background:rgba(0,0,0,0.55); border:1px solid rgba(255,255,255,0.12); border-radius:999px; box-shadow:0 2px 8px rgba(0,0,0,0.25);'

function getActiveSlab(slabs: PriceSlab[], qty: number): PriceSlab {
  const sorted = [...slabs].sort((a, b) => b.minQty - a.minQty)
  return sorted.find(s => qty >= s.minQty) ?? slabs[0]
}

function calcGocash(total: number, rate = 100): number {
  return Math.floor(total / 1000) * rate
}

function getGeoLabel(dist?: number, ring?: number): { label: string; short: string; color: string } {
  if (ring === 1) return { label: '📍 Same City', short: 'Same City', color: '#4ade80' }
  if (ring === 2) return { label: '📍 Same District', short: 'Same District', color: '#2DE0E0' }
  if (ring === 3) return { label: '📍 Same State', short: 'Same State', color: '#3D8BFF' }
  if (dist !== undefined && dist <= 50) return { label: `📍 Near You • ${dist} km`, short: `${dist} km`, color: '#4ade80' }
  if (dist !== undefined && dist <= 200) return { label: `📍 Nearby Supplier • ${dist} km`, short: `${dist} km`, color: '#FF7A3D' }
  if (dist !== undefined && dist <= 500) return { label: `📍 ${dist} km Away`, short: `${dist} km`, color: '#F2C94C' }
  if (ring === 5 || (dist !== undefined && dist > 500)) return { label: '📍 Pan India Supplier', short: 'Pan India', color: '#9B5DE5' }
  if (ring === 6) return { label: '🌍 Global Supplier', short: 'Global', color: '#F43F5E' }
  if (dist !== undefined) return { label: `📍 Near to Far™ • ${dist} km`, short: `${dist} km`, color: '#FF4D00' }
  return { label: '📍 Near to Far™', short: 'N2F', color: '#FF4D00' }
}

function getStockBadge(inStock: boolean, qty?: number): { label: string; emoji: string; color: string } {
  if (!inStock) return { label: '🔴 Out of Stock', emoji: '🔴', color: '#f87171' }
  if (qty !== undefined && qty <= 5) return { label: '🟡 Limited Stock', emoji: '🟡', color: '#F2C94C' }
  if (qty !== undefined && qty <= 20) return { label: '🟢 Low Stock', emoji: '🟢', color: '#4ade80' }
  return { label: '🟢 In Stock', emoji: '🟢', color: '#4ade80' }
}

export default function ProductCard({ product, onCompare, inCompare }: Props) {
  const { user }  = useAuthStore()
  const router    = useRouter()
  const ref       = useRef<HTMLDivElement>(null)
  const imgRef    = useRef<HTMLDivElement>(null)

  const [imgIdx, setImgIdx]       = useState(0)
  const [saved, setSaved]         = useState(false)
  const [qty, setQty]             = useState(product.moq)
  const [slabOpen, setSlabOpen]   = useState(false)
  const [savingWish, setSavingWish] = useState(false)
  const [gocashTip, setGocashTip] = useState(false)

  const activeSlab   = getActiveSlab(product.priceSlabs, qty)
  const unitPrice    = activeSlab.price
  const totalPrice   = unitPrice * qty
  const baseTotalAtMoq = product.priceSlabs[0].price * qty
  const savings      = baseTotalAtMoq - totalPrice
  const bulkPct      = savings > 0 ? Math.round((savings / baseTotalAtMoq) * 100) : 0
  const gocash       = calcGocash(totalPrice, product.gocashRate ?? 100)
  const discountPct  = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0

  const geoInfo      = getGeoLabel(product.distanceKm, product.geoRing)
  const stockBadge   = getStockBadge(product.inStock, product.stockQty)

  const quickQtys    = product.priceSlabs.map(s => s.minQty).filter((v, i, a) => a.indexOf(v) === i).slice(0, 6)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    ref.current.style.setProperty('--mx', `${((e.clientX-rect.left)/rect.width)*100}%`)
    ref.current.style.setProperty('--my', `${((e.clientY-rect.top)/rect.height)*100}%`)
  }

  const requireAuth = (fn: () => void) => {
    if (!user) { toast.error('Login karein pehle'); router.push('/login'); return }
    fn()
  }

  const handleSave = async () => {
    if (savingWish) return
    requireAuth(async () => {
      setSavingWish(true)
      try {
        await api.post('/recommendations/track', { eventType: saved ? 'unsave' : 'save', entityId: product.id, entityType: 'product' })
        setSaved(s => !s)
        toast.success(saved ? 'Removed from wishlist' : 'Added to wishlist!')
      } catch { toast.error('Try again') }
      finally { setSavingWish(false) }
    })
  }

  const handleBuyNow = () => requireAuth(() => router.push(`/checkout?productId=${product.id}&qty=${qty}`))
  const handleRFQ   = () => requireAuth(() => router.push(`/rfq/create?productId=${product.id}&qty=${qty}`))
  const handleChat  = () => requireAuth(() => router.push(`/messages?seller=${product.seller.id}&product=${product.id}`))

  const handleQtyChange = (delta: number) => {
    setQty(prev => {
      const next = Math.max(product.moq, prev + delta)
      if (product.maxOrderQty) return Math.min(product.maxOrderQty, next)
      return next
    })
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="group relative rounded-3xl overflow-hidden transition-shadow duration-500 hover:shadow-[0_12px_48px_rgba(255,77,0,0.12)]"
      style={{
        background:    'rgba(255,255,255,0.04)',
        backdropFilter:'blur(24px)',
        border:        '1px solid rgba(255,255,255,0.09)',
        boxShadow:     '0 8px 40px rgba(0,0,0,0.35)',
      }}
    >
      {/* Glass shine overlay */}
      <div className="absolute inset-0 pointer-events-none z-20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(320px circle at var(--mx,50%) var(--my,50%), rgba(255,77,0,0.12), transparent 65%)`,
        }} />

      {/* ── IMAGE ── */}
      <div ref={imgRef} className="relative aspect-[16/9] overflow-hidden flex-shrink-0 bg-black">
        {product.images?.length ? (
          <img src={product.images[imgIdx]} alt={product.name}
            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl opacity-20">📦</div>
        )}

        {/* Thumb dots */}
        {product.images?.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 z-10">
            {product.images.slice(0, 5).map((_, i) => (
              <button key={i} onClick={(e) => { e.stopPropagation(); setImgIdx(i) }}
                className="transition-all"
                style={{
                  width: imgIdx === i ? 16 : 6, height: 6, borderRadius: 999,
                  background: imgIdx === i ? '#FF4D00' : 'rgba(255,255,255,0.4)',
                }} />
            ))}
          </div>
        )}

        {/* Top badges — dark glass pills */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10 max-w-[70%]">
          {product.isVerified && (
            <span className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-white"
              style={{ background:'rgba(0,0,0,0.5)', backdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:999, boxShadow:'0 2px 8px rgba(0,0,0,0.25)' }}>
              <BadgeCheck size={10} className="text-green-400" /> Verified
            </span>
          )}
          {product.seller.isTradgoElite && (
            <span className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold"
              style={{ background:'rgba(0,0,0,0.5)', backdropFilter:'blur(16px)', border:'1px solid rgba(242,201,76,0.25)', borderRadius:999, boxShadow:'0 2px 8px rgba(0,0,0,0.25)', color:'#F2C94C' }}>
              <Crown size={10} /> Elite
            </span>
          )}
          {discountPct > 0 && (
            <span className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold"
              style={{ background:'rgba(0,0,0,0.5)', backdropFilter:'blur(16px)', border:'1px solid rgba(248,113,113,0.3)', borderRadius:999, boxShadow:'0 2px 8px rgba(0,0,0,0.25)', color:'#f87171' }}>
              {discountPct}% OFF
            </span>
          )}
        </div>

        {/* Save + compare top-right */}
        <div className="absolute top-3 right-3 flex gap-1.5 z-10">
          <motion.button whileTap={{ scale: 0.85 }} onClick={handleSave}
            className="flex items-center justify-center w-8 h-8 rounded-full transition-all"
            style={{ background:'rgba(0,0,0,0.5)', backdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,0.12)' }}>
            <Heart size={14} className={saved ? 'fill-red-500 text-red-500' : 'text-white'} />
          </motion.button>
          {onCompare && (
            <motion.button whileTap={{ scale: 0.85 }}
              onClick={(e) => { e.stopPropagation(); onCompare(product) }}
              className="flex items-center justify-center w-8 h-8 rounded-full transition-all"
              style={{
                background: inCompare ? 'rgba(255,77,0,0.3)' : 'rgba(0,0,0,0.5)',
                backdropFilter:'blur(16px)',
                border: inCompare ? '1px solid rgba(255,77,0,0.5)' : '1px solid rgba(255,255,255,0.12)',
                color: inCompare ? '#FF4D00' : 'rgba(255,255,255,0.7)',
              }}>
              <ArrowLeftRight size={13} />
            </motion.button>
          )}
        </div>

        {/* Bottom-left — Near to Far™ geo badge */}
        <div className="absolute bottom-3 left-3 z-10"
          title="Showing suppliers from your nearest location to the farthest available markets.">
          <span className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold"
            style={{ background:'rgba(0,0,0,0.55)', backdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:999, boxShadow:'0 2px 8px rgba(0,0,0,0.25)', color: geoInfo.color }}>
            {geoInfo.label}
          </span>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="p-4 flex flex-col gap-3">

        {/* Seller info + trust row */}
        <SellerBadge
          seller={resolveSellerInfo(product)}
          size="md"
          showLocation={true}
          showStats={true}
          showLogo={true}
          linkToProfile={true}
        />

        {/* Category + product name */}
        <div>
          <p className="text-white/30 text-[9px] mb-0.5 tracking-wider uppercase">
            {product.categoryName}{product.subCategory ? ` › ${product.subCategory}` : ''}
          </p>
          <Link href={`/products/${product.slug}`}>
            <h3 className="text-white font-bold text-sm sm:text-base leading-snug hover:text-[#FF4D00] transition-colors line-clamp-2">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Trust signals strip */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-white/45">
          <span className="flex items-center gap-1">
            <Shield size={10} className="text-green-400" />
            Trust Score {product.trustScore}/100
          </span>
          <span className="flex items-center gap-1">
            <Truck size={10} style={{ color:'#FF4D00' }} />
            {product.deliveryEta ? `PAN India Delivery` : 'Delivery Available'}
          </span>
          <span className="flex items-center gap-1">
            {stockBadge.emoji} {stockBadge.label}
          </span>
        </div>

        {/* ── PRICE AREA ── */}
        <div className="rounded-2xl p-3" style={{ border:'1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-black text-white" style={{ fontSize:'clamp(20px,3.5vw,28px)' }}>
              ₹{unitPrice.toLocaleString('en-IN')}
            </span>
            <span className="text-white/35 text-xs">/ {product.unit}</span>
            {product.originalPrice && product.originalPrice > unitPrice && (
              <span className="text-white/25 text-xs line-through">₹{product.originalPrice.toLocaleString('en-IN')}</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-[10px] text-white/35">GST Extra</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span className="text-[10px] text-[#FF4D00]/70 font-semibold">Negotiable</span>
            {product.priceSlabs.length > 1 && (
              <>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span className="text-[10px] text-green-400/70 font-semibold">Bulk Price Available</span>
              </>
            )}
          </div>
        </div>

        {/* ── QUANTITY + SLABS ── */}
        <div className="rounded-2xl overflow-hidden" style={{ border:'1px solid rgba(255,255,255,0.08)' }}>
          {/* Slab toggle header */}
          <button onClick={() => setSlabOpen(o => !o)}
            className="flex items-center justify-between w-full px-3 py-2.5 text-left transition-all"
            style={{ background:'rgba(255,255,255,0.04)' }}>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-white/70">
              <Package size={13} style={{ color:'#FF4D00' }} />
              Quantity Pricing
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#FF4D00] font-bold">{product.priceSlabs.length} slabs</span>
              {slabOpen ? <ChevronUp size={13} className="text-white/40" /> : <ChevronDown size={13} className="text-white/40" />}
            </div>
          </button>

          {/* Quick chips */}
          <div className="px-3 pb-2 flex gap-1.5 flex-wrap">
            {quickQtys.map(q => (
              <button key={q} onClick={() => setQty(q)}
                className="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all"
                style={{
                  background: qty === q ? 'rgba(255,77,0,0.2)' : 'rgba(255,255,255,0.06)',
                  border: qty === q ? '1px solid rgba(255,77,0,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  color: qty === q ? '#FF4D00' : 'rgba(255,255,255,0.6)',
                }}>
                {q.toLocaleString()}
              </button>
            ))}
          </div>

          {/* Slab table */}
          <AnimatePresence>
            {slabOpen && (
              <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }} transition={{ duration:0.25 }} className="overflow-hidden">
                <div className="px-3 pb-3">
                  <table className="w-full">
                    <thead>
                      <tr className="text-[9px] text-white/30 uppercase tracking-wider">
                        <th className="text-left py-1.5 font-semibold">Quantity</th>
                        <th className="text-right py-1.5 font-semibold">Unit Price</th>
                        <th className="text-right py-1.5 font-semibold">Saving</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.priceSlabs.map((s, i) => {
                        const isActive = qty >= s.minQty && (s.maxQty === null || qty <= s.maxQty)
                        const saving = i > 0 ? product.priceSlabs[0].price - s.price : 0
                        return (
                          <tr key={i} className="text-xs transition-all cursor-pointer" onClick={() => setQty(s.minQty)}
                            style={{ background:isActive ? 'rgba(255,77,0,0.08)' : 'transparent', borderRadius:8 }}>
                            <td className="py-2 pl-2 rounded-l-lg"
                              style={{ color:isActive ? '#FF7A3D' : 'rgba(255,255,255,0.6)' }}>
                              {s.minQty.toLocaleString()}{s.maxQty ? `–${s.maxQty.toLocaleString()}` : '+'} {product.unit}
                            </td>
                            <td className="py-2 text-right font-bold"
                              style={{ color:isActive ? '#fff' : 'rgba(255,255,255,0.7)' }}>
                              ₹{s.price.toLocaleString('en-IN')}
                            </td>
                            <td className="py-2 pr-2 text-right rounded-r-lg">
                              {saving > 0
                                ? <span className="text-green-400 text-[10px] font-semibold flex items-center justify-end gap-0.5"><TrendingDown size={9} />₹{saving.toLocaleString('en-IN')}</span>
                                : <span className="text-white/20 text-[10px]">—</span>}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  <p className="text-[9px] text-white/25 mt-2">* Tap a row to auto-set quantity</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Qty stepper + total */}
          <div className="p-3" style={{ borderTop:'1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-3 mb-2.5">
              <div className="flex items-center rounded-xl overflow-hidden" style={{ border:'1px solid rgba(255,255,255,0.12)' }}>
                <button onClick={() => handleQtyChange(-product.moq)}
                  className="w-9 h-9 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all" disabled={qty <= product.moq}>
                  <Minus size={14} />
                </button>
                <input type="number" value={qty}
                  onChange={e => { const v = parseInt(e.target.value) || product.moq; setQty(Math.max(product.moq, v)) }}
                  className="w-20 text-center text-sm font-bold text-white bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                <button onClick={() => handleQtyChange(product.moq)}
                  className="w-9 h-9 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all">
                  <Plus size={14} />
                </button>
              </div>
              <div className="flex-1 text-right">
                <p className="text-[9px] text-white/30">MOQ: {product.moq.toLocaleString()} {product.unit}</p>
                <p className="text-[10px] text-white/40">Slab: {activeSlab.minQty.toLocaleString()}{activeSlab.maxQty ? `–${activeSlab.maxQty.toLocaleString()}` : '+'} {product.unit}</p>
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/50">Total Order Value</span>
                <span className="text-sm font-black text-white">₹{totalPrice.toLocaleString('en-IN')}</span>
              </div>
              {savings > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-green-400 flex items-center gap-1"><TrendingDown size={12} /> You Save</span>
                  <span className="text-[11px] text-green-400 font-bold">₹{savings.toLocaleString('en-IN')} <span className="text-white/30 text-[10px]">({bulkPct}% off)</span></span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── DELIVERY + STOCK ── */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs"
            style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
            <span className="flex-shrink-0">{stockBadge.emoji}</span>
            <span className="text-white/60">{stockBadge.label.replace(/^[🔴🟡🟢]/, '').trim()}{product.stockQty ? ` (${product.stockQty})` : ''}</span>
          </div>
          {product.deliveryEta && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs"
              style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
              <Truck size={12} style={{ color:'#FF4D00' }} className="flex-shrink-0" />
              <span className="text-white/60">Delivery: {product.deliveryEta}</span>
            </div>
          )}
        </div>

        {/* ── GOCASH ── */}
        {gocash > 0 && (
          <div className="relative flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background:'rgba(242,201,76,0.08)', border:'1px solid rgba(242,201,76,0.2)' }}
            onMouseEnter={() => setGocashTip(true)} onMouseLeave={() => setGocashTip(false)}>
            <Coins size={15} style={{ color:'#F2C94C' }} />
            <span className="text-xs font-bold" style={{ color:'#F2C94C' }}>Earn {gocash.toLocaleString()} GOCASH</span>
            <button className="ml-auto text-white/30 hover:text-white/60 transition-colors"
              onClick={() => setGocashTip(o => !o)}>
              <Info size={12} />
            </button>
            <AnimatePresence>
              {gocashTip && (
                <motion.div initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:4 }} transition={{ duration:0.15 }}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-xl text-[10px] text-white/80 whitespace-nowrap z-30"
                  style={{ background:'rgba(0,0,0,0.85)', backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.1)' }}>
                  Redeem for TRADINGO benefits.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── CTA BAR ── */}
        <div className="flex gap-1.5">
          <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.96 }}
            onClick={handleBuyNow} disabled={!product.inStock}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
            style={{ background:'linear-gradient(135deg, #FF4D00, #FF7A3D)', color:'#fff', boxShadow:'0 4px 16px rgba(255,77,0,0.3)' }}>
            <ShoppingCart size={14} /> Buy Now
          </motion.button>
          <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.96 }}
            onClick={handleRFQ}
            className="flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl text-[11px] font-bold transition-all"
            style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', color:'rgba(255,255,255,0.8)' }}>
            <FileText size={13} /> RFQ
          </motion.button>
          <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.96 }}
            onClick={handleChat}
            className="flex items-center justify-center px-3 py-2.5 rounded-xl transition-all"
            style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.65)' }}>
            <MessageCircle size={14} />
          </motion.button>
        </div>

      </div>
    </motion.div>
  )
}
