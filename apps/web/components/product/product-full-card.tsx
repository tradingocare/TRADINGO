'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  BadgeCheck, ChevronLeft, ChevronRight, Clock, Crown, Heart,
  Info, MapPin, MessageCircle, Package, Phone, PlayCircle,
  ShieldCheck, ShoppingCart, Star, Truck, Users,
  FileQuestion, ArrowLeftRight, Bookmark, Share2, Navigation,
  Zap, Award, Headphones, Building2, Leaf, Settings, Wrench, Cog, Factory,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { useWishlistStore } from '@/store/wishlist-store'
import { useCompareStore } from '@/store/compare-store'
import { toast } from '@/components/ui/use-toast'
import type { ProductCardModel } from '@/types/product-card'
import { openChat } from '@/lib/messaging/chat-navigation'
import { getProduct } from '@/lib/api/products'
import { useEnrichedCategoryTree } from '@/hooks'
import { cn } from '@/lib/utils'

/* ═══════════════════════ HELPERS ═══════════════════════ */

function formatPriceFull(n: number): string {
  return n.toLocaleString('en-IN')
}

function formatPriceCompact(n: number): string {
  if (n >= 10000000) return (n / 10000000).toFixed(2) + ' Cr'
  if (n >= 100000) return (n / 100000).toFixed(1) + ' L'
  return n.toLocaleString('en-IN')
}

function gocashEarn(price: number) {
  return Math.floor(price / 1000) * 100
}

interface ProductFullCardProps {
  product: ProductCardModel
  preview?: boolean
}

/* ═══════════════════════ GALLERY (LEFT PANEL) ═══════════════════════ */

function GalleryPanel({ product, isSaved, onSave }: {
  product: ProductCardModel
  isSaved: boolean
  onSave: () => void
}) {
  const images = product.images?.length ? product.images : ['/placeholder-product.jpg']
  const [idx, setIdx] = useState(0)
  const total = images.length
  const go = (d: number) => setIdx(i => (i + d + total) % total)

  const discountPct = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0

  return (
    <div className="flex min-w-0 max-w-full flex-col gap-1.5 rounded-xl border border-border bg-bg-elevated/50 p-2 md:w-[240px] lg:w-[260px] shrink-0 overflow-hidden">
      {/* Main image — taller (square) inside the gallery's own box */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-border bg-bg-elevated group/media" style={{ maxHeight: '480px' }}>
        {/* Discount badge */}
        {discountPct > 0 && (
          <span
            className="absolute left-3 top-3 z-10 inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold"
            style={{
              background: 'color-mix(in srgb, var(--status-error) 14%, var(--surface-solid))',
              color: 'var(--status-error)',
              border: '1px solid color-mix(in srgb, var(--status-error) 45%, transparent)',
            }}
          >
            -{discountPct}% OFF
          </span>
        )}

        {/* Wishlist */}
        <button
          type="button"
          onClick={onSave}
          aria-label={isSaved ? 'Remove from saved' : 'Save product'}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg-elevated/90 transition-colors hover:border-accent/40 cursor-pointer"
        >
          <Heart size={16} style={{ color: isSaved ? 'var(--accent)' : 'var(--text-secondary)' }} fill={isSaved ? 'var(--accent)' : 'none'} />
        </button>

        <Link href={`/products/${product.slug}`} aria-label={product.title}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[idx]}
            alt={`${product.title} — image ${idx + 1} of ${total}`}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover/media:scale-[1.03]"
            loading="lazy"
          />
        </Link>

        {/* Nav arrows - only show on hover */}
        {total > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Previous image"
              className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-bg-elevated/90 text-text-secondary transition-colors hover:text-accent cursor-pointer opacity-0 group-hover/media:opacity-100 transition-opacity">
              <ChevronLeft size={18} />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Next image"
              className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-bg-elevated/90 text-text-secondary transition-colors hover:text-accent cursor-pointer opacity-0 group-hover/media:opacity-100 transition-opacity">
              <ChevronRight size={18} />
            </button>
            <span className="absolute bottom-2 left-2 z-10 rounded-md bg-bg-elevated/90 px-2 py-0.5 text-[11px] font-semibold text-text-secondary opacity-0 group-hover/media:opacity-100 transition-opacity">
              {idx + 1}/{total}
            </span>
          </>
        )}

        {/* Video badge */}
        {product.videoUrl && (
          <Link href={`/products/${product.slug}`}
            className="absolute bottom-2 right-2 z-10 inline-flex items-center gap-1 rounded-md bg-bg-elevated/90 px-2 py-1 text-[11px] font-semibold text-text-primary transition-colors hover:text-accent">
            <PlayCircle size={14} /> Video
          </Link>
        )}
      </div>

      {/* Thumbnails - 4 small boxes in one row BELOW the main image, always visible */}
      <div className="grid grid-cols-4 gap-1.5">
        {[0, 1, 2, 3].map((n) => {
          const imgIdx = (idx + n) % total
          // First box always shows the current image → only it gets the ring
          // (with a single image all 4 show the same photo; ringing all 4 looked broken)
          const active = n === 0
          return (
            <button key={`thumb-${n}`} type="button" onClick={() => setIdx(imgIdx)}
              aria-label={`View image ${imgIdx + 1}`}
              className="relative h-12 w-full overflow-hidden rounded-lg border bg-bg-elevated transition-all cursor-pointer hover:border-accent/50"
              style={{
                borderColor: active ? 'var(--accent)' : 'var(--border-color)',
                boxShadow: active ? '0 0 0 2px var(--accent)' : 'none',
              }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={images[imgIdx]} alt="" className="h-full w-full object-cover" loading="lazy" />
              {active && (
                <span className="absolute inset-0 bg-accent/20 pointer-events-none" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ═══════════════════════ CENTER INFO PANEL ═══════════════════════ */

function InfoPanel({ product, trail, isSaved, isCompared, onSave, onCompare, onShare, onChat, onCall }: {
  trail: string[]
  product: ProductCardModel
  isSaved: boolean
  isCompared: boolean
  onSave: () => void
  onCompare: () => void
  onShare: () => void
  onChat: () => void
  onCall: () => void
}) {
  const discountPct = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0
  const savings = product.originalPrice && product.originalPrice > product.price
    ? product.originalPrice - product.price : 0
  const gcEarn = product.gocashEarn || (product.price ? gocashEarn(product.price) : 0)
  const trustScore = product.trustScoreSnapshot ?? product.seller.trustScore ?? 0
  const hasRating = product.rating > 0 && product.reviewCount > 0
  // TODO-DEMO-STRIP: demo fixtures only (slug-gated). Real data always wins.
  // Delete with the TrustStrip demo block before live.
  const isDemoStrip = (product.slug || '').startsWith('tradingo-local-demo')

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2.5 rounded-xl border border-border bg-bg-elevated/30 p-3 sm:p-4">
      {/* Top line: category trail (left) + availability (right), single row */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px]">
        <nav className="flex min-w-0 flex-wrap items-center gap-1.5 text-text-tertiary" aria-label="Breadcrumb">
          {trail.length > 0 ? (
            trail.map((t, i) => (
              <span key={`${t}-${i}`} className="inline-flex min-w-0 items-center gap-1.5">
                {i > 0 && <ChevronRight size={10} className="shrink-0" />}
                <span className="truncate text-text-secondary">{t}</span>
              </span>
            ))
          ) : (
            <>
              <Link href="/trading" className="transition-colors hover:text-accent">Products</Link>
              <ChevronRight size={10} />
              {product.categoryName && (
                <>
                  <span className="text-text-secondary">{product.categoryName}</span>
                  {product.subCategory && (
                    <>
                      <ChevronRight size={10} />
                      <span className="text-text-secondary">{product.subCategory}</span>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </nav>
        <span className="ml-auto inline-flex shrink-0 items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold" style={{ color: 'var(--accent)' }}>
            <Package size={13} /> Availability
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold"
            style={{ color: product.inStock ? 'var(--status-success)' : 'var(--status-error)' }}>
            {product.inStock ? 'In Stock' : 'Out of Stock'}
            <span className="inline-block h-2 w-2 rounded-full"
              style={{ background: product.inStock ? 'var(--status-success)' : 'var(--status-error)' }} />
          </span>
          {product.sku && (
            <span className="text-[10px] text-text-tertiary">SKU: <span className="font-semibold text-text-secondary">{product.sku}</span></span>
          )}
        </span>
      </div>

      {/* Title + Subtitle */}
      <div>
        <div className="rounded-lg border border-border bg-bg-elevated/50 px-2.5 py-1.5">
          <h3 className="text-[17px] font-extrabold leading-snug sm:text-lg" style={{ color: 'var(--text-primary)' }}>
            <Link href={`/products/${product.slug}`} className="transition-colors hover:text-accent">
              {product.title}
            </Link>
          </h3>
        </div>
        {product.description && (
          <p className="mt-1 text-xs leading-relaxed text-text-secondary">{product.description}</p>
        )}
      </div>

      {/* Trust badges — single line: real + demo + GST (orange) */}
      <div className="flex flex-wrap items-center gap-1.5">
        {product.seller.isVerified && (
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold"
            style={{
              background: 'color-mix(in srgb, var(--status-success) 12%, transparent)',
              color: 'var(--status-success)',
              border: '1px solid color-mix(in srgb, var(--status-success) 30%, transparent)',
            }}>
            <ShieldCheck size={12} /> Verified Product
          </span>
        )}
        {product.seller.isTradgoElite && (
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold"
            style={{
              background: 'color-mix(in srgb, var(--accent-gold) 12%, transparent)',
              color: 'var(--accent-gold)',
              border: '1px solid color-mix(in srgb, var(--accent-gold) 30%, transparent)',
            }}>
            <Crown size={12} /> Elite Seller
          </span>
        )}
        {trustScore > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold"
            style={{
              background: 'color-mix(in srgb, var(--status-info) 12%, transparent)',
              color: 'var(--status-info)',
              border: '1px solid color-mix(in srgb, var(--status-info) 30%, transparent)',
            }}>
            <Award size={12} /> TRADEXA® Score {trustScore}{hasRating ? ` (${product.reviewCount})` : ''}
          </span>
        )}
        {/* TODO-DEMO-STRIP: demo-only badges (real data wins, delete before live) */}
        {isDemoStrip && !product.seller.isVerified && (
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold"
            style={{
              background: 'color-mix(in srgb, var(--status-success) 12%, transparent)',
              color: 'var(--status-success)',
              border: '1px solid color-mix(in srgb, var(--status-success) 30%, transparent)',
            }}>
            <ShieldCheck size={12} /> Verified Product
          </span>
        )}
        {isDemoStrip && !product.seller.isTradgoElite && (
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold"
            style={{
              background: 'color-mix(in srgb, var(--accent-gold) 12%, transparent)',
              color: 'var(--accent-gold)',
              border: '1px solid color-mix(in srgb, var(--accent-gold) 30%, transparent)',
            }}>
            <Crown size={12} /> Elite Seller
          </span>
        )}
        {isDemoStrip && !(trustScore > 0) && (
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold"
            style={{
              background: 'color-mix(in srgb, var(--status-info) 12%, transparent)',
              color: 'var(--status-info)',
              border: '1px solid color-mix(in srgb, var(--status-info) 30%, transparent)',
            }}>
            <Award size={12} /> TRADEXA® Score 3.5 (526)
          </span>
        )}
        {product.seller.isGstRegistered && (
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold"
            style={{
              background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
              color: 'var(--accent)',
              border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
            }}>
            <ShieldCheck size={12} /> GST Verified
          </span>
        )}
      </div>

      {/* One-liner sentence — fixed 2-line outlined box (word limit via clamp) */}
      <div className="rounded-lg border border-border bg-bg-elevated/50 px-2.5 py-1.5">
        <p className="line-clamp-2 text-[12px] leading-relaxed text-text-secondary">
          GST verified supplier with compliant invoicing. Trusted by buyers for seamless transactions.
        </p>
      </div>

      {/* Feature highlight mini-cells (reference composition, real keywords) */}
      {product.keywords && product.keywords.length > 0 && (
        <div className="grid grid-cols-2 gap-2 min-[1400px]:grid-cols-5">
          {product.keywords.slice(0, 5).map((kw, i) => {
            const Icon = [Settings, Wrench, Leaf, Cog, Factory][i % 5]
            const tones = ['var(--status-info)', 'var(--accent-gold)', 'var(--status-success)', 'var(--status-info)', 'var(--text-secondary)']
            return (
              <span key={kw} className="flex items-center gap-1.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-bg-elevated" style={{ color: tones[i % 5] }}>
                  <Icon size={14} />
                </span>
                <span className="text-[11px] font-semibold leading-tight text-text-secondary">{kw}</span>
              </span>
            )
          })}
        </div>
      )}

      {/* Price block + GOCASH — single line */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex flex-nowrap items-baseline gap-x-2.5">
          <span className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            ₹{formatPriceFull(product.price)}
          </span>
          <span className="text-xs text-text-tertiary">/ {product.unit || 'unit'}</span>
          {!!product.originalPrice && product.originalPrice > product.price && (
            <>
              <span className="text-sm text-text-tertiary line-through">₹{formatPriceFull(product.originalPrice)}</span>
              <span className="rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                style={{
                  background: 'color-mix(in srgb, var(--status-success) 14%, transparent)',
                  color: 'var(--status-success)',
                  border: '1px solid color-mix(in srgb, var(--status-success) 40%, transparent)',
                }}>
                -{discountPct}%
              </span>
              <span className="text-xs font-semibold" style={{ color: 'var(--status-success)' }}>
                You Save ₹{formatPriceFull(savings)}
              </span>
            </>
          )}
        </div>

        {/* GOCASH banner */}
        {gcEarn > 0 && (
          <div className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold"
            style={{
              background: 'color-mix(in srgb, var(--accent-gold) 12%, transparent)',
              color: 'var(--accent-gold)',
              border: '1px solid color-mix(in srgb, var(--accent-gold) 30%, transparent)',
            }}>
            <Star size={12} /> +₹{formatPriceCompact(gcEarn)} GOCASH
            <span className="ml-1 text-[9px] font-medium text-text-tertiary">on this purchase</span>
            <Info size={10} className="text-text-tertiary" />
          </div>
        )}
      </div>

      {/* Action row (reference order) */}
      <CardActionRow
        isSaved={isSaved}
        isCompared={isCompared}
        onSave={onSave}
        onCompare={onCompare}
        onShare={onShare}
        onChat={onChat}
        onCall={onCall}
      />

      </div>
  )
}

/* ─── SHARED 5-ACTION ROW (reference order: Chat, Call, Save, Compare, Share) ─── */

function CardActionRow({ onChat, onCall, onSave, onCompare, onShare, isSaved, isCompared }: {
  onChat: () => void
  onCall: () => void
  onSave: () => void
  onCompare: () => void
  onShare: () => void
  isSaved: boolean
  isCompared: boolean
}) {
  const btn = (onClick: () => void, icon: React.ReactNode, label: string, active: boolean) => (
    <button type="button" onClick={onClick}
      className="flex flex-row items-center justify-center gap-1.5 rounded-lg px-1 py-2 text-[10px] font-semibold transition-colors cursor-pointer"
      style={{
        background: active ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'var(--bg-elevated)',
        color: active ? 'var(--accent-light)' : 'var(--text-secondary)',
        border: active ? '1px solid color-mix(in srgb, var(--accent) 30%, transparent)' : '1px solid var(--border-color)',
      }}
      aria-label={label}>
      {icon}
      <span className="whitespace-nowrap">{label}</span>
    </button>
  )
  return (
    <div className="grid grid-cols-5 gap-1.5">
      {btn(onChat, <MessageCircle size={15} />, 'Chat', false)}
      {btn(onCall, <Phone size={15} />, 'Call', false)}
      {btn(onSave, <Bookmark size={15} />, isSaved ? 'Saved' : 'Save', isSaved)}
      {btn(onCompare, <ArrowLeftRight size={15} />, isCompared ? 'Added' : 'Compare', isCompared)}
      {btn(onShare, <Share2 size={15} />, 'Share', false)}
    </div>
  )
}

/* ─── SELLER BAR ─── */

function SellerBar({ product, compact = false }: { product: ProductCardModel; compact?: boolean }) {
  const s = product.seller
  const initial = (s.name || 'T').trim().charAt(0).toUpperCase()
  // TODO-DEMO-STRIP: demo fixtures only (slug-gated, real data wins, delete before live).
  const isDemoStrip = (product.slug || '').startsWith('tradingo-local-demo')

  return (
    <div className={cn('flex items-center rounded-xl border border-border bg-bg-elevated', compact ? 'gap-2 px-2 py-1.5' : 'gap-3 px-3 py-2.5')}>
      {/* Logo image box (real logo when present, initial fallback) */}
      <div className={cn('relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border', compact ? 'h-8 w-8' : 'h-11 w-11')}
        style={{ background: 'color-mix(in srgb, var(--accent) 15%, var(--surface-solid))' }}>
        {s.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.logo} alt={s.name || 'Seller'} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        ) : (
          <span className={cn('font-extrabold', compact ? 'text-sm' : 'text-lg')} style={{ color: 'var(--accent)' }}>{initial}</span>
        )}
      </div>

      {/* Name + badges + location — single row, no wrap */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          {s.slug ? (
            <Link href={`/companies/${s.slug}`} className={cn('truncate font-bold text-text-primary transition-colors hover:text-accent', compact ? 'text-xs' : 'text-[13px]')} title={s.name}>
              {s.name || 'Verified Supplier'}
            </Link>
          ) : (
            <span className={cn('truncate font-bold text-text-primary', compact ? 'text-xs' : 'text-[13px]')}>{s.name || 'Verified Supplier'}</span>
          )}
          {(s.isTradgoElite || isDemoStrip) && <Crown size={13} style={{ color: 'var(--accent-gold)' }} />}
          {(s.isVerified || isDemoStrip) && (
            <span className="inline-flex w-fit items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold"
              style={{
                background: 'color-mix(in srgb, var(--status-success) 10%, transparent)',
                color: 'var(--status-success)',
                border: '1px solid color-mix(in srgb, var(--status-success) 30%, transparent)',
              }}>
              <BadgeCheck size={9} /> Verified Company
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-x-2 text-[10px] text-text-tertiary">
          {(s.city || isDemoStrip) && (
            <span className="inline-flex items-center gap-0.5">
              <MapPin size={9} style={{ color: 'var(--accent)' }} /> {isDemoStrip ? 'Rajkot, Gujarat, India' : (<>{s.city}{product.seller.businessType ? `, ${product.seller.businessType}` : ''}</>)}
            </span>
          )}
          {(!!s.distanceKm || isDemoStrip) && (
            <span className="inline-flex items-center gap-0.5">
              <Navigation size={9} /> {s.distanceKm ? `${s.distanceKm} km away` : '296 km away'}
            </span>
          )}
        </div>
      </div>

      {/* Years in business */}
      {!!s.yearsActive && s.yearsActive > 0 && (
        <div className={cn('hidden shrink-0 text-right sm:block rounded-lg border border-border bg-bg-elevated', compact ? 'px-2 py-1' : 'px-3 py-1.5')}>
          <div className={cn('font-bold', compact ? 'text-xs' : 'text-[13px]')} style={{ color: 'var(--text-primary)' }}>{s.yearsActive}+ Years</div>
          <div className="text-[10px] text-text-tertiary">in Business</div>
        </div>
      )}

      {s.slug && (
        <Link href={`/companies/${s.slug}`} aria-label={`View ${s.name || 'seller'} profile`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-tertiary transition-colors hover:text-accent">
          <ChevronRight size={16} />
        </Link>
      )}
    </div>
  )
}

/* ═══════════════════════ RIGHT PURCHASE PANEL ═══════════════════════ */

function PurchasePanel({ product, quantity, setQuantity, onBuy, onRFQ, onChat, onCall, onSave, onCompare, onShare, isSaved, isCompared }: {
  product: ProductCardModel
  quantity: number
  setQuantity: (q: number) => void
  onBuy: () => void
  onRFQ: () => void
  onChat: () => void
  onCall: () => void
  onSave: () => void
  onCompare: () => void
  onShare: () => void
  isSaved: boolean
  isCompared: boolean
}) {
  const qtyOptions = useMemo(() => {
    if (product.priceSlabs && product.priceSlabs.length > 0) {
      return [...new Set(product.priceSlabs.map(s => s.minQty))].sort((a, b) => a - b)
    }
    const moq = product.moq || 1
    return [1, 2, 5, 10, 25, 50].map(m => Math.max(moq, moq * m)).filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b)
  }, [product.moq, product.priceSlabs])

  const [unitSel, setUnitSel] = useState(product.unit || 'Piece')

  const panelRow = (icon: React.ReactNode, label: string, value: React.ReactNode) => (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-bg-elevated px-2.5 py-1.5">
      <span className="inline-flex items-center gap-1.5 text-[11px] text-text-secondary">{icon} {label}</span>
      <span className="text-xs font-bold text-right" style={{ color: 'var(--text-primary)' }}>{value}</span>
    </div>
  )

  return (
    <div className="flex min-w-0 flex-col gap-2.5 rounded-xl border border-border bg-bg-elevated/30 p-3 sm:p-4 md:w-[230px] md:shrink-0">
      {/* Info rows (Availability header lives in the center top line) */}
      <div className="flex flex-col gap-1">
        {panelRow(<Package size={12} />, 'MOQ', `${(product.moq || 1).toLocaleString('en-IN')} ${product.unit || 'Unit'}`)}
        {product.deliveryEta && panelRow(<Clock size={12} />, 'Lead Time', product.deliveryEta)}
        {!!product.stockQty && product.stockQty > 0 && panelRow(<Package size={12} />, 'Supply Capacity', `${product.stockQty.toLocaleString('en-IN')} ${product.unit || 'Units'} / Month`)}
        {panelRow(<Truck size={12} />, 'Shipping', product.freeDeliveryAbove ? `Free above ₹${formatPriceCompact(product.freeDeliveryAbove)}` : 'Pan India / Worldwide')}
      </div>

      {/* Quantity selector — single row, no wrap */}
      {qtyOptions.length > 0 && (
        <div>
          <div className="mb-1 text-[10px] font-semibold text-text-secondary">Quantity</div>
          <div className="flex flex-nowrap items-center gap-1.5 overflow-x-auto nav-scroll-hide pb-1">
            {qtyOptions.slice(0, 5).map(q => {
              const isSelected = quantity === q
              return (
                <button key={q} type="button" onClick={() => setQuantity(q)} aria-pressed={isSelected}
                  className="flex-shrink-0 rounded-lg py-1 px-1.5 text-center text-[11px] font-bold transition-all cursor-pointer"
                  style={{
                    background: isSelected
                      ? 'linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 70%, #ffaa00))'
                      : 'var(--bg-elevated)',
                    color: isSelected ? 'var(--btn-primary-text, #fff)' : 'var(--text-secondary)',
                    border: isSelected ? '1px solid transparent' : '1px solid var(--border-color)',
                  }}>
                  {q.toLocaleString('en-IN')}
                </button>
              )
            })}
            {/* Manual quantity + unit selector inline */}
            <input
              type="number"
              min={product.moq || 1}
              value={quantity}
              onChange={(e) => {
                const v = Math.max(product.moq || 1, Number(e.target.value) || product.moq || 1)
                setQuantity(v)
              }}
              aria-label="Enter quantity manually"
              className="h-8 w-16 shrink-0 rounded-lg border border-border bg-bg-elevated px-2 text-center text-[11px] font-bold text-text-primary outline-none transition-colors focus:border-accent"
            />
            <select
              value={unitSel}
              onChange={(e) => setUnitSel(e.target.value)}
              aria-label="Select unit"
              className="h-8 min-w-0 shrink-0 cursor-pointer rounded-lg border border-border bg-bg-elevated px-2 text-[11px] font-semibold text-text-secondary outline-none transition-colors focus:border-accent"
            >
              {['Piece', 'Pcs', 'Box', 'Bundle', 'Ton', 'Kg', 'Bori', 'Meter', 'Litre', 'Set', 'Packet', 'Carton'].map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* CTA buttons */}
      <div className="mt-auto flex flex-col gap-1.5 pt-1">
        <button type="button" onClick={onBuy} disabled={!product.inStock}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 70%, #ffaa00))', color: 'var(--btn-primary-text, #fff)' }}>
          <ShoppingCart size={16} /> Buy Now
        </button>
      </div>

    </div>
  )
}

/* ═══════════════════════ TRUST STRIP (BOTTOM) ═══════════════════════ */

function TrustStrip({ product }: { product: ProductCardModel }) {
  const hasRating = product.rating > 0 && product.reviewCount > 0
  const items: { icon: React.ReactNode; value: string; label: string; tone: string }[] = []

  // ═══ TODO-DEMO-STRIP: TEMPORARY DEMO SPECIMEN — DELETE BEFORE LIVE ═══
  // Founder-approved one-time override so the reference layout can be
  // verified end-to-end. Fires ONLY on clearly-marked local demo fixtures
  // (slug startsWith 'tradingo-local-demo'). Real products are untouched:
  // every demo value below yields to real data the moment it exists.
  // Future cleanup = delete the DEMO block + isDemoStrip usages (grep it).
  const DEMO_STRIP = { rating: '4.8/5', buyers: '2.9K+', onTime: '98.5%' }
  const isDemoStrip = (product.slug || '').startsWith('tradingo-local-demo')

  items.push({
    icon: <Star size={15} />,
    value: hasRating ? `${product.rating.toFixed(1)}/5` : (isDemoStrip ? DEMO_STRIP.rating : 'New'),
    label: hasRating ? `Seller Rating` : (isDemoStrip ? 'Seller Rating' : 'No reviews yet'),
    tone: 'var(--accent-gold)',
  })

  if (product.reviewCount > 0 || isDemoStrip) {
    items.push({
      icon: <Users size={15} />,
      value: product.reviewCount > 0 ? `${formatPriceCompact(product.reviewCount)}+` : DEMO_STRIP.buyers,
      label: 'Happy Buyers',
      tone: 'var(--status-info)',
    })
  }

  if (product.seller.avgResponseTime || isDemoStrip) {
    items.push({
      icon: <Truck size={15} />,
      value: product.seller.avgResponseTime || DEMO_STRIP.onTime,
      label: 'On-Time Delivery',
      tone: 'var(--status-success)',
    })
  }

  items.push({
    icon: <Headphones size={15} />,
    value: '24/7',
    label: 'Customer Support',
    tone: 'var(--status-success)',
  })

  if (product.warrantyPeriod) {
    items.push({
      icon: <ShieldCheck size={15} />,
      value: typeof product.warrantyPeriod === 'number' ? `${product.warrantyPeriod} months` : String(product.warrantyPeriod),
      label: 'Warranty',
      tone: 'var(--status-info)',
    })
  }

  if (product.keywords && product.keywords.length > 0) {
    const kw = product.keywords[0]
    items.push({
      icon: <Zap size={15} />,
      value: kw,
      label: 'Ideal for',
      tone: 'var(--accent-gold)',
    })
  }

  if (product.keywords && product.keywords.length > 1) {
    items.push({
      icon: <Leaf size={15} />,
      // TODO-DEMO-STRIP: demo fixtures show the reference energy cell;
      // real products show their own 2nd keyword. Removed with the block above.
      value: isDemoStrip ? 'Energy Efficient' : product.keywords[1],
      label: isDemoStrip ? 'Lower Operating Cost' : 'Highlight',
      tone: 'var(--status-success)',
    })
  }

  return (
    <div className="grid grid-cols-2 gap-x-2 gap-y-3 border-t border-border px-3 py-3 sm:grid-cols-3 md:flex md:items-center md:gap-0 md:px-2 md:py-2.5"
      style={{
        background: 'linear-gradient(90deg, color-mix(in srgb, var(--accent) 4%, transparent), transparent 30%, color-mix(in srgb, var(--accent-gold) 4%, transparent))',
      }}>
      {items.map((it, i) => (
        <div key={`${it.label}-${i}`}
          className="flex min-w-0 items-center gap-2 md:min-w-[120px] md:flex-1 md:px-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
            style={{ background: `color-mix(in srgb, ${it.tone} 12%, transparent)`, color: it.tone }}>
            {it.icon}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{it.value}</span>
            <span className="block truncate text-[10px] text-text-tertiary">{it.label}</span>
          </span>
        </div>
      ))}
    </div>
  )
}

/* ═══════════════════════ MAIN CARD ═══════════════════════ */

export function ProductFullCard({ product, preview = false }: ProductFullCardProps) {
  const router = useRouter()
  const auth = useAuthStore()
  const wishlist = useWishlistStore()
  const compare = useCompareStore()
  const [quantity, setQuantity] = useState(product.moq || 1)

  useEffect(() => {
    auth.hydrateFromStorage()
    if (auth.isAuthenticated && !wishlist.loaded) wishlist.fetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.isAuthenticated, wishlist.loaded])

  const isWishlisted = wishlist.isSaved(product.id)
  const isCompared = compare.items.some((item) => item._id === product.id)

  // Hydrate display-only fields the search index doesn't carry (keywords,
  // warranty text, return policy, MRP). Real slug-endpoint data, merged only
  // where the grid model lacks them — never synthesized.
  const [hydrated, setHydrated] = useState<Partial<ProductCardModel> | null>(null)
  const [catalogIds, setCatalogIds] = useState<{ cat?: string; sub?: string } | null>(null)
  useEffect(() => {
    if ((product.keywords?.length && catalogIds) || !product.slug) return
    let on = true
    getProduct(product.slug)
      .then((d: any) => {
        if (!on || !d) return
        const patch: Partial<ProductCardModel> = {}
        if (Array.isArray(d.focusKeywords) && d.focusKeywords.length) patch.keywords = d.focusKeywords
        if (typeof d.warrantyPeriod === 'number') patch.warrantyPeriod = `${d.warrantyPeriod} months` as any
        else if (d.warrantyPeriod) patch.warrantyPeriod = d.warrantyPeriod
        if (d.returnPolicy) patch.returnPolicy = d.returnPolicy
        if (typeof d.originalPrice === 'number') patch.originalPrice = d.originalPrice
        if (d.sku) patch.sku = d.sku
    if (d.description) patch.description = d.description
    if (d.shortDescription) patch.description = d.shortDescription
    if (Object.keys(patch).length) setHydrated(patch)
        if (!catalogIds && (d.catalogCategoryId || d.catalogSubcategoryId)) {
          setCatalogIds({ cat: d.catalogCategoryId, sub: d.catalogSubcategoryId })
        }
      })
      .catch(() => {})
    return () => { on = false }
  }, [product.slug])
  const viewProduct: ProductCardModel = hydrated ? { ...product, ...hydrated } : product

  // Category trail resolved against the cached catalog tree (zero extra
  // fetch — CatalogBrowser warms the same query key). Real linked
  // categories only; falls back to the Products breadcrumb.
  const treeQuery = useEnrichedCategoryTree()
  const trail = useMemo(() => {
    const out: string[] = []
    const tree: any[] = (treeQuery.data as any)?.catalogTree ?? []
    if (catalogIds?.cat) {
      const c = tree.find((x: any) => x.id === catalogIds.cat)
      if (c) {
        out.push(c.name)
        if (catalogIds?.sub) {
          const s = ((c.subcategories || []) as any[]).find((x: any) => x.id === catalogIds.sub)
          if (s) out.push(s.name)
        }
      }
    }
    return out
  }, [catalogIds, treeQuery.data])

  const previewNotice = () =>
    toast({
      title: 'Sample preview card',
      description: 'This is a demo product. Buy / RFQ / Chat activate when a real seller lists this product.',
    })

  const requireAuth = (action: () => void) => {
    if (preview) { previewNotice(); return }
    if (!auth.isAuthenticated) { router.push('/login'); return }
    action()
  }

  const handleWishlist = () => requireAuth(() => wishlist.toggle(product.id))
  const handleCompare = () => {
    if (preview) { previewNotice(); return }
    compare.toggle({
      _id: product.id,
      slug: product.slug,
      title: product.title,
      images: product.images?.length ? product.images : ['/placeholder-product.jpg'],
      price: product.price,
      unit: product.unit || 'unit',
      rating: product.rating || 0,
      reviewCount: product.reviewCount || 0,
      moq: product.moq,
      inStock: product.inStock,
      seller: {
        businessName: product.seller.name,
        slug: product.seller.slug || '',
        isVerified: product.seller.isVerified,
        trustScore: product.seller.trustScore,
        city: product.seller.city || '',
      },
      deliveryEta: product.deliveryEta,
      stockQty: product.stockQty,
      gstInvoiceAvailable: product.gstInvoiceAvailable,
      tradeCreditEligible: product.tradeCreditEligible || false,
      returnPolicy: product.returnPolicy,
    })
  }
  const handleBuy = () => requireAuth(() => router.push(`/checkout?productId=${product.id}&qty=${quantity}`))
  const handleRFQ = () => requireAuth(() => router.push(`/buyer/rfq/new?source=PRODUCT&sourceId=${product.id}`))
  const handleChat = () => requireAuth(() => {
    openChat({ router, companyId: product.seller.id || product.seller.slug || '', productId: product.id, title: product.title })
  })
  const handleCall = () => requireAuth(() => {
    toast({ title: 'Seller phone not shared', description: 'Chat with the seller or send an RFQ instead.' })
  })
  const handleShare = async () => {
    if (preview) { previewNotice(); return }
    const url = `${window.location.origin}/products/${product.slug}`
    if (navigator.share) {
      try { await navigator.share({ title: product.title, url }) } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url)
      toast({ title: 'Link copied!' })
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface">
      {/* 3-column layout: Gallery | Info | Purchase (grid tracks = overlap impossible) */}
      <div className="grid grid-cols-1 md:grid-cols-[240px_minmax(0,1fr)_230px] lg:grid-cols-[260px_minmax(0,1fr)_230px] gap-0">
        <GalleryPanel
          product={viewProduct}
          isSaved={isWishlisted}
          onSave={handleWishlist}
        />
        <InfoPanel
          product={viewProduct}
          trail={trail}
          isSaved={isWishlisted}
          isCompared={isCompared}
          onSave={handleWishlist}
          onCompare={handleCompare}
          onShare={handleShare}
          onChat={handleChat}
          onCall={handleCall}
        />
        <PurchasePanel
          product={viewProduct}
          quantity={quantity}
          setQuantity={setQuantity}
          onBuy={handleBuy}
          onRFQ={handleRFQ}
          onChat={handleChat}
          onCall={handleCall}
          onSave={handleWishlist}
          onCompare={handleCompare}
          onShare={handleShare}
          isSaved={isWishlisted}
          isCompared={isCompared}
        />
      </div>

      {/* Seller strip + RFQ — single row, starts at the gallery's left edge */}
      <div className="flex items-center gap-2 border-t border-border px-3 py-2 sm:px-4">
        <div className="min-w-0 flex-1">
          <SellerBar product={viewProduct} compact />
        </div>
        <button type="button" onClick={handleRFQ}
          className="flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl border px-4 py-2 text-xs font-bold transition-all cursor-pointer"
          style={{ background: 'transparent', color: 'var(--accent)', borderColor: 'color-mix(in srgb, var(--accent) 55%, transparent)' }}>
          <FileQuestion size={14} /> Request for Quote (RFQ)
        </button>
      </div>

      {/* Trust strip */}
      <TrustStrip product={viewProduct} />
    </section>
  )
}

/* ═══════════════════════ SKELETON ═══════════════════════ */

export function ProductFullCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden animate-pulse">
      <div className="flex flex-col md:flex-row">
        {/* Gallery skeleton */}
        <div className="p-4 md:w-[360px] shrink-0">
          <div className="aspect-[4/3] rounded-xl bg-bg-elevated" />
          <div className="mt-2 flex gap-1.5">
            {[0, 1, 2, 3].map(i => <div key={i} className="h-11 w-11 rounded-lg bg-bg-elevated" />)}
          </div>
        </div>
        {/* Info skeleton */}
        <div className="flex-1 p-4 space-y-3">
          <div className="h-3 bg-bg-elevated rounded w-1/3" />
          <div className="h-6 bg-bg-elevated rounded w-3/4" />
          <div className="h-3 bg-bg-elevated rounded w-1/2" />
          <div className="flex gap-2">
            <div className="h-6 w-24 bg-bg-elevated rounded-full" />
            <div className="h-6 w-20 bg-bg-elevated rounded-full" />
          </div>
          <div className="h-8 bg-bg-elevated rounded w-2/3" />
          <div className="h-16 bg-bg-elevated rounded" />
        </div>
        {/* Purchase skeleton */}
        <div className="md:w-[260px] shrink-0 md:border-l border-t md:border-t-0 border-border p-4 space-y-2">
          <div className="h-4 bg-bg-elevated rounded w-1/2" />
          <div className="h-8 bg-bg-elevated rounded" />
          <div className="h-8 bg-bg-elevated rounded" />
          <div className="h-8 bg-bg-elevated rounded" />
          <div className="h-10 bg-bg-elevated rounded-xl" />
          <div className="h-10 bg-bg-elevated rounded-xl" />
        </div>
      </div>
      {/* Trust strip skeleton */}
      <div className="border-t border-border p-3 flex gap-4">
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className="h-8 w-8 rounded-full bg-bg-elevated" />
            <div className="space-y-1 flex-1">
              <div className="h-3 bg-bg-elevated rounded w-2/3" />
              <div className="h-2 bg-bg-elevated rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
