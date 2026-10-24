'use client'

import { Building2, CalendarDays, Factory, MapPin, Receipt, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { VerifiedBadge } from '@/components/shared/VerifiedBadge'
import type { ProductCardSeller } from '@/types/product-card'

interface CardSellerProps {
  seller: ProductCardSeller
  showLocation?: boolean
  showChips?: boolean
}

function getBusinessTypeIcon(type?: string) {
  switch (type?.toLowerCase()) {
    case 'manufacturer':
      return Factory
    default:
      return Building2
  }
}

export function CardSeller({ seller, showLocation = false, showChips = false }: CardSellerProps) {
  const BusinessIcon = getBusinessTypeIcon(seller.businessType)

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
        {seller.isVerified && (
          <span className="inline-flex items-center gap-0.5 shrink-0">
            <VerifiedBadge type="verified" showLabel={false} size="sm" />
            <span className="text-[9px] font-semibold text-status-success">Seller Verified</span>
          </span>
        )}
        {seller.isTradgoElite && (
          <span className="text-[8px] font-bold px-1 py-0.5 rounded"
            style={{ background: 'color-mix(in srgb, var(--accent-gold) 15%, transparent)', color: 'var(--accent-gold)' }}>
            ELITE
          </span>
        )}
      </div>
      {(showLocation || seller.businessType) && (
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {seller.businessType && (
            <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-medium"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-tertiary)', border: '1px solid var(--border-color)' }}>
              <BusinessIcon size={9} /> {seller.businessType}
            </span>
          )}
          {showLocation && seller.city && (
            <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-medium"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-tertiary)', border: '1px solid var(--border-color)' }}>
              <MapPin size={9} /> {seller.city}
            </span>
          )}
          {showChips && (seller.yearsActive || seller.isGstRegistered || seller.isoCertified) && (
            <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-medium"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-tertiary)', border: '1px solid var(--border-color)' }}>
              {seller.yearsActive && (
                <>
                  <CalendarDays size={9} /> {seller.yearsActive}+ yrs
                </>
              )}
              {seller.isGstRegistered && (
                <>
                  <Receipt size={9} /> GST
                </>
              )}
              {seller.isoCertified && (
                <>
                  <ShieldCheck size={9} /> ISO
                </>
              )}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
