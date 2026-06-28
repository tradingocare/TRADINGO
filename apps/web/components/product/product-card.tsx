'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Star, MapPin, TrendingUp, Building2, Crown, BadgeCheck,
  CheckCircle2, Zap, ShoppingCart, MessageCircle, FileQuestion,
  ArrowLeftRight, Bookmark, Info, Package, Truck, Coins,
  ChevronLeft, ChevronRight, Clock,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { useCompareStore } from '@/store/compare-store'
import { useWishlistStore } from '@/store/wishlist-store'
import { resolveSellerInfo } from '@/components/shared/SellerBadge'
import { toast } from '@/components/ui/use-toast'

export interface ProductCardData {
  _id: string
  id?: string
  slug: string
  title: string
  images: string[]
  videoUrl?: string
  categoryName: string
  subCategory: string
  sku?: string
  price: number
  originalPrice?: number
  unit: string
  rating: number
  reviewCount: number
  viewCount?: number
  savedCount?: number
  monthlyOrders?: number
  isBestseller?: boolean
  priceSlabs?: { minQty: number; maxQty: number | null; price: number }[]
  seller: {
    id?: string
    _id: string
    slug?: string
    businessName: string
    isVerified: boolean
    isTradgoElite?: boolean
    trustScore: number
    avgResponseTime?: string
    yearsActive?: number
    ordersFulfilled?: number
    city: string
    distanceKm?: number
    isGstRegistered?: boolean
  }
  moq: number
  maxOrderQty?: number
  deliveryEta?: string
  freeDeliveryAbove?: number
  stockQty?: number
  inStock: boolean
  specifications?: { key: string; label: string; value: string }[]
  gstInvoiceAvailable?: boolean
  tradeCreditEligible?: boolean
  returnPolicy?: string
}

function gocashEarn(price: number) {
  return Math.floor(price / 1000) * 100
}

function getQtyOptions(
  moq: number,
  slabs?: { minQty: number }[],
  maxOrderQty?: number,
): number[] {
  if (slabs && slabs.length > 0) {
    const fromSlabs = [...new Set(slabs.map(s => s.minQty))].sort((a, b) => a - b)
    return maxOrderQty ? fromSlabs.filter(q => q <= maxOrderQty) : fromSlabs
  }
  const mult = [1, 2, 5, 10, 25, 50]
  const uniq = [...new Set(mult.map(m => Math.max(moq, moq * m)))].sort((a, b) => a - b)
  return maxOrderQty ? uniq.filter(q => q <= maxOrderQty) : uniq
}

function getPriceForQty(
  slabs: { minQty: number; maxQty: number | null; price: number }[],
  qty: number,
): number {
  const slab = slabs.find(s => s.minQty <= qty && (s.maxQty === null || s.maxQty >= qty))
  if (slab) return slab.price
  const fallback = [...slabs].filter(s => s.minQty <= qty).pop()
  return fallback?.price ?? slabs[0]?.price ?? 0
}

function getGeoChip(distanceKm?: number, city?: string): { label: string; bg: string; color: string } | null {
  if (distanceKm === undefined || distanceKm === null) return null
  if (distanceKm <= 3) return { label: 'Near You', bg: '#F0FDF4', color: '#16A34A' }
  if (distanceKm <= 15) return { label: 'Same City', bg: '#FFF7F3', color: '#FF5A1F' }
  if (distanceKm <= 50) return { label: 'Same District', bg: '#FFF7F3', color: '#FF5A1F' }
  if (distanceKm <= 200) return { label: 'Same State', bg: '#F0FDF4', color: '#16A34A' }
  return { label: city ? `${city} \u2022 ${distanceKm} km` : `${distanceKm} km`, bg: '#F3F4F6', color: '#6B7280' }
}

function formatPrice(n: number): string {
  if (n >= 10000000) return (n / 10000000).toFixed(2) + 'Cr'
  if (n >= 100000) return (n / 100000).toFixed(1) + 'L'
  if (n >= 1000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'K'
  return n.toLocaleString('en-IN')
}

function TrustBar({ score }: { score: number }) {
  if (score < 60) return null
  const color = score >= 80 ? '#16A34A' : score >= 60 ? '#D97706' : '#DC2626'
  return (
    <div className="flex items-center gap-1.5 w-full max-w-[140px]">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#E5E7EB' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(score, 100)}%`, background: color }} />
      </div>
      <span className="text-[9px] leading-none whitespace-nowrap" style={{ color: '#6B7280' }}>{score}/100</span>
    </div>
  )
}

export default function ProductCard({
  product,
}: {
  product: ProductCardData
}) {
  const router = useRouter()
  const { user } = useAuthStore()
  const { items: compareItems, toggle: toggleCompare } = useCompareStore()
  const { ids: wishIds, loaded, fetch: fetchWishlist, toggle: toggleWishlist } = useWishlistStore()

  const pid = product._id || product.id!
  const inCompare = compareItems.some(i => i._id === pid)
  const isSaved = wishIds.includes(pid)
  const discountPct = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0
  const savings = product.originalPrice && product.originalPrice > product.price
    ? product.originalPrice - product.price : 0

  const images = product.images?.length ? product.images : ['/placeholder-product.jpg']
  const [imgIdx, setImgIdx] = useState(0)

  const derived = useMemo(() => {
    const qtyOptions = getQtyOptions(product.moq, product.priceSlabs, product.maxOrderQty)
    return { qtyOptions, initialQty: qtyOptions[0] || product.moq }
  }, [product.moq, product.priceSlabs, product.maxOrderQty])

  const [selectedQty, setSelectedQty] = useState(derived.initialQty)

  useEffect(() => { setSelectedQty(derived.initialQty) }, [derived.initialQty])

  const currentPrice = useMemo(() => {
    if (product.priceSlabs?.length) return getPriceForQty(product.priceSlabs, selectedQty)
    return product.price
  }, [product.priceSlabs, product.price, selectedQty])

  const totalPrice = currentPrice * selectedQty
  const currentDiscountPct = product.originalPrice && product.originalPrice > currentPrice
    ? Math.round(((product.originalPrice - currentPrice) / product.originalPrice) * 100) : discountPct
  const currentSavings = product.originalPrice && product.originalPrice > currentPrice
    ? product.originalPrice - currentPrice : savings

  const seller = resolveSellerInfo(product)
  const earn = gocashEarn(totalPrice)
  const geo = product.seller.distanceKm !== undefined
    ? getGeoChip(product.seller.distanceKm, seller.city || product.seller.city) : null

  useEffect(() => {
    if (user?.role === 'BUYER' && !loaded) fetchWishlist()
  }, [user, loaded, fetchWishlist])

  const requireAuth = (fn: () => void) => {
    if (!user) { toast({ title: 'Login karke continue karein', variant: 'destructive' }); router.push('/login'); return }
    fn()
  }

  const handleChat = () => requireAuth(() => router.push(`/messages?vendor=${product.seller._id}&product=${pid}`))
  const handleRFQ = () => requireAuth(() => router.push(`/buyer/rfq/create?productId=${pid}`))
  const handleBuyNow = () => requireAuth(() => router.push(`/checkout?productId=${pid}&qty=${selectedQty}`))

  const handleSave = () => requireAuth(async () => {
    if (user?.role !== 'BUYER') { toast({ title: 'Sirf buyer account se save kar sakte hain', variant: 'destructive' }); return }
    try {
      await toggleWishlist(pid)
      toast({ title: isSaved ? 'Wishlist se hata diya' : 'Wishlist mein add ho gaya' })
    } catch { toast({ title: 'Kuch error aaya, phir try karein', variant: 'destructive' }) }
  })

  const handleCompare = () => {
    if (!inCompare && compareItems.length >= 4) { toast({ title: 'Maximum 4 products compare kar sakte hain', variant: 'destructive' }); return }
    toggleCompare(product)
    toast({ title: inCompare ? 'Compare se hata diya' : 'Compare list mein add ho gaya' })
  }

  const sellerNameContent = (
    <>
      <Building2 size={14} className="inline -mt-0.5 mr-1" style={{ color: '#9CA3AF' }} />
      {seller.name || 'Verified Supplier'}
    </>
  )

  return (
    <div
      className="flex flex-col md:flex-row overflow-hidden rounded-xl border bg-white transition-all duration-200 hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)]"
      style={{ borderColor: '#E9E9E9' }}
    >
      {/* IMAGE */}
      <div
        className="relative overflow-hidden flex-shrink-0 w-full md:w-[35%]"
        style={{ background: '#FAFAFA', minHeight: '180px', maxHeight: '420px' }}
      >
        <img
          src={images[imgIdx]}
          alt={product.title}
          className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
          loading="lazy"
        />

        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.preventDefault(); setImgIdx(i => (i - 1 + images.length) % images.length) }}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-white/90 shadow-sm text-[#6B7280] hover:text-[#1F2937] opacity-0 hover:opacity-100 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A1F]"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); setImgIdx(i => (i + 1) % images.length) }}
              aria-label="Next image"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-white/90 shadow-sm text-[#6B7280] hover:text-[#1F2937] opacity-0 hover:opacity-100 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A1F]"
            >
              <ChevronRight size={14} />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5" role="tablist" aria-label="Image navigation">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.preventDefault(); setImgIdx(i) }}
                  aria-label={`Image ${i + 1} of ${images.length}`}
                  className={`h-1.5 rounded-full transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A1F] ${i === imgIdx ? 'w-4 bg-[#FF5A1F]' : 'w-1.5 bg-white/60'}`}
                />
              ))}
            </div>
          </>
        )}

        {/* Save */}
        <button
          onClick={handleSave}
          aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
          className="absolute top-3 right-3 flex items-center justify-center w-8 h-8 rounded-full transition-all hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A1F]"
          style={{ background: isSaved ? 'rgba(255,90,31,0.12)' : 'rgba(255,255,255,0.9)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
        >
          <Bookmark size={15} className={isSaved ? 'fill-[#FF5A1F] text-[#FF5A1F]' : 'text-[#6B7280]'} />
        </button>

        {/* Image badges */}
        <div className="absolute bottom-2 left-2 flex flex-col gap-1">
          {product.isBestseller && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold"
              style={{ background: '#FFF7F3', color: '#FF5A1F', border: '1px solid rgba(255,90,31,0.2)' }}>
              <TrendingUp size={10} /> Bestseller
            </span>
          )}
          {discountPct > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold"
              style={{ background: '#FFF0F0', color: '#DC2626', border: '1px solid rgba(220,38,38,0.2)' }}
              aria-label={`${discountPct} percent discount`}>
              -{discountPct}% OFF
            </span>
          )}
          {product.seller.isVerified && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-semibold"
              style={{ background: 'rgba(22,163,74,0.12)', color: '#16A34A', border: '1px solid rgba(22,163,74,0.25)', backdropFilter: 'blur(4px)' }}>
              <BadgeCheck size={10} /> Verified
            </span>
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex flex-col flex-1 p-2.5 gap-1 overflow-hidden min-w-0">

        {/* 1. Product Name */}
        <Link href={`/products/${product.slug}`}>
          <h3 className="text-sm font-bold leading-tight line-clamp-2 transition-colors hover:text-[#FF5A1F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A1F]" style={{ color: '#1F2937' }}>
            {product.title}
          </h3>
        </Link>

        {/* 2. Category */}
        <p className="text-[10px]" style={{ color: '#6B7280' }}>
          {product.categoryName}{product.subCategory && <> &rsaquo; {product.subCategory}</>}
        </p>

        {/* 3. Price */}
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-lg md:text-xl font-black leading-none" style={{ color: '#1F2937' }}>
            &#8377;{currentPrice.toLocaleString('en-IN')}
          </span>
          {currentDiscountPct > 0 && (
            <>
              <span className="text-[11px] line-through" style={{ color: '#9CA3AF' }}>
                &#8377;{(product.originalPrice ?? 0).toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] font-bold" style={{ color: '#DC2626' }}>-{currentDiscountPct}%</span>
              <span className="text-[10px]" style={{ color: '#16A34A' }}>Save &#8377;{currentSavings.toLocaleString('en-IN')}</span>
            </>
          )}
          <span className="text-[10px]" style={{ color: '#6B7280' }}>/ {product.unit}</span>
        </div>

        {/* 4. Company Identity */}
        <div className="flex items-start gap-2 p-2 rounded-lg" style={{ background: '#FAFAFA', border: '1px solid #E5E7EB' }}>
          <div className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center font-bold text-sm flex-shrink-0"
            style={{ background: '#FFF7F3', border: '1px solid rgba(255,90,31,0.15)', color: '#FF5A1F' }}>
            {seller.logo ? (
              <img src={seller.logo} alt={seller.name || ''} className="w-full h-full object-cover" />
            ) : (
              (seller.name || 'S')[0].toUpperCase()
            )}
          </div>

          <div className="flex flex-col min-w-0 flex-1 gap-0.5">
            {/* Company Name */}
            {seller.slug ? (
              <Link href={`/companies/${seller.slug}`}
                className="text-sm font-bold truncate transition-colors hover:text-[#FF5A1F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A1F]" style={{ color: '#1F2937' }}>
                {sellerNameContent}
              </Link>
            ) : (
              <span className="text-sm font-bold truncate" style={{ color: '#1F2937' }}>{sellerNameContent}</span>
            )}

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px]">
              {seller.isVerified && (
                <span className="inline-flex items-center gap-0.5 font-semibold" style={{ color: '#16A34A' }}>
                  <CheckCircle2 size={10} /> Verified
                </span>
              )}
              {seller.isTradgoElite && (
                <span className="inline-flex items-center gap-0.5 font-semibold" style={{ color: '#D97706' }}>
                  <Crown size={10} /> Elite
                </span>
              )}
              {seller.gstVerified && (
                <span className="font-semibold" style={{ color: '#16A34A' }}>GST &#10003;</span>
              )}
              {seller.yearsActive && (
                <span className="inline-flex items-center gap-0.5" style={{ color: '#6B7280' }}>
                  <Clock size={10} /> {seller.yearsActive} yrs
                </span>
              )}
              {seller.avgResponseTime && (
                <span className="inline-flex items-center gap-0.5" style={{ color: '#6B7280' }}>
                  <Zap size={10} style={{ color: '#FF5A1F' }} /> {seller.avgResponseTime}
                </span>
              )}
            </div>

            {/* Trust Score Bar */}
            {seller.trustScore && seller.trustScore >= 60 && <TrustBar score={seller.trustScore} />}
          </div>
        </div>

        {/* 5. Geo Chip */}
        {geo && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium w-fit"
            style={{ background: geo.bg, color: geo.color }}>
            <MapPin size={11} /> {geo.label}
          </span>
        )}

        {/* 6. Meta strip (MOQ / Delivery / Stock / Payment / Rating) */}
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px]" style={{ color: '#6B7280' }}>
          <span className="inline-flex items-center gap-1"><Package size={11} /> MOQ {product.moq}</span>
          {product.deliveryEta && <span className="inline-flex items-center gap-1"><Truck size={11} /> {product.deliveryEta}</span>}
          <span className="inline-flex items-center gap-1" style={{ color: product.inStock ? '#16A34A' : '#DC2626' }}>
            <CheckCircle2 size={11} />{product.inStock ? product.stockQty ? `In stock (${product.stockQty})` : 'In stock' : 'Out of stock'}
          </span>
          <span suppressHydrationWarning className="inline-flex items-center gap-1"><Star size={11} className="fill-amber-400 text-amber-400" /> {product.rating.toFixed(1)} ({product.reviewCount})</span>
          {!!product.monthlyOrders && <span className="inline-flex items-center gap-1" style={{ color: '#16A34A' }}><TrendingUp size={11} /> {product.monthlyOrders} orders</span>}
        </div>

        {/* 7. Quantity Pricing Grid */}
        {derived.qtyOptions.length > 0 && product.priceSlabs && product.priceSlabs.length > 0 ? (
          <div className="grid grid-cols-4 gap-0.5">
            {derived.qtyOptions.slice(0, 8).map((q) => {
              const slabPrice = getPriceForQty(product.priceSlabs!, q)
              const isSelected = selectedQty === q
              return (
                <button key={q} onClick={() => setSelectedQty(q)}
                  aria-label={`Quantity ${q}, price ${slabPrice.toLocaleString('en-IN')} per ${product.unit}`}
                  className="p-1 rounded-md text-center transition-all focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#FF5A1F]"
                  style={{ background: isSelected ? '#FFF7F3' : '#F9FAFB', border: isSelected ? '1px solid #FF5A1F' : '1px solid #E5E7EB' }}>
                  <div className="text-[10px] font-semibold" style={{ color: isSelected ? '#FF5A1F' : '#1F2937' }}>{q.toLocaleString('en-IN')}</div>
                  <div className="text-[9px] leading-tight" style={{ color: isSelected ? '#FF5A1F' : '#6B7280' }}>&#8377;{formatPrice(slabPrice)}</div>
                </button>
              )
            })}
          </div>
        ) : derived.qtyOptions.length > 1 ? (
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[10px] font-semibold flex-shrink-0" style={{ color: '#6B7280' }}>Qty:</span>
            {derived.qtyOptions.slice(0, 7).map((q) => (
              <button key={q} onClick={() => setSelectedQty(q)}
                className="px-2 py-0.5 rounded-md text-[11px] font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#FF5A1F]"
                style={{ background: selectedQty === q ? '#FF5A1F' : '#F3F4F6', color: selectedQty === q ? '#fff' : '#4B5563', border: selectedQty === q ? '1px solid #FF5A1F' : '1px solid #E5E7EB' }}>
                {q.toLocaleString('en-IN')}
              </button>
            ))}
          </div>
        ) : null}

        {/* 8. Total + GOCASH + Savings */}
        {(selectedQty > 1 || earn > 0 || currentSavings > 0) && (
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px]" style={{ color: '#6B7280' }}>
            {selectedQty > 1 && (
              <span>&#8377;{currentPrice.toLocaleString('en-IN')}/unit &times; {selectedQty.toLocaleString('en-IN')} = <span className="font-semibold" style={{ color: '#1F2937' }}>&#8377;{totalPrice.toLocaleString('en-IN')}</span></span>
            )}
            {currentSavings > 0 && (
              <span style={{ color: '#16A34A' }}>Save &#8377;{formatPrice(currentSavings)}</span>
            )}
            {earn > 0 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-medium"
                style={{ background: '#FFFBEB', color: '#D97706', border: '1px solid rgba(217,119,6,0.2)' }}
                aria-label={`Earn ${earn} GOCASH reward points`}>
                <Coins size={10} /> +{earn} GOCASH
              </span>
            )}
          </div>
        )}

        {/* 9. Action Buttons */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 mt-auto">
          <button onClick={handleBuyNow} disabled={!product.inStock}
            className="flex items-center justify-center gap-1 px-1 py-1.5 sm:py-2 rounded-lg text-[11px] font-bold text-white transition-all disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #FF5A1F, #FF7A3D)' }}
            aria-label={product.inStock ? 'Buy now' : 'Out of stock'}>
            <ShoppingCart size={13} /> <span className="hidden sm:inline">Buy</span>
          </button>
          <button onClick={handleRFQ}
            className="flex items-center justify-center gap-1 px-1 py-1.5 sm:py-2 rounded-lg text-[11px] font-semibold transition-all"
            style={{ background: '#FFF7F3', color: '#FF5A1F', border: '1px solid rgba(255,90,31,0.3)' }}
            aria-label="Request for quotation">
            <FileQuestion size={13} /> <span className="hidden sm:inline">RFQ</span>
          </button>
          <button onClick={handleChat}
            className="flex items-center justify-center gap-1 px-1 py-1.5 sm:py-2 rounded-lg text-[11px] font-semibold transition-all"
            style={{ background: '#F3F4F6', color: '#4B5563', border: '1px solid #E5E7EB' }}
            aria-label="Chat with seller">
            <MessageCircle size={13} /> <span className="hidden sm:inline">Chat</span>
          </button>
          <button onClick={handleSave}
            className="flex items-center justify-center gap-1 px-1 py-1.5 sm:py-2 rounded-lg text-[11px] font-semibold transition-all"
            style={{ background: isSaved ? '#FFF7F3' : '#F3F4F6', color: isSaved ? '#FF5A1F' : '#4B5563', border: isSaved ? '1px solid rgba(255,90,31,0.3)' : '1px solid #E5E7EB' }}
            aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}>
            <Bookmark size={13} /> <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
          </button>
          <button onClick={handleCompare}
            className="flex items-center justify-center gap-1 px-1 py-1.5 sm:py-2 rounded-lg text-[11px] font-semibold transition-all"
            style={{ background: inCompare ? '#FFF7F3' : '#F3F4F6', color: inCompare ? '#FF5A1F' : '#4B5563', border: inCompare ? '1px solid rgba(255,90,31,0.3)' : '1px solid #E5E7EB' }}
            aria-label={inCompare ? 'Remove from compare' : 'Add to compare'}>
            <ArrowLeftRight size={13} /> <span className="hidden sm:inline">{inCompare ? 'Added' : 'Cmp'}</span>
          </button>
          <Link href={`/products/${product.slug}`}
            className="flex items-center justify-center gap-1 px-1 py-1.5 sm:py-2 rounded-lg text-[11px] font-semibold transition-all"
            style={{ background: '#F3F4F6', color: '#4B5563', border: '1px solid #E5E7EB' }}
            aria-label="View product details">
            <Info size={13} /> <span className="hidden sm:inline">Info</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
