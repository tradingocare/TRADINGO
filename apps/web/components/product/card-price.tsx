'use client'

interface CardPriceProps {
  price: number
  originalPrice?: number
  unit: string
  discountPct: number
  showDiscountPct?: boolean
  showSavings?: boolean
  priceSlabs?: { minQty: number; maxQty: number | null; price: number }[]
}

export function CardPrice({
  price, originalPrice, unit, discountPct,
  showDiscountPct = true, showSavings = true, priceSlabs,
}: CardPriceProps) {
  const savings = originalPrice && originalPrice > price ? originalPrice - price : 0
  const hasTiers = !!priceSlabs && priceSlabs.length > 1

  return (
    <div className="flex items-baseline gap-1.5 flex-wrap">
      <span className="text-sm font-black leading-none" style={{ color: 'var(--text-primary)' }}>
        &#8377;{price.toLocaleString('en-IN')}
      </span>
      {discountPct > 0 && (
        <>
          <span className="text-[10px] line-through" style={{ color: 'var(--text-muted)' }}>
            &#8377;{(originalPrice ?? 0).toLocaleString('en-IN')}
          </span>
          {showDiscountPct && (
            <span className="text-[9px] font-bold text-status-error">-{discountPct}%</span>
          )}
          {showSavings && savings > 0 && (
            <span className="text-[9px] text-status-success">Save &#8377;{savings.toLocaleString('en-IN')}</span>
          )}
        </>
      )}
      <span className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>/ {unit}</span>
      {hasTiers && (
        <span className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>
          &#183; tiers {priceSlabs![0].minQty}&ndash;{priceSlabs![priceSlabs!.length - 1].maxQty ?? '\u221E'} {unit}
        </span>
      )}
    </div>
  )
}
