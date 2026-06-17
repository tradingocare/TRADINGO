'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star, ShieldCheck, Zap, Package } from 'lucide-react';
import type { NearMeProduct } from '@/lib/api/near-me';

interface MarkerPopupProps {
  product: NearMeProduct;
}

export function MarkerPopup({ product }: MarkerPopupProps) {
  return (
    <div className="min-w-[220px] max-w-[260px]" role="dialog" aria-label={`Product: ${product.name}`}>
      <div className="relative h-28 w-full overflow-hidden rounded-t-md bg-surface-secondary dark:bg-dark-surface-secondary">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="260px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-8 w-8 text-text-tertiary" />
          </div>
        )}
      </div>

      <div className="p-2.5 space-y-1.5">
        <h3 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary leading-tight line-clamp-2">
          {product.name}
        </h3>

        <p className="text-xs text-text-secondary dark:text-dark-text-secondary truncate">
          {product.companyName}
        </p>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-text-primary dark:text-dark-text-primary">
            {product.price != null ? `₹${product.price.toLocaleString()}` : 'Price on request'}
          </span>
          <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
            <Star className="h-3 w-3" aria-hidden="true" />
            <span>{product.trustScore}</span>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {product.isVerified && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 text-[10px] font-medium text-green-700 dark:text-green-400">
              <ShieldCheck className="h-2.5 w-2.5" aria-hidden="true" />
              Verified
            </span>
          )}
          {product.isTradgo && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-primary-50 dark:bg-primary-900/20 px-1.5 py-0.5 text-[10px] font-medium text-primary-700 dark:text-primary-400">
              <Zap className="h-2.5 w-2.5" aria-hidden="true" />
              TRADGO
            </span>
          )}
          <span className="text-[10px] text-text-tertiary dark:text-dark-text-tertiary">
            MOQ: {product.moq}
          </span>
        </div>

        {product.deliveryEta && (
          <p className="text-[10px] text-text-tertiary dark:text-dark-text-tertiary">
            Delivery: {product.deliveryEta}
          </p>
        )}

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] font-medium text-primary dark:text-primary-dark">
            {product.distanceLabel}
          </span>
          <Link
            href={`/products/${product.slug}`}
            className="rounded-md bg-primary dark:bg-primary-dark px-2.5 py-1 text-[11px] font-medium text-white hover:opacity-90 transition-opacity"
            aria-label={`View ${product.name}`}
          >
            View Product
          </Link>
        </div>
      </div>
    </div>
  );
}
