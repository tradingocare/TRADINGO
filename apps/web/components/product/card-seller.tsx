'use client'

import { Building2, CalendarDays, Receipt, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { VerifiedBadge } from '@/components/shared/VerifiedBadge'
import type { ProductCardSeller } from '@/types/product-card'

interface CardSellerProps {
  seller: ProductCardSeller
  showLocation?: boolean
  showChips?: boolean
}

export function CardSeller({ seller, showLocation = false, showChips = false }: CardSellerProps) {
  return (
    <div>
      <div className="flex items-center gap-1.5">
        <Building2 size={11} className="text-text-tertiary" />
        {seller.slug ? (
          <Link
            href={`/companies/${seller.slug}`}
            className="text-[10px] font-medium truncate hover:text-accent transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            {seller.name || 'Verified Supplier'}
          </Link>
        ) : (
          <span className="text-[10px] font-medium truncate" style={{ color: 'var(--text-secondary)' }}>
            {seller.name || 'Verified Supplier'}
          </span>
        )}
        {seller.isVerified && <VerifiedBadge type="verified" showLabel={false} size="sm" />}
        {seller.isTradgoElite && (
          <span className="text-[8px] font-bold px-1 py-0.5 rounded"
            style={{ background: 'color-mix(in srgb, var(--accent-gold) 15%, transparent)', color: 'var(--accent-gold)' }}>
            ELITE
          </span>
        )}
      </div>
      {showChips && (seller.yearsActive || seller.isGstRegistered || seller.isoCertified) && (
        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
          {!!seller.yearsActive && (
            <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-medium"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-tertiary)', border: '1px solid var(--border-color)' }}>
              <CalendarDays size={9} /> {seller.yearsActive}+ yrs
            </span>
          )}
          {seller.isGstRegistered && (
            <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-medium"
              style={{ background: 'color-mix(in srgb, var(--accent) 8%, transparent)', color: 'var(--accent-light)', border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)' }}>
              <Receipt size={9} /> GST
            </span>
          )}
          {seller.isoCertified && (
            <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-medium"
              style={{ background: 'color-mix(in srgb, var(--status-success) 8%, transparent)', color: 'var(--status-success)', border: '1px solid color-mix(in srgb, var(--status-success) 25%, transparent)' }}>
              <ShieldCheck size={9} /> ISO
            </span>
          )}
        </div>
      )}
    </div>
  )
}
