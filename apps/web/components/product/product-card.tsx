'use client'

import { memo, useMemo, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft, ChevronRight, Heart, PlayCircle, ShieldCheck, Crown,
  Award, AlertTriangle, Clock, Package, Truck, ShoppingCart, FileQuestion,
  MessageCircle, Bookmark, ArrowLeftRight, Info, Star, Users, ChevronRight as ChevronRightIcon,
  Navigation,
} from 'lucide-react'
import { useProductActions } from './use-product-actions'
import type { ProductCardModel, CardVariant, ProductCardFeatures } from '@/types/product-card'
import { mergeFeatures } from '@/types/product-card'

export interface ProductCardProps {
  product: ProductCardModel
  variant?: CardVariant
  features?: Partial<ProductCardFeatures>
  className?: string
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

function formatPrice(n: number): string {
  if (n >= 10000000) return (n / 10000000).toFixed(2) + 'Cr'
  if (n >= 100000) return (n / 100000).toFixed(1) + 'L'
  if (n >= 1000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'K'
  return n.toLocaleString('en-IN')
}

/** Full en-IN grouping for the hero price (e.g. renders 1234567 as 12,34,567). */
function formatPriceFull(n: number): string {
  return n.toLocaleString('en-IN')
}

export function ProductCardSkeleton() {
  return (
    <div className="@container relative rounded-2xl overflow-hidden animate-pulse bg-surface border border-border">
      <div className="flex flex-col @4xl:flex-row">
        <div className="@4xl:w-[360px] @4xl:shrink-0 p-3">
          <div className="aspect-[4/3] rounded-xl bg-surface-secondary" />
          <div className="mt-2 flex gap-1.5">
            {[0, 1, 2, 3].map(i => <div key={i} className="h-12 w-12 rounded-lg bg-surface-secondary" />)}
          </div>
        </div>
        <div className="flex-1 p-3 space-y-2">
          <div className="h-2 bg-surface-secondary rounded w-1/4" />
          <div className="h-5 bg-surface-secondary rounded w-3/4" />
          <div className="h-2 bg-surface-secondary rounded w-1/2" />
          <div className="h-8 bg-surface-secondary rounded w-2/3" />
          <div className="h-14 bg-surface-secondary rounded" />
        </div>
        <div className="@4xl:w-[260px] @4xl:shrink-0 @4xl:border-l @4xl:border-border p-3 space-y-2">
          <div className="h-3 bg-surface-secondary rounded w-1/2" />
          <div className="h-10 bg-surface-secondary rounded" />
          <div className="h-10 bg-surface-secondary rounded" />
        </div>
      </div>
    </div>
  )
}

/* ============================== MEDIA AREA ============================== */

function CardMedia({
  product, discountPct, isSaved, onSave, showWishlist,
}: {
  product: ProductCardModel
  discountPct: number
  isSaved: boolean
  onSave: () => void
  showWishlist: boolean
}) {
  const images = product.images?.length ? product.images : ['/placeholder-product.jpg']
  const [idx, setIdx] = useState(0)
  const total = images.length
  const go = (d: number) => setIdx(i => (i + d + total) % total)
  const thumbCount = Math.min(5, total)
  const extra = total - thumbCount

  return (
    <div className="@4xl:w-[360px] @4xl:shrink-0 p-3 @4xl:p-4 flex flex-col gap-2">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border bg-surface-secondary group/media @4xl:aspect-auto @4xl:flex-1 @4xl:min-h-[240px]">
        {discountPct > 0 && (
          <span
            className="absolute left-3 top-3 z-10 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold"
            style={{
              background: 'color-mix(in srgb, var(--status-error) 14%, var(--surface-solid))',
              color: 'var(--status-error)',
              border: '1px solid color-mix(in srgb, var(--status-error) 45%, transparent)',
            }}
          >
            -{discountPct}% OFF
          </span>
        )}

        {showWishlist && (
          <button
            type="button"
            onClick={onSave}
            aria-label={isSaved ? 'Remove from saved' : 'Save product'}
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg-elevated/90 transition-colors hover:border-accent/40 cursor-pointer"
          >
            <Heart size={16} style={{ color: isSaved ? 'var(--accent)' : 'var(--text-secondary)' }} fill={isSaved ? 'var(--accent)' : 'none'} />
          </button>
        )}

        <Link href={`/products/${product.slug}`} aria-label={product.title}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[idx]}
            alt={`${product.title} — image ${idx + 1} of ${total}`}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover/media:scale-[1.03]"
            loading="lazy"
          />
        </Link>

        {total > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Previous image"
              className="absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-bg-elevated/90 text-text-secondary transition-colors hover:text-accent cursor-pointer">
              <ChevronLeft size={16} />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Next image"
              className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-bg-elevated/90 text-text-secondary transition-colors hover:text-accent cursor-pointer">
              <ChevronRight size={16} />
            </button>
            <span className="absolute bottom-2 left-2 z-10 rounded-md bg-bg-elevated/90 px-1.5 py-0.5 text-[10px] font-semibold text-text-secondary">
              {idx + 1}/{total}
            </span>
          </>
        )}

        {product.videoUrl && (
          <Link href={`/products/${product.slug}`}
            className="absolute bottom-2 right-2 z-10 inline-flex items-center gap-1 rounded-md bg-bg-elevated/90 px-2 py-1 text-[10px] font-semibold text-text-primary transition-colors hover:text-accent">
            <PlayCircle size={12} /> Video
          </Link>
        )}
      </div>

      {total > 1 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {images.slice(0, thumbCount).map((src, i) => (
            <button key={`${src}-${i}`} type="button" onClick={() => setIdx(i)}
              aria-label={`View image ${i + 1}`}
              className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border transition-all cursor-pointer @4xl:h-12 @4xl:w-12"
              style={{
                borderColor: i === idx ? 'var(--accent)' : 'var(--border-color)',
                boxShadow: i === idx ? '0 0 0 1px var(--accent)' : 'none',
              }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
          {extra > 0 && (
            <Link href={`/products/${product.slug}`}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-bg-elevated text-[10px] font-semibold leading-tight text-text-secondary transition-colors hover:text-accent @4xl:h-12 @4xl:w-12">
   
              +{extra}
              <br />More
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

/* ============================== CENTER INFO ============================== */

function TrustChip({ icon, label, tone }: { icon: React.ReactNode; label: string; tone: 'success' | 'gold' | 'info' }) {
  const color = tone === 'success' ? 'var(--status-success)' : tone === 'gold' ? 'var(--accent-gold)' : 'var(--status-info)'
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold"
      style={{
        background: `color-mix(in srgb, ${color} 10%, transparent)`,
        color,
        border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
      }}>
      {icon} {label}
    </span>
  )
}

function CardInfo({
  product, features, isDefault,
}: {
  product: ProductCardModel
  features: ProductCardFeatures
  isDefault: boolean
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2 p-3 @4xl:p-4 @4xl:pl-0">
      {features.showCategory && (product.categoryName || product.subCategory) && (
        <p className="flex items-center gap-1 text-[11px] text-text-tertiary">
          {product.categoryName}
          {product.subCategory && <> <ChevronRightIcon size={10} /> <span>{product.subCategory}</span></>}
        </p>
      )}

      <Link href={`/products/${product.slug}`} className="group/title">
        <h3 className={`font-bold leading-tight transition-colors group-hover/title:text-accent ${isDefault ? 'text-lg @4xl:text-xl' : 'text-sm'}`}
          style={{ color: 'var(--text-primary)' }}>
          {product.title}
        </h3>
      </Link>

      {isDefault && product.description && (
        <p className="line-clamp-2 text-xs leading-snug text-text-secondary">{product.description}</p>
      )}

      {features.showBadges && (
        <div className="flex flex-wrap items-center gap-1.5">
          {product.seller.isVerified && <TrustChip icon={<ShieldCheck size={12} />} label="Verified Product" tone="success" />}
          {product.seller.isTradgoElite && <TrustChip icon={<Crown size={12} />} label="Elite Seller" tone="gold" />}
          {!product.seller.isVerified && !product.seller.isTradgoElite && <TrustChip icon={<Star size={12} />} label="New Listing" tone="info" />}
          {(product.trustScoreSnapshot ?? product.seller.trustScore ?? 0) > 0 && (
            <TrustChip icon={<Award size={12} />} label={`Trust Score ${product.trustScoreSnapshot ?? product.seller.trustScore}`} tone="info" />
          )}
        </div>
      )}

      {isDefault && features.showSpecsPreview && !!product.specifications?.length && (
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {product.specifications.slice(0, 4).map(spec => (
            <span key={spec.key} className="inline-flex items-center gap-1 text-[10px] text-text-secondary">
              <Package size={10} style={{ color: 'var(--status-info)' }} />
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{spec.label || spec.key}:</span>
              <span className="truncate max-w-[110px]">{spec.value}</span>
            </span>
          ))}
        </div>
      )}

      {features.showPrice && (
        <div>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              &#8377;{formatPriceFull(product.price)}
            </span>
            <span className="text-xs text-text-tertiary">/ {product.unit || 'unit'}</span>
            {!!product.originalPrice && product.originalPrice > product.price && (
              <>
                <span className="text-sm text-text-tertiary line-through">&#8377;{formatPriceFull(product.originalPrice)}</span>
                {features.showDiscountPct && (
                  <span className="rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                    style={{
                      background: 'color-mix(in srgb, var(--status-error) 12%, transparent)',
                      color: 'var(--status-error)',
                      border: '1px solid color-mix(in srgb, var(--status-error) 40%, transparent)',
                    }}>
                    -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                  </span>
                )}
                {features.showSavings && (
                  <span className="text-xs font-semibold" style={{ color: 'var(--status-success)' }}>
                    You Save &#8377;{formatPriceFull(product.originalPrice - product.price)}
                  </span>
                )}
              </>
            )}
          </div>

          {(!!product.gocashEarn || product.warrantyPeriod || product.returnPolicy) && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {!!product.gocashEarn && product.gocashEarn > 0 && (
                <span className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold"
                  style={{
                    background: 'color-mix(in srgb, var(--accent-gold) 10%, transparent)',
                    color: 'var(--accent-gold)',
                    border: '1px solid color-mix(in srgb, var(--accent-gold) 30%, transparent)',
                  }}>
                  <Star size={11} /> +&#8377;{formatPrice(product.gocashEarn)} GOCASH
                </span>
              )}
              {product.warrantyPeriod && (
                <span className="inline-flex items-center gap-1 text-[10px] text-text-secondary">
                  <ShieldCheck size={12} style={{ color: 'var(--status-info)' }} /> {product.warrantyPeriod} Warranty
                </span>
              )}
              {product.returnPolicy && (
                <span className="inline-flex max-w-[200px] items-center gap-1 truncate text-[10px] text-text-secondary" title={product.returnPolicy}>
                  <ShieldCheck size={12} style={{ color: 'var(--status-success)' }} /> {product.returnPolicy}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {features.showSeller && (
        <div className="mt-auto pt-1">
          <SellerBlock product={product} />
        </div>
      )}
    </div>
  )
}

function SellerBlock({ product }: { product: ProductCardModel }) {
  const s = product.seller
  const initial = (s.name || 'T').trim().charAt(0).toUpperCase()
  const nameInner = (
    <>
      <span className="flex items-center gap-1 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
        <span className="truncate max-w-[220px]">{s.name || 'Verified Supplier'}</span>
        {s.isTradgoElite && <Crown size={13} style={{ color: 'var(--accent-gold)' }} />}
      </span>
      {s.isVerified && (
        <span className="mt-0.5 inline-flex w-fit items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
          style={{
            background: 'color-mix(in srgb, var(--status-success) 10%, transparent)',
            color: 'var(--status-success)',
            border: '1px solid color-mix(in srgb, var(--status-success) 30%, transparent)',
          }}>
          <ShieldCheck size={9} /> Verified Company
        </span>
      )}
      <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-text-tertiary">
        {s.city && (
          <span className="inline-flex items-center gap-0.5">
            <Package size={9} /> {s.city}
          </span>
        )}
        {!!s.distanceKm && (
          <span className="inline-flex items-center gap-0.5">
            <Navigation size={9} /> {s.distanceKm} km away
          </span>
        )}
      </span>
    </>
  )
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-bg-elevated p-2.5">
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border"
        style={{ background: 'color-mix(in srgb, var(--accent) 15%, var(--surface-solid))' }}>
        {s.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.logo} alt={s.name || 'Seller'} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        ) : (
          <span className="text-base font-extrabold" style={{ color: 'var(--accent)' }}>{initial}</span>
        )}
      </div>
      {s.slug ? (
        <Link href={`/companies/${s.slug}`} className="group/seller min-w-0 flex-1">
          {nameInner}
        </Link>
      ) : (
        <div className="min-w-0 flex-1">{nameInner}</div>
      )}
      {!!s.yearsActive && s.yearsActive > 0 && (
        <div className="hidden shrink-0 text-right sm:block">
          <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{s.yearsActive}+ Years</div>
          <div className="text-[10px] text-text-tertiary">in Business</div>
        </div>
      )}
      {s.slug && (
        <Link href={`/companies/${s.slug}`} aria-label={`View ${s.name || 'seller'} profile`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-tertiary transition-colors hover:text-accent">
          <ChevronRightIcon size={16} />
        </Link>
      )}
    </div>
  )
}

/* ============================== RIGHT PANEL ============================== */

function PanelRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-bg-elevated px-2.5 py-1.5">
      <span className="inline-flex items-center gap-1.5 text-[11px] text-text-secondary">{icon} {label}</span>
      <span className="text-[11px] font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</span>
    </div>
  )
}

function CardPurchasePanel({
  product, features, qtyOptions, selectedQty, onSelect,
  onBuy, onRFQ, onChat, onSave, onCompare, isSaved, inCompare, showReport, onReport,
}: {
  product: ProductCardModel
  features: ProductCardFeatures
  qtyOptions: number[]
  selectedQty: number
  onSelect: (q: number) => void
  onBuy: () => void
  onRFQ: () => void
  onChat: () => void
  onSave: () => void
  onCompare: () => void
  isSaved?: boolean
  inCompare?: boolean
  showReport: boolean
  onReport?: () => void
}) {
  const iconBtn = 'flex flex-col items-center justify-center gap-1 rounded-lg py-2 text-[10px] font-semibold transition-colors cursor-pointer'
  const iconBtnStyle = (active: boolean) => ({
    background: active ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'var(--bg-elevated)',
    color: active ? 'var(--accent-light)' : 'var(--text-secondary)',
    border: active ? '1px solid color-mix(in srgb, var(--accent) 30%, transparent)' : '1px solid var(--border-color)',
  })
  return (
    <div className="flex flex-col gap-2 border-t border-border p-3 @4xl:w-[260px] @4xl:shrink-0 @4xl:border-l @4xl:border-t-0 @4xl:p-4">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold" style={{ color: 'var(--status-warning)' }}>
          <AlertTriangle size={13} /> Availability
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold"
          style={{ color: product.inStock ? 'var(--status-success)' : 'var(--status-error)' }}>
          {product.inStock ? 'In Stock' : 'Out of Stock'}
          <span className="inline-block h-2 w-2 rounded-full"
            style={{ background: product.inStock ? 'var(--status-success)' : 'var(--status-error)' }} />
        </span>
      </div>

      {product.sku && (
        <div className="text-right text-[10px] text-text-tertiary">SKU: <span className="font-semibold text-text-secondary">{product.sku}</span></div>
      )}

      <div className="flex flex-col gap-1">
        <PanelRow icon={<Package size={12} />} label="MOQ" value={`${product.moq.toLocaleString('en-IN')} ${product.unit || 'Unit'}`} />
        {!!product.stockQty && product.stockQty > 0 && (
          <PanelRow icon={<Package size={12} />} label="Stock" value={`${product.stockQty.toLocaleString('en-IN')} ${product.unit || 'units'}`} />
        )}
        {product.deliveryEta && <PanelRow icon={<Clock size={12} />} label="Lead Time" value={product.deliveryEta} />}
        {!!product.freeDeliveryAbove && (
          <PanelRow icon={<Truck size={12} />} label="Shipping" value={`Free above \u20B9${formatPrice(product.freeDeliveryAbove)}`} />
        )}
      </div>

      {features.showQuantitySelector && qtyOptions.length > 0 && (
        <div>
          <div className="mb-1 text-[11px] font-semibold text-text-secondary">Quantity</div>
          <div className="grid grid-cols-4 gap-1 @4xl:grid-cols-3">
            {qtyOptions.slice(0, 6).map(q => {
              const isSelected = selectedQty === q
              return (
                <button key={q} type="button" onClick={() => onSelect(q)} aria-pressed={isSelected}
                  aria-label={`Quantity ${q} ${product.unit || 'units'}`}
                  className="rounded-lg py-1.5 text-center text-xs font-bold transition-all cursor-pointer"
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
          </div>
        </div>
      )}

      {features.showActions && (
        <div className="mt-auto flex flex-col gap-1.5 pt-2">
          <button type="button" onClick={onBuy} disabled={!product.inStock}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 70%, #ffaa00))', color: 'var(--btn-primary-text, #fff)' }}>
            <ShoppingCart size={16} /> Buy Now
          </button>
          <button type="button" onClick={onRFQ}
            className="flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-bold transition-all cursor-pointer"
            style={{ background: 'transparent', color: 'var(--accent)', borderColor: 'color-mix(in srgb, var(--accent) 55%, transparent)' }}>
            <FileQuestion size={15} /> Request for Quote (RFQ)
          </button>
        </div>
      )}

      {features.showActions && (
        <div className="grid grid-cols-4 gap-1 border-t border-border pt-2">
          <button type="button" onClick={onChat} className={iconBtn} style={iconBtnStyle(false)} aria-label="Chat with seller">
            <MessageCircle size={15} /> Chat
          </button>
          <button type="button" onClick={onSave} className={iconBtn} style={iconBtnStyle(!!isSaved)} aria-label={isSaved ? 'Saved' : 'Save'}>
            <Bookmark size={15} /> {isSaved ? 'Saved' : 'Save'}
          </button>
          <button type="button" onClick={onCompare} className={iconBtn} style={iconBtnStyle(!!inCompare)} aria-label={inCompare ? 'Added to compare' : 'Compare'}>
            <ArrowLeftRight size={15} /> {inCompare ? 'Added' : 'Compare'}
          </button>
          <Link href={`/products/${product.slug}`} className={iconBtn} style={iconBtnStyle(false)} aria-label="View product details">
            <Info size={15} /> Info
          </Link>
        </div>
      )}
      {showReport && onReport && (
        <button type="button" onClick={onReport}
          className="ml-auto inline-flex items-center gap-0.5 text-[10px] transition-colors hover:text-accent cursor-pointer"
          style={{ color: 'var(--text-tertiary)' }}>
          <Info size={10} /> Report
        </button>
      )}
    </div>
  )
}

/* ============================== TRUST STRIP ============================== */

function TrustStrip({ product, features }: { product: ProductCardModel; features: ProductCardFeatures }) {
  const items: { icon: React.ReactNode; value: string; label: string; tone: string }[] = []
  // Lazy value callbacks — pushed values must only be evaluated when cond is true.
  const push = (cond: unknown, icon: React.ReactNode, value: () => string, label: string, tone: string) => {
    if (cond) items.push({ icon, value: value(), label, tone })
  }
  const realRating = product.rating > 0 && product.reviewCount > 0
  push(realRating && features.showRating, <Star size={16} />, () => `${product.rating.toFixed(1)}/5`, 'Seller Rating', 'var(--accent-gold)')
  push(features.showMonthlyOrders && !!product.monthlyOrders && product.monthlyOrders > 0,
    <Users size={16} />, () => `${formatPrice(product.monthlyOrders ?? 0)}+`, 'Monthly Orders', 'var(--status-info)')
  push(features.showDelivery && !!product.deliveryEta,
    <Truck size={16} />, () => product.deliveryEta || '', 'Delivery', 'var(--status-info)')
  push(features.showReturnWarranty && !!product.warrantyPeriod,
    <Award size={16} />, () => product.warrantyPeriod || '', 'Warranty', 'var(--status-success)')
  push(features.showReturnWarranty && !!product.returnPolicy,
    <ShieldCheck size={16} />, () => product.returnPolicy || '', 'Return Policy', 'var(--status-success)')
  push(features.showCertifications && !!product.certifications?.length,
    <Award size={16} />, () => product.certifications![0], 'Certified', 'var(--status-info)')
  push(features.showKeywords && !!product.keywords?.length,
    <Star size={16} />, () => product.keywords![0], 'Ideal for', 'var(--accent-gold)')

  if (items.length === 0) return null
  return (
    // Mobile/tablet: 2–3 column grid so every signal is visible without hidden horizontal scroll.
    // Desktop (@4xl+): single-row strip, matching the reference card's benefit strip.
    <div className="grid grid-cols-2 gap-x-2 gap-y-3 border-t border-border px-3 py-3 sm:grid-cols-3 @4xl:flex @4xl:items-center @4xl:gap-0 @4xl:px-2 @4xl:py-2.5">
      {items.map((it, i) => (
        <div key={`${it.label}-${i}`}
          className="flex min-w-0 items-center gap-2 @4xl:min-w-[130px] @4xl:flex-1 @4xl:px-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{ background: `color-mix(in srgb, ${it.tone} 12%, transparent)`, color: it.tone }}>
            {it.icon}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{it.value}</span>
            <span className="block truncate text-[10px] text-text-tertiary">{it.label}</span>
          </span>
        </div>
      ))}
    </div>
  )
}

/* ============================== MAIN CARD ============================== */

export const ProductCard = memo(function ProductCard({
  product,
  variant = 'default',
  features: featureOverrides,
  className = '',
}: ProductCardProps) {
  const features = useMemo(() => mergeFeatures(variant, featureOverrides), [variant, featureOverrides])
  const actions = useProductActions(product)

  const discountPct = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0

  const derived = useMemo(() => {
    const qtyOptions = getQtyOptions(product.moq, product.priceSlabs, product.maxOrderQty)
    return { qtyOptions, initialQty: qtyOptions[0] || product.moq }
  }, [product.moq, product.priceSlabs, product.maxOrderQty])

  const [selectedQty, setSelectedQty] = useState<number>(derived.initialQty)
  useEffect(() => {
    setSelectedQty(derived.initialQty)
  }, [derived.initialQty])

  const isDefault = variant === 'default'

  return (
    <div className={`stacked-card-wrapper ${variant === 'compact' ? 'h-full' : ''} ${className}`}>
      <div className="@container relative flex h-full flex-col overflow-hidden rounded-2xl border border-border compact-stack-card bg-surface">
        {/* TRADINGO side rails — native token gradients framing the card (reference strip treatment) */}
        <div className="pointer-events-none absolute inset-y-4 left-0 z-10 w-[3px] rounded-full"
          style={{ background: 'linear-gradient(180deg, var(--accent), transparent)' }} />
        <div className="pointer-events-none absolute inset-y-4 right-0 z-10 w-[3px] rounded-full"
          style={{ background: 'linear-gradient(180deg, var(--accent-gold), transparent)' }} />

        <div className="flex flex-col @4xl:flex-row">
          {features.showImage && (
            <CardMedia
              product={product}
              discountPct={discountPct}
              isSaved={!!actions.isSaved}
              onSave={actions.handleSave}
              showWishlist={features.showWishlist ?? true}
            />
          )}
          <CardInfo product={product} features={features} isDefault={isDefault} />
          <CardPurchasePanel
            product={product}
            features={features}
            qtyOptions={derived.qtyOptions}
            selectedQty={selectedQty}
            onSelect={setSelectedQty}
            onBuy={() => actions.handleBuyNow(selectedQty)}
            onRFQ={actions.handleRFQ}
            onChat={actions.handleChat}
            onSave={actions.handleSave}
            onCompare={actions.handleCompare}
            isSaved={!!actions.isSaved}
            inCompare={!!actions.inCompare}
            showReport={features.showReport ?? false}
            onReport={actions.handleReport}
          />
        </div>

        <TrustStrip product={product} features={features} />
      </div>
    </div>
  )
})
