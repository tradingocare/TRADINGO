'use client';

import Link from 'next/link';
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  CreditCard,
  Flag,
  Hash,
  HeadphonesIcon,
  Mail,
  Phone,
  RefreshCw,
  Shield,
  Smartphone,
  Sparkles,
  Star,
  Truck,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProductDetailViewData } from '@/types/product-detail-view';

export function RatingStars({ rating, size = 'md' }: { rating: number; size?: 'xs' | 'sm' | 'md' | 'lg' }) {
  const cls = size === 'lg' ? 'h-5 w-5' : size === 'sm' ? 'h-3.5 w-3.5' : size === 'xs' ? 'h-2.5 w-2.5' : 'h-4 w-4';
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            cls,
            star <= Math.round(rating) ? 'fill-accent text-accent' : 'fill-none text-accent/30',
          )}
        />
      ))}
    </span>
  );
}

interface AiRecommendationBarProps {
  data: ProductDetailViewData;
  onChat: () => void;
}

export function AiRecommendationBar({ data, onChat }: AiRecommendationBarProps) {
  const trustScore = data.seller.trustScore || 0;
  const label = trustScore >= 85 ? 'Highly Recommended' : trustScore >= 65 ? 'Recommended' : 'Good Fit';
  const rating = data.rating ?? (trustScore ? Math.min(5, Math.max(3.8, trustScore / 20)) : 4.7);
  const stats = data.stats;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-accent/25 bg-gradient-to-r from-accent/10 via-surface to-surface p-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent-amber/25 bg-accent-amber/10 text-accent-amber">
          <Sparkles size={17} />
        </div>
        <div>
          <p className="inline-flex items-center gap-1.5 text-sm font-bold text-text-primary">
            <Star size={13} className="fill-accent text-accent" />
            {label}
          </p>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-text-secondary">
            {data.seller.verified && 'Platform-verified supplier. '}
            {stats?.onTimeDelivery && `Consistent ${stats.onTimeDelivery.toLowerCase()} delivery. `}
            {stats?.responseRate && `${stats.responseRate} response rate. `}
            Trusted by {stats?.happyBuyers || 'buyers'} across the marketplace.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-2xl font-black text-text-primary">{rating.toFixed(1)}</span>
        <div>
          <RatingStars rating={rating} />
          <p className="mt-0.5 text-[11px] text-text-tertiary">
            {data.reviewCount ? `${data.reviewCount} reviews` : 'Buyer rating'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 lg:min-w-[340px]">
        <div className="rounded-xl border border-border bg-bg-elevated px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-text-tertiary">On-Time Delivery</p>
          <p className="mt-0.5 text-sm font-bold text-text-primary">{stats?.onTimeDelivery || '—'}</p>
        </div>
        <div className="rounded-xl border border-border bg-bg-elevated px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-text-tertiary">Response Rate</p>
          <p className="mt-0.5 text-sm font-bold text-text-primary">{stats?.responseRate || '—'}</p>
        </div>
        <div className="rounded-xl border border-border bg-bg-elevated px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-text-tertiary">Happy Buyers</p>
          <p className="mt-0.5 text-sm font-bold text-text-primary">{stats?.happyBuyers || '—'}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onChat}
        className="rounded-xl border border-accent/40 bg-accent/10 px-4 py-2 text-sm font-bold text-accent transition-all hover:bg-accent/20"
      >
        Chat with Seller
      </button>
    </div>
  );
}

interface StatStripProps {
  data: ProductDetailViewData;
}

export function StatStrip({ data }: StatStripProps) {
  const stats = data.stats;
  const statItems = [
    { label: 'Products Listed', value: data.seller.productsListed != null ? String(data.seller.productsListed) : '—' },
    { label: 'Happy Buyers', value: stats?.happyBuyers || '—' },
    { label: 'On-Time Delivery', value: stats?.onTimeDelivery || '—' },
    { label: 'Buyer Rating', value: data.rating ? `${data.rating.toFixed(1)} / 5` : 'New Listing' },
    { label: 'Customer Support', value: '24/7' },
    { label: 'Easy Returns', value: data.returnPolicy || 'Policy on request' },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
      {statItems.map((item) => (
        <div key={item.label} className="rounded-xl border border-border bg-surface px-4 py-3 text-center">
          <p className="text-sm font-bold text-text-primary">{item.value}</p>
          <p className="mt-0.5 text-[11px] text-text-tertiary">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

interface InfoCardsProps {
  data: ProductDetailViewData;
  onChat: () => void;
}

export function InfoCards({ data, onChat }: InfoCardsProps) {
  const coverage = data.freeDeliveryAbove
    ? `Free above ₹${data.freeDeliveryAbove.toLocaleString('en-IN')}`
    : 'Pan India';

  return (
    <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent/25 bg-accent/10 text-accent">
            <Truck size={15} />
          </div>
          <p className="text-sm font-bold text-text-primary">Shipping &amp; Delivery</p>
        </div>
        <p className="mt-3 text-xs text-text-secondary">{coverage}</p>
        <p className="mt-1 text-xs text-text-secondary">
          Est. delivery: <span className="font-semibold text-text-primary">{data.leadTime || 'On request'}</span>
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent/25 bg-accent/10 text-accent">
            <Wallet size={15} />
          </div>
          <p className="text-sm font-bold text-text-primary">Payment Options</p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { icon: Smartphone, label: 'UPI' },
            { icon: CreditCard, label: 'Cards' },
            { icon: Wallet, label: 'TradePay' },
            { icon: Building2, label: 'NetBanking' },
          ].map(({ icon: Icon, label }) => (
            <span key={label} className="inline-flex items-center gap-1 rounded-lg border border-border bg-bg-elevated px-2 py-1 text-[11px] font-medium text-text-secondary">
              <Icon size={11} className="text-accent" />
              {label}
            </span>
          ))}
        </div>
        {data.securePayments && (
          <p className="mt-2 flex items-center gap-1 text-[11px] text-status-success">
            <Shield size={11} /> Escrow-backed secure payments
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent/25 bg-accent/10 text-accent">
            <RefreshCw size={15} />
          </div>
          <p className="text-sm font-bold text-text-primary">Returns &amp; Warranty</p>
        </div>
        <p className="mt-3 text-xs text-text-secondary">{data.returnPolicy || 'Return policy available on request'}</p>
        <p className="mt-1 text-xs text-text-secondary">
          Warranty: <span className="font-semibold text-text-primary">{data.warranty || 'As per terms'}</span>
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent/25 bg-accent/10 text-accent">
            <HeadphonesIcon size={15} />
          </div>
          <p className="text-sm font-bold text-text-primary">Need Help</p>
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-text-secondary">
          <Phone size={11} className="text-accent" />
          {data.supportPhone || '+91 78277 28852'}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-text-secondary">
          <Mail size={11} className="text-accent" />
          {data.supportEmail || 'support@tradingo.com'}
        </p>
        <button
          type="button"
          onClick={onChat}
          className="mt-3 w-full rounded-xl border border-accent/40 bg-accent/10 py-2 text-xs font-bold text-accent transition-all hover:bg-accent/20"
        >
          Chat Now
        </button>
      </div>
    </div>
  );
}

interface MetaRowProps {
  data: ProductDetailViewData;
}

export function MetaRow({ data }: MetaRowProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-4 text-xs text-text-tertiary">
      <span className="inline-flex items-center gap-1.5">
        <CalendarDays size={12} className="text-accent" />
        Listed on {data.listedDate || '—'}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Hash size={12} className="text-accent" />
        Product ID: {data.productId}
      </span>
      <Link
        href={`mailto:${data.supportEmail || 'support@tradingo.com'}?subject=${encodeURIComponent(`Report listing ${data.productId}`)}`}
        className="inline-flex items-center gap-1.5 text-status-error transition-colors hover:underline"
      >
        <Flag size={12} />
        Report this listing
      </Link>
    </div>
  );
}

export function TrustBadge({ icon: Icon, label, className }: {
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  label: string;
  className?: string;
}) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold',
      className,
    )}>
      <Icon size={11} />
      {label}
    </span>
  );
}

const GRADIENT_BORDER = 'linear-gradient(90deg, #FF4D00, #F59E0B, #3D8BFF, #9B5DE5)';

export function AiTrustGrid({ data }: { data: ProductDetailViewData }) {
  const trustScore = data.seller.trustScore || 0;
  const aiScore = data.rating ?? (trustScore ? Math.min(5, Math.max(3.8, trustScore / 20)) : 4.7);
  const label = aiScore >= 4.5 ? 'Highly Recommended' : aiScore >= 4 ? 'Recommended' : 'Good Fit';
  const stats = data.stats;
  const seller = data.seller;

  return (
    <div className="space-y-3">
      <div className="rounded-2xl p-[1.5px]" style={{ background: GRADIENT_BORDER }}>
        <div className="flex items-center gap-x-2.5 overflow-x-auto no-scrollbar rounded-[14px] bg-surface px-3 py-1.5">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-accent-amber/25 bg-accent-amber/10 text-accent-amber">
            <Sparkles size={12} />
          </div>
          <p className="shrink-0 text-[9px] font-bold uppercase tracking-wider text-text-tertiary">AI Recommendation</p>
          <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
            <span className="text-xs font-black leading-none text-text-primary">
              {aiScore.toFixed(1)}
              <span className="text-[8px] font-semibold text-text-tertiary">/5</span>
            </span>
            <RatingStars rating={aiScore} size="xs" />
            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-accent">
              <Star size={9} className="fill-accent" /> {label}
            </span>
          </span>
        </div>
      </div>

      <div className="rounded-2xl p-[1.5px]" style={{ background: GRADIENT_BORDER }}>
        <div className="flex items-center gap-x-2.5 overflow-x-auto no-scrollbar rounded-[14px] bg-surface px-3 py-1.5">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-accent/25 bg-accent/10 text-accent">
            <Shield size={12} />
          </div>
          <p className="shrink-0 text-[9px] font-bold uppercase tracking-wider text-text-tertiary">Trust Stats</p>
          <dl className="flex items-center gap-x-2.5 text-[10px]">
            <div className="flex items-center gap-1 whitespace-nowrap">
              <dt className="text-text-tertiary">On-Time</dt>
              <dd className="font-semibold text-text-primary">{stats?.onTimeDelivery || '—'}</dd>
            </div>
            <div className="flex items-center gap-1 whitespace-nowrap">
              <dt className="text-text-tertiary">Response</dt>
              <dd className="font-semibold text-text-primary">{stats?.responseRate || '—'}</dd>
            </div>
            <div className="flex items-center gap-1 whitespace-nowrap">
              <dt className="text-text-tertiary">Buyers</dt>
              <dd className="font-semibold text-text-primary">{stats?.happyBuyers || '—'}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="rounded-2xl p-[1.5px]" style={{ background: GRADIENT_BORDER }}>
        <div className="flex items-center gap-x-2.5 overflow-x-auto no-scrollbar rounded-[14px] bg-surface px-3 py-1.5">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-status-success/25 bg-status-success/10 text-status-success">
            <Building2 size={12} />
          </div>
          <p className="shrink-0 text-[9px] font-bold uppercase tracking-wider text-text-tertiary">Seller Info</p>
          <ul className="flex items-center gap-x-2 text-[9px]">
            <li className="flex items-center gap-1 whitespace-nowrap">
              <span className="text-text-tertiary">Products</span>
              <span className="font-semibold text-text-primary">{seller.productsListed != null ? seller.productsListed : '—'}</span>
            </li>
            <li className="flex items-center gap-1 whitespace-nowrap">
              <span className="text-text-tertiary">Rating</span>
              <span className="font-semibold text-text-primary">{data.rating ? `${data.rating.toFixed(1)} ★` : 'New Listing'}</span>
            </li>
            <li className="flex items-center gap-1 whitespace-nowrap">
              <span className="text-text-tertiary">Experience</span>
              <span className="font-semibold text-text-primary">{seller.yearsInBusiness ? `${seller.yearsInBusiness}+ yrs` : '—'}</span>
            </li>
          </ul>
          {seller.verified && (
            <p className="inline-flex items-center gap-1 shrink-0 text-[9px] font-semibold whitespace-nowrap text-status-success">
              <BadgeCheck size={9} /> Platform Verified
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function VerifiedBadgeRow({ data, compact = false, hideRating = false }: { data: ProductDetailViewData; compact?: boolean; hideRating?: boolean }) {
  const { seller } = data;
  return (
    <div className={cn('flex flex-wrap items-center', compact ? 'gap-1.5' : 'gap-2')}>
      {seller.verified && (
        <TrustBadge icon={BadgeCheck} label="Verified" className="border-status-success/20 bg-status-success/10 text-status-success" />
      )}
      {seller.elite && (
        <TrustBadge icon={Star} label="Elite Seller" className="border-accent-amber/25 bg-accent-amber/10 text-accent-amber" />
      )}
      {seller.gstVerified && (
        <TrustBadge icon={BadgeCheck} label="GST Verified" className="border-status-success/20 bg-status-success/10 text-status-success" />
      )}
      {seller.isoCertified && (
        <TrustBadge icon={Shield} label="ISO Certified" className="border-accent-amber/25 bg-accent-amber/10 text-accent-amber" />
      )}
      {(seller.trustScore ?? 0) > 0 && (
        <TrustBadge icon={BadgeCheck} label={`Trust Score ${seller.trustScore}`} className="border-accent/25 bg-accent/10 text-accent" />
      )}
      {!hideRating && (data.rating != null || data.reviewCount != null) && (
        <span className={cn('inline-flex items-center text-text-secondary', compact ? 'gap-1 text-[10px]' : 'gap-1.5 text-xs')}>
          <RatingStars rating={data.rating || 0} size={compact ? 'xs' : 'sm'} />
          <span className="font-semibold text-text-primary">{data.rating ? data.rating.toFixed(1) : '—'}</span>
          {data.reviewCount != null && <span className="text-text-tertiary">({data.reviewCount})</span>}
        </span>
      )}
    </div>
  );
}
