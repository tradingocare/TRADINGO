'use client'

import { memo, useMemo, useEffect, useState } from 'react'
import Link from 'next/link'
import { CardImage } from './card-image'
import { CardPrice } from './card-price'
import { CardSeller } from './card-seller'
import { CardBadges } from './card-badges'
import { CardActions } from './card-actions'
import { useProductActions } from './use-product-actions'
import type { ProductCardModel, CardVariant, ProductCardFeatures } from '@/types/product-card'
import { mergeFeatures } from '@/types/product-card'

export interface ProductCardProps {
  product: ProductCardModel
  variant?: CardVariant
  features?: Partial<ProductCardFeatures>
  className?: string
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

function formatPrice(n: number): string {
  if (n >= 10000000) return (n / 10000000).toFixed(2) + 'Cr'
  if (n >= 100000) return (n / 100000).toFixed(1) + 'L'
  if (n >= 1000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'K'
  return n.toLocaleString('en-IN')
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden animate-pulse bg-surface border-border">
      <div className="aspect-[4/3] bg-surface-secondary" />
      <div className="p-3 space-y-2">
        <div className="h-2 bg-surface-secondary rounded w-1/3" />
        <div className="h-3 bg-surface-secondary rounded w-5/6" />
        <div className="h-3 bg-surface-secondary rounded w-2/3" />
        <div className="h-6 bg-surface-secondary rounded w-1/2" />
        <div className="h-8 bg-surface-secondary rounded" />
      </div>
    </div>
  )
}

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

  const earn = gocashEarn(product.price * Math.max(product.moq, 1))

  const derived = useMemo(() => {
    const qtyOptions = getQtyOptions(product.moq, product.priceSlabs, product.maxOrderQty)
    return { qtyOptions, initialQty: qtyOptions[0] || product.moq }
  }, [product.moq, product.priceSlabs, product.maxOrderQty])

  const [selectedQty, setSelectedQty] = useState<number>(derived.initialQty)
  useEffect(() => {
    setSelectedQty(derived.initialQty)
  }, [derived.initialQty])

  const isDefault = variant === 'default'
  const isCompact = variant === 'compact'
  const isMinimal = variant === 'minimal'

  const containerClass = isDefault
    ? 'flex flex-col md:flex-row overflow-hidden'
    : 'flex flex-col overflow-hidden'

  const contentClass = isDefault
    ? 'flex flex-col flex-1 p-2.5 gap-1 overflow-hidden min-w-0'
    : 'flex flex-col flex-1 p-2.5 gap-1.5 min-w-0'

  return (
    <div className={`stacked-card-wrapper ${isCompact ? 'h-full' : ''} ${className}`}>
      <div className={`${containerClass} rounded-xl border border-border compact-stack-card ambient-backlight ${isCompact ? 'h-full' : ''}`}>
        {features.showImage && (
          <CardImage
            images={product.images}
            slug={product.slug}
            title={product.title}
            isSaved={actions.isSaved}
            onSave={actions.handleSave}
            discountPct={discountPct}
            isBestseller={product.isBestseller}
            isPremium={product.isPremium}
            variant={variant}
          />
        )}

        <div className={contentClass}>
          {/* Title + Category */}
          {features.showCategory && (
            <p className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>
              {product.categoryName}{product.subCategory && <> &rsaquo; {product.subCategory}</>}
            </p>
          )}
          <Link href={`/products/${product.slug}`}>
            <h3 className={`font-bold leading-tight line-clamp-2 transition-colors hover:text-accent ${isDefault ? 'text-sm' : 'text-xs'}`}
              style={{ color: 'var(--text-primary)' }}>
              {product.title}
            </h3>
          </Link>

          {/* Brand */}
          {features.showBrand && product.brand && (
            <p className="text-[10px] text-text-tertiary">by {product.brand}</p>
          )}

          {/* Price */}
          {features.showPrice && (
            <CardPrice
              price={product.price}
              originalPrice={product.originalPrice}
              unit={product.unit}
              discountPct={discountPct}
              showDiscountPct={features.showDiscountPct}
              showSavings={features.showSavings}
              priceSlabs={product.priceSlabs}
            />
          )}

          {/* Seller */}
          {features.showSeller && (
            <CardSeller seller={product.seller} showLocation={features.showLocation} showChips={features.showSellerChips} />
          )}

          {/* Badges Row */}
          <CardBadges
            product={{
              ...product,
              gocashEarn: features.showGocash ? earn : undefined,
              geoLabel: product.geoLabel || (product.distanceKm ? `${product.distanceKm} km` : undefined),
            }}
            features={features}
          />

          {/* Keyword chips (default variant only) */}
          {isDefault && features.showKeywords && !!product.keywords?.length && (
            <div className="flex flex-wrap gap-1">
              {product.keywords.slice(0, 4).map((kw) => (
                <span key={kw} className="px-1.5 py-0.5 rounded-full text-[9px] font-medium border border-border"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-tertiary)' }}>
                  #{kw}
                </span>
              ))}
            </div>
          )}

          {/* Quantity Selector (default variant only) */}
          {features.showQuantitySelector && derived.qtyOptions.length > 1 && product.priceSlabs && product.priceSlabs.length > 0 && (
            <QuantityGrid
              options={derived.qtyOptions}
              priceSlabs={product.priceSlabs}
              unit={product.unit}
              selectedQty={selectedQty}
              onSelect={setSelectedQty}
            />
          )}

          {/* Total Line */}
          {isDefault && (earn > 0 || discountPct > 0) && (
            <TotalLine earn={earn} discountPct={discountPct} savings={product.originalPrice && product.originalPrice > product.price ? product.originalPrice - product.price : 0} formatPrice={formatPrice} />
          )}

          {/* Actions */}
          {features.showActions && (
            <div className="mt-auto">
              <CardActions
                product={product}
                inCompare={actions.inCompare}
                isSaved={actions.isSaved}
                qty={selectedQty}
                onBuy={() => actions.handleBuyNow(selectedQty)}
                onRFQ={actions.handleRFQ}
                onChat={actions.handleChat}
                onSave={actions.handleSave}
                onCompare={actions.handleCompare}
                onReport={actions.handleReport}
                showReport={features.showReport}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

function QuantityGrid({
  options, priceSlabs, unit, selectedQty, onSelect,
}: {
  options: number[]
  priceSlabs: { minQty: number; maxQty: number | null; price: number }[]
  unit: string
  selectedQty?: number
  onSelect?: (qty: number) => void
}) {
  return (
    <div className="grid grid-cols-4 gap-0.5">
      {options.slice(0, 8).map((q) => {
        const slabPrice = getPriceForQty(priceSlabs, q)
        const basePrice = priceSlabs[0]?.price ?? 0
        const offPct = basePrice > slabPrice && basePrice > 0
          ? Math.round(((basePrice - slabPrice) / basePrice) * 100) : 0
        const isSelected = selectedQty === q
        return (
          <button
            key={q}
            type="button"
            onClick={() => onSelect?.(q)}
            className="p-1 rounded-md text-center transition-all cursor-pointer"
            style={{
              background: isSelected ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'var(--bg-elevated)',
              border: isSelected ? '1px solid color-mix(in srgb, var(--accent) 40%, transparent)' : '1px solid var(--border-color)',
            }}
            aria-pressed={isSelected}
            aria-label={`Quantity ${q} ${unit}`}
          >
            <div className="text-[10px] font-semibold" style={{ color: isSelected ? 'var(--accent-light)' : 'var(--text-primary)' }}>{q.toLocaleString('en-IN')}</div>
            <div className="text-[9px] leading-tight" style={{ color: 'var(--text-secondary)' }}>&#8377;{formatPrice(slabPrice)}</div>
            {offPct > 0 && (
              <div className="text-[8px] font-semibold leading-tight" style={{ color: 'var(--status-success)' }}>-{offPct}%</div>
            )}
          </button>
        )
      })}
    </div>
  )
}

function TotalLine({
  earn, discountPct, savings, formatPrice: fp,
}: {
  earn: number
  discountPct: number
  savings: number
  formatPrice: (n: number) => string
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px]" style={{ color: 'var(--text-secondary)' }}>
      {discountPct > 0 && savings > 0 && (
        <span style={{ color: 'var(--status-success)' }}>Save &#8377;{fp(savings)}</span>
      )}
      {earn > 0 && (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-medium"
          style={{ background: 'color-mix(in srgb, var(--accent-gold) 10%, transparent)', color: 'var(--accent-gold)', border: '1px solid color-mix(in srgb, var(--accent-gold) 25%, transparent)' }}>
          +{earn} GOCASH
        </span>
      )}
    </div>
  )
}
