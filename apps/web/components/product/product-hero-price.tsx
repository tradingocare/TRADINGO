'use client';

import { motion } from 'framer-motion';
import { IndianRupee, CircleDollarSign, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProductDetailPriceSlab } from '@/types/product-detail';

interface ProductHeroPriceProps {
  price: number;
  originalPrice?: number;
  unit?: string;
}

function gocashEarn(price: number) {
  return Math.max(100, Math.floor(price / 1000) * 100);
}

export function gocashFromPrice(price: number): number {
  return gocashEarn(price);
}

export function ProductHeroPrice({
  price,
  originalPrice,
  unit,
}: ProductHeroPriceProps) {
  const discountPct = originalPrice && originalPrice > price
    ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
  const savings = originalPrice && originalPrice > price ? originalPrice - price : 0;

  const priceEaseOut = [0.25, 0.1, 0.25, 1] as [number, number, number, number];
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1, ease: priceEaseOut }}
      className="space-y-3"
    >
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="flex items-baseline gap-1 whitespace-nowrap">
          <span className="text-base font-semibold leading-none text-accent">₹</span>
          <span className="text-2xl font-semibold leading-none tracking-tight text-text-primary lg:text-3xl">
            {price.toLocaleString('en-IN')}
          </span>
          <span className="text-xs font-medium text-text-secondary">/ {unit || 'unit'}</span>
        </span>
      </div>

      {(originalPrice && originalPrice > price) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-sm text-text-tertiary line-through">
            ₹{originalPrice.toLocaleString('en-IN')}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-status-error/20 bg-status-error/10 px-2.5 py-1 text-xs font-bold text-status-error">
            <TrendingDown size={11} /> -{discountPct}% OFF
          </span>
          {savings > 0 && (
            <span className="flex items-center gap-1.5 text-sm font-medium text-status-success">
              <CircleDollarSign size={14} /> You Save ₹{savings.toLocaleString('en-IN')}
            </span>
          )}
        </div>
      )}

      {!originalPrice && savings > 0 && (
        <p className="flex items-center gap-1.5 text-sm font-medium text-status-success">
          <CircleDollarSign size={14} /> You Save ₹{savings.toLocaleString('en-IN')}
        </p>
      )}
    </motion.div>
  );
}

interface VolumePricingLadderProps {
  priceSlabs: ProductDetailPriceSlab[];
  maxSlabPrice: number;
  lowestPrice?: number;
  unit?: string;
}

export function VolumePricingLadder({ priceSlabs, maxSlabPrice, lowestPrice, unit }: VolumePricingLadderProps) {
  if (!priceSlabs || priceSlabs.length <= 1) return null;

  const priceEase = [0.25, 0.1, 0.25, 1] as [number, number, number, number];
  const slabStagger = { animate: { transition: { staggerChildren: 0.04 } } };
  const slabItem = {
    initial: { opacity: 0, x: -8 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: priceEase } },
  };

  const gradientBorder = 'linear-gradient(90deg, #FF4D00, #F59E0B, #3D8BFF, #9B5DE5)';

  return (
    <div className="mt-5 pt-5 border-t border-border">
      <p className="mb-3 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Volume Pricing</p>
      <div className="rounded-2xl p-[1.5px]" style={{ background: gradientBorder }}>
        <div className="rounded-[14px] bg-surface px-2 py-2">
          <motion.div className="space-y-1" variants={slabStagger} initial="initial" animate="animate">
            {priceSlabs.map((slab) => {
              const discountFromBest = lowestPrice ? Math.round(((slab.price - lowestPrice) / lowestPrice) * 100) : 0;
              const isBest = slab.price === lowestPrice;
              return (
                <motion.div key={slab.id} variants={slabItem}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-2.5 py-1.5',
                    isBest ? 'bg-accent/10 border border-accent/25' : 'bg-bg-elevated border border-border',
                  )}
                >
                  <span className="inline-flex items-center whitespace-nowrap rounded-md border border-border bg-surface px-1.5 py-0.5 text-[10px] font-bold text-text-secondary">
                    {slab.minQty}{slab.maxQty ? `-${slab.maxQty}` : '+'}
                  </span>
                  <span className="flex-1" />
                  <span className={cn('text-xs font-bold whitespace-nowrap', isBest ? 'text-accent' : 'text-text-primary')}>
                    <IndianRupee size={10} className="inline" />
                    {slab.price.toLocaleString('en-IN')}
                    <span className="text-text-tertiary font-normal">/{unit || 'unit'}</span>
                  </span>
                  {discountFromBest > 0 && (
                    <span className="inline-flex items-center whitespace-nowrap rounded-md border border-status-success/25 bg-status-success/10 px-1.5 py-0.5 text-[10px] font-bold text-status-success">
                      -{discountFromBest}%
                    </span>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

interface DiscountBadgeProps {
  discountPct: number;
}

export function DiscountBadge({ discountPct }: DiscountBadgeProps) {
  if (discountPct <= 0) return null;
  return (
    <div className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full border border-status-error/20 bg-surface/95 px-3 py-1.5 text-xs font-bold text-status-error shadow-lg backdrop-blur-md">
      <TrendingDown size={12} /> -{discountPct}% OFF
    </div>
  );
}
