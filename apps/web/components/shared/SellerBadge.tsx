'use client'
import Link from 'next/link'
import { MapPin, Building2, Crown, Zap, Shield, CheckCircle2 } from 'lucide-react'
import { VerifiedBadge } from '@/components/shared/VerifiedBadge'

export interface SellerInfo {
  id?:             string
  name?:           string
  slug?:           string
  logo?:           string
  city?:           string
  state?:          string
  isVerified?:     boolean
  isTradgoElite?:  boolean
  trustScore?:     number
  yearsActive?:    number
  avgResponseTime?: string
  ordersFulfilled?: number
  gstVerified?:    boolean
}

export function resolveSellerInfo(product: any): SellerInfo {
  const s =
    product?.seller        ??
    product?.vendor        ??
    product?.company       ??
    product?.supplierInfo  ??
    {}

  const loc = s.locations?.[0] || {}

  return {
    id:             s.id        ?? s._id   ?? product?.vendorId ?? product?.sellerId,
    name:
      s.businessName           ??
      s.companyName            ??
      s.name                   ??
      s.tradeName              ??
      product?.companyName     ??
      product?.sellerName      ??
      product?.vendorName      ??
      'Verified Supplier',
    slug:           s.slug     ?? product?.companySlug ?? product?.company?.slug ?? undefined,
    logo:           s.logo     ?? s.logoUrl ?? s.profileImage,
    city:           loc.city   ?? s.city  ?? product?.city,
    state:          loc.state  ?? s.state ?? product?.state,
    isVerified:     s.isVerified      ?? s.kycVerified      ?? false,
    isTradgoElite:  s.isTradgoElite   ?? s.tradgoElite   ?? s.isElite ?? false,
    trustScore:     s.trustScore      ?? s.trust_score      ?? 0,
    yearsActive:    s.yearsActive     ?? s.yearsOnPlatform  ?? undefined,
    avgResponseTime: s.avgResponseTime ?? s.responseTime    ?? s.responseRate ? `< ${s.responseRate}` : undefined,
    ordersFulfilled: s.ordersFulfilled ?? s.ordersCount     ?? s.totalProducts ?? undefined,
    gstVerified:    s.gstVerified !== undefined ? !!s.gstVerified : !!s.gstNumber,
  }
}

type Size = 'xs' | 'sm' | 'md'

interface Props {
  seller:         SellerInfo
  size?:          Size
  showLocation?:  boolean
  showStats?:     boolean
  showLogo?:      boolean
  linkToProfile?: boolean
  className?:     string
}

export default function SellerBadge({
  seller,
  size          = 'sm',
  showLocation  = true,
  showStats     = false,
  showLogo      = true,
  linkToProfile = true,
  className     = '',
}: Props) {
  const sellerName = seller.name || 'Verified Supplier'
  const profileHref = seller.slug
    ? `/companies/${seller.slug}`
    : '#'

  const sizes = {
    xs: { text: 'text-[9px]', subtext: 'text-[8px]', icon: 9, logo: 'w-5 h-5 rounded-md text-[9px]', badge: 'text-[8px] px-1.5 py-0.5', gap: 'gap-1.5', padding: 'px-2 py-1' },
    sm: { text: 'text-[11px]', subtext: 'text-[9px]', icon: 11, logo: 'w-6 h-6 rounded-lg text-[10px]', badge: 'text-[9px] px-2 py-0.5', gap: 'gap-2', padding: 'px-2.5 py-1.5' },
    md: { text: 'text-xs', subtext: 'text-[10px]', icon: 13, logo: 'w-8 h-8 rounded-xl text-xs', badge: 'text-[10px] px-2.5 py-1', gap: 'gap-2.5', padding: 'px-3 py-2' },
  }

  const s = sizes[size]

  const inner = (
    <div
      className={`flex items-center ${s.gap} ${s.padding} rounded-xl w-fit max-w-full transition-all duration-200 ${linkToProfile ? 'cursor-pointer hover:border-[rgba(245, 158, 11, 0.35)] group' : ''} ${className}`}
      style={{
        background: 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(12px)',
        border: '1px solid var(--border-color)',
      }}
    >
      {showLogo && (
        <div
          className={`${s.logo} overflow-hidden flex-shrink-0 flex items-center justify-center font-black transition-colors duration-200`}
          style={{ background: 'rgba(0, 255, 255, 0.12)', border: '1px solid rgba(0, 255, 255, 0.2)', color: 'var(--accent)' }}
        >
          {seller.logo ? (
            <img src={seller.logo} alt={sellerName} className="w-full h-full object-cover" />
          ) : (
            sellerName[0]?.toUpperCase()
          )}
        </div>
      )}

      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center gap-1 flex-wrap">
          <Building2 size={s.icon} className="text-gray-400 flex-shrink-0" />
          <span className={`${s.text} font-bold text-gray-900 truncate ${linkToProfile ? 'group-hover:text-accent-500 transition-colors' : ''}`}>
            {sellerName}
          </span>

          {seller.isVerified && <VerifiedBadge type="verified" size={s.icon <= 10 ? 'sm' : 'md'} className="flex-shrink-0" />}

          {seller.isTradgoElite && (
            <span
              className={`flex items-center gap-0.5 font-bold rounded-full flex-shrink-0 ${s.badge}`}
              style={{ background: 'rgba(0,255,255,0.12)', border: '1px solid rgba(0,255,255,0.3)', color: 'var(--accent)' }}
            >
              <Crown size={s.icon - 2} />
              Elite
            </span>
          )}
        </div>

        {(showLocation || (!showLocation && !showStats)) && (seller.city || seller.state) && (
          <div className={`flex items-center gap-1 ${s.subtext} text-gray-400 mt-0.5`}>
            <MapPin size={s.icon - 2} className="flex-shrink-0 text-accent-500" />
            <span className="truncate">
              {[seller.city, seller.state].filter(Boolean).join(', ')}
            </span>
            {seller.yearsActive && (
              <>
                <span className="text-gray-300 mx-0.5">·</span>
                <span className="text-gray-400 flex-shrink-0">{seller.yearsActive} yrs</span>
              </>
            )}
          </div>
        )}

        {showStats && size === 'md' && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
            {seller.gstVerified && (
              <span className={`${s.subtext} flex items-center gap-0.5 text-green-400`}>
                <CheckCircle2 size={s.icon - 3} />
                GST
              </span>
            )}
            {seller.avgResponseTime && (
              <span className={`${s.subtext} flex items-center gap-0.5`} style={{ color: 'rgba(255,255,255,0.4)' }}>
                <Zap size={s.icon - 3} className="text-accent-500" />
                {seller.avgResponseTime}
              </span>
            )}
            {seller.ordersFulfilled && seller.ordersFulfilled > 0 && (
              <span className={`${s.subtext} text-gray-400`}>
                {seller.ordersFulfilled >= 1000
                  ? `${(seller.ordersFulfilled / 1000).toFixed(1)}K`
                  : seller.ordersFulfilled}+ orders
              </span>
            )}
            {seller.trustScore && seller.trustScore >= 60 && (
              <span className={`${s.subtext} flex items-center gap-0.5 text-gray-400`}>
                <Shield size={s.icon - 3} className="text-green-400" />
                {seller.trustScore}/100
              </span>
            )}
            {seller.yearsActive && (
              <span className={`${s.subtext} text-gray-400`}>{seller.yearsActive} yrs active</span>
            )}
          </div>
        )}

        {showStats && size === 'md' && !!seller.trustScore && (
          <div className="mt-1.5 flex items-center gap-1.5 w-full max-w-[200px]">
            <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.95)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(seller.trustScore, 100)}%`,
                  background: seller.trustScore >= 80 ? '#4ade80' : seller.trustScore >= 60 ? '#F2C94C' : '#f87171',
                }}
              />
            </div>
            <span className="text-[8px] text-gray-300 flex-shrink-0">{seller.trustScore}/100</span>
          </div>
        )}
      </div>
    </div>
  )

  if (linkToProfile && profileHref !== '#') {
    return (
      <Link href={profileHref} onClick={e => e.stopPropagation()}>
        {inner}
      </Link>
    )
  }

  return inner
}
