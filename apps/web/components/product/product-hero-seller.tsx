'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin, Clock3, BadgeCheck, Award, Building2 } from 'lucide-react';
import { VerifiedBadge } from '@/components/shared/VerifiedBadge';

const sellerEase = [0.25, 0.1, 0.25, 1] as [number, number, number, number];

interface ProductHeroSellerCompany {
  name?: string;
  slug?: string;
  logo?: string;
  responseRate?: number;
  city?: string;
  state?: string;
  trustScore?: number;
}

interface ProductHeroSellerProps {
  company: ProductHeroSellerCompany;
  sellerName: string;
  sellerSlug: string;
  sellerLogo?: string;
  isVerified: boolean;
  hasGst: boolean;
  trustScore: number;
  isTradgoElite?: boolean;
  hasLocation?: boolean;
  rating?: number;
  reviewCount?: number;
  responseRate?: number;
  yearsActive?: number;
}

export function ProductHeroSeller({
  company,
  sellerName,
  sellerSlug,
  sellerLogo,
  isVerified,
  hasGst,
  trustScore,
  isTradgoElite,
  hasLocation,
  rating,
  reviewCount,
  responseRate,
  yearsActive,
}: ProductHeroSellerProps) {
  void trustScore;
  void rating;
  void reviewCount;
  void responseRate;
  const locationParts = [company?.city, company?.state].filter(Boolean);
  const locationText = locationParts.length > 0 ? locationParts.join(', ') : (hasLocation ? 'Location verified' : 'Pan India');
  const sellerYears = yearsActive ? `${yearsActive}+ Years` : 'Established';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15, ease: sellerEase }}
      className="rounded-2xl border border-border bg-surface/95 px-3 py-3 shadow-sm"
    >
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <Link
          href={`/companies/${company?.slug || sellerSlug}`}
          className="flex min-w-0 flex-1 items-center gap-3"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-bg-elevated text-sm font-black text-accent">
            {company?.logo || sellerLogo ? (
              <img
                src={company?.logo || sellerLogo || ''}
                alt={company?.name || sellerName}
                className="h-full w-full object-cover"
                onError={(event) => { (event.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <Building2 size={18} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-bold text-text-primary">
                {company?.name || sellerName || 'Verified Supplier'}
              </h3>
              {isVerified && <VerifiedBadge type="verified" size="sm" />}
              {isTradgoElite && (
                <span className="inline-flex items-center gap-1 rounded-full border border-accent-amber/20 bg-accent-amber/10 px-2 py-0.5 text-[11px] font-semibold text-accent-amber">
                  <Award size={11} />
                  Elite Seller
                </span>
              )}
              {hasGst && (
                <span className="inline-flex items-center gap-1 rounded-full border border-status-success/20 bg-status-success/10 px-2 py-0.5 text-[11px] font-semibold text-status-success">
                  <BadgeCheck size={11} />
                  GST
                </span>
              )}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-secondary">
              <span className="inline-flex items-center gap-1">
                <MapPin size={11} className="text-accent" />
                {locationText}
              </span>
              {sellerYears && (
                <>
                  <span className="text-text-tertiary">•</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock3 size={11} className="text-accent-amber" />
                    {sellerYears}
                  </span>
                </>
              )}
            </div>
          </div>
        </Link>

        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
          <div className="rounded-xl border border-border bg-bg-elevated px-3 py-2 text-left">
            <p className="text-[11px] uppercase tracking-[0.22em] text-text-tertiary">Years in Business</p>
            <p className="mt-0.5 text-sm font-bold text-text-primary">
              {sellerYears}
            </p>
            {yearsActive != null && (
              <p className="flex items-center gap-1 text-xs text-text-secondary">
                <Clock3 size={11} className="text-accent-amber" />
                In Business
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
