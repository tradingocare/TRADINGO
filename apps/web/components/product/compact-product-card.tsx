'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Star, Bookmark, ShoppingCart, MessageCircle, FileQuestion,
  ArrowLeftRight, ChevronLeft, ChevronRight, Package,
  BadgeCheck, Building2,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { useCompareStore } from '@/store/compare-store'
import { useWishlistStore } from '@/store/wishlist-store'
import { resolveSellerInfo } from '@/components/shared/SellerBadge'
import { toast } from '@/components/ui/use-toast'
import type { ProductCardData } from './product-card'

export default function CompactProductCard({
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

  const images = product.images?.length ? product.images : ['/placeholder-product.jpg']
  const [imgIdx, setImgIdx] = useState(0)

  const seller = resolveSellerInfo(product)

  useEffect(() => {
    if (user?.role === 'BUYER' && !loaded) fetchWishlist()
  }, [user, loaded, fetchWishlist])

  const requireAuth = (fn: () => void) => {
    if (!user) { toast({ title: 'Login karke continue karein', variant: 'destructive' }); router.push('/login'); return }
    fn()
  }

  const handleChat = () => requireAuth(() => router.push(`/messages?vendor=${product.seller._id}&product=${pid}`))
  const handleRFQ = () => requireAuth(() => router.push(`/buyer/rfq/create?productId=${pid}`))
  const handleBuyNow = () => requireAuth(() => router.push(`/checkout?productId=${pid}&qty=${product.moq}`))

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

  return (
    <div
      className="flex flex-col overflow-hidden rounded-xl border bg-white transition-all duration-200 hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] h-full"
      style={{ borderColor: '#E9E9E9' }}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden flex-shrink-0" style={{ background: '#FAFAFA' }}>
        <Link href={`/products/${product.slug}`}>
          <img
            src={images[imgIdx]}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
            loading="lazy"
          />
        </Link>

        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setImgIdx(i => (i - 1 + images.length) % images.length) }}
              aria-label="Previous image"
              className="absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-white/90 shadow-sm text-[#6B7280] hover:text-[#1F2937] opacity-0 hover:opacity-100 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A1F]"
            >
              <ChevronLeft size={12} />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setImgIdx(i => (i + 1) % images.length) }}
              aria-label="Next image"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-white/90 shadow-sm text-[#6B7280] hover:text-[#1F2937] opacity-0 hover:opacity-100 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A1F]"
            >
              <ChevronRight size={12} />
            </button>
          </>
        )}

        {/* Save button */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSave() }}
          aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
          className="absolute top-2 right-2 flex items-center justify-center w-7 h-7 rounded-full transition-all hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A1F]"
          style={{ background: isSaved ? 'rgba(255,90,31,0.12)' : 'rgba(255,255,255,0.9)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
        >
          <Bookmark size={13} className={isSaved ? 'fill-[#FF5A1F] text-[#FF5A1F]' : 'text-[#6B7280]'} />
        </button>

        {/* Discount badge */}
        {discountPct > 0 && (
          <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded-md text-[9px] font-bold"
            style={{ background: '#FFF0F0', color: '#DC2626', border: '1px solid rgba(220,38,38,0.2)' }}>
            -{discountPct}%
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-2.5 gap-1.5 min-w-0">
        {/* Title */}
        <Link href={`/products/${product.slug}`}>
          <h3 className="text-xs font-bold leading-tight line-clamp-2 transition-colors hover:text-[#FF5A1F]" style={{ color: '#1F2937' }}>
            {product.title}
          </h3>
        </Link>

        {/* Price + Rating row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-black leading-none" style={{ color: '#1F2937' }}>
              &#8377;{product.price.toLocaleString('en-IN')}
            </span>
            {discountPct > 0 && (
              <span className="text-[9px] line-through" style={{ color: '#9CA3AF' }}>
                &#8377;{(product.originalPrice ?? 0).toLocaleString('en-IN')}
              </span>
            )}
          </div>
          <span suppressHydrationWarning className="flex items-center gap-0.5 text-[10px] flex-shrink-0" style={{ color: '#6B7280' }}>
            <Star size={10} className="fill-amber-400 text-amber-400" />
            {product.rating.toFixed(1)}
          </span>
        </div>

        {/* Unit + MOQ */}
        <div className="flex items-center gap-2 text-[9px]" style={{ color: '#6B7280' }}>
          <span>/ {product.unit}</span>
          <span className="flex items-center gap-0.5"><Package size={9} /> MOQ {product.moq}</span>
        </div>

        {/* Seller */}
        <div className="flex items-center gap-1.5 mt-auto">
          <Building2 size={11} style={{ color: '#9CA3AF' }} />
          {seller.slug ? (
            <Link href={`/companies/${seller.slug}`}
              className="text-[10px] font-medium truncate hover:text-[#FF5A1F] transition-colors" style={{ color: '#4B5563' }}>
              {seller.name || 'Verified Supplier'}
            </Link>
          ) : (
            <span className="text-[10px] font-medium truncate" style={{ color: '#4B5563' }}>
              {seller.name || 'Verified Supplier'}
            </span>
          )}
          {seller.isVerified && <BadgeCheck size={9} style={{ color: '#16A34A' }} />}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-5 gap-0.5 mt-1">
          <button onClick={(e) => { e.preventDefault(); handleBuyNow() }} disabled={!product.inStock}
            className="flex items-center justify-center py-1.5 rounded-md text-white transition-all disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #FF5A1F, #FF7A3D)' }}
            aria-label="Buy now">
            <ShoppingCart size={11} />
          </button>
          <button onClick={(e) => { e.preventDefault(); handleRFQ() }}
            className="flex items-center justify-center py-1.5 rounded-md transition-all"
            style={{ background: '#FFF7F3', color: '#FF5A1F', border: '1px solid rgba(255,90,31,0.3)' }}
            aria-label="Request for quotation">
            <FileQuestion size={11} />
          </button>
          <button onClick={(e) => { e.preventDefault(); handleChat() }}
            className="flex items-center justify-center py-1.5 rounded-md transition-all"
            style={{ background: '#F3F4F6', color: '#4B5563', border: '1px solid #E5E7EB' }}
            aria-label="Chat with seller">
            <MessageCircle size={11} />
          </button>
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSave() }}
            className="flex items-center justify-center py-1.5 rounded-md transition-all"
            style={{ background: isSaved ? '#FFF7F3' : '#F3F4F6', color: isSaved ? '#FF5A1F' : '#4B5563', border: isSaved ? '1px solid rgba(255,90,31,0.3)' : '1px solid #E5E7EB' }}
            aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}>
            <Bookmark size={11} />
          </button>
          <button onClick={(e) => { e.preventDefault(); handleCompare() }}
            className="flex items-center justify-center py-1.5 rounded-md transition-all"
            style={{ background: inCompare ? '#FFF7F3' : '#F3F4F6', color: inCompare ? '#FF5A1F' : '#4B5563', border: inCompare ? '1px solid rgba(255,90,31,0.3)' : '1px solid #E5E7EB' }}
            aria-label={inCompare ? 'Remove from compare' : 'Add to compare'}>
            <ArrowLeftRight size={11} />
          </button>
        </div>
      </div>
    </div>
  )
}
