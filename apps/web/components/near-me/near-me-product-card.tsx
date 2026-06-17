'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star, ShieldCheck, Zap, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DistanceBadge } from './distance-badge';
import type { NearMeProduct } from '@/lib/api/near-me';

interface NearMeProductCardProps {
  product: NearMeProduct;
  className?: string;
}

export function NearMeProductCard({ product, className }: NearMeProductCardProps) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn(
        'group block rounded-xl border border-border bg-surface p-4 shadow-sm transition-all hover:shadow-md dark:border-dark-border dark:bg-dark-surface',
        className,
      )}
    >
      <div className="flex gap-4">
        <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-surface-secondary dark:bg-dark-surface-secondary">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              sizes="96px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="h-8 w-8 text-text-tertiary" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-sm font-semibold text-text-primary group-hover:text-primary-600 dark:text-dark-text-primary dark:group-hover:text-primary-400">
              {product.name}
            </h3>
            <DistanceBadge
              distanceKm={product.distanceKm}
              distanceLabel={product.distanceLabel}
            />
          </div>

          {product.shortDescription && (
            <p className="mt-0.5 line-clamp-1 text-xs text-text-tertiary dark:text-dark-text-tertiary">
              {product.shortDescription}
            </p>
          )}

          <div className="mt-2 flex items-center gap-3">
            <span className="text-sm font-bold text-text-primary dark:text-dark-text-primary">
              {product.price != null ? `₹${product.price.toLocaleString()}` : 'Price on request'}
            </span>
            {product.unit && (
              <span className="text-xs text-text-tertiary dark:text-dark-text-tertiary">/ {product.unit}</span>
            )}
          </div>

          <div className="mt-1.5 flex items-center gap-2 text-xs text-text-secondary dark:text-dark-text-secondary">
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 text-amber-500" />
              {product.trustScore}
            </span>
            {product.isVerified && (
              <span className="flex items-center gap-0.5 text-green-600 dark:text-green-400">
                <ShieldCheck className="h-3 w-3" /> Verified
              </span>
            )}
            {product.isTradgo && (
              <span className="flex items-center gap-0.5 text-primary-600 dark:text-primary-400">
                <Zap className="h-3 w-3" /> TRADGO
              </span>
            )}
          </div>

          <div className="mt-1.5 flex items-center gap-2 text-xs text-text-tertiary dark:text-dark-text-tertiary">
            <span>{product.companyName}</span>
            {product.deliveryEta && (
              <>
                <span className="text-border dark:text-dark-border">|</span>
                <span>Delivery: {product.deliveryEta}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
