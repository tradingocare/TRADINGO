'use client';

import { Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImageGallery } from '@/components/product/image-gallery';
import { DiscountBadge } from '@/components/product/product-hero-price';
import type { ProductDetailMedia } from '@/types/product-detail';

interface ProductGalleryProps {
  media: ProductDetailMedia[];
  productName: string;
  discountPct: number;
  isWishlisted: boolean;
  onWishlist: () => void;
  compact?: boolean;
}

export function ProductGallery({ media, productName, discountPct, isWishlisted, onWishlist, compact = false }: ProductGalleryProps) {
  const images = media.filter((m) => m.type === 'IMAGE');

  return (
    <div className="relative">
      <div className="relative">
        {discountPct > 0 && <DiscountBadge discountPct={discountPct} />}
        <button
          type="button"
          onClick={onWishlist}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
          className="absolute right-3 top-3 z-10 rounded-full border border-border bg-bg-base/75 p-2 text-text-primary backdrop-blur-md transition-colors hover:bg-bg-elevated"
        >
          <Bookmark size={16} className={cn(isWishlisted && 'fill-current text-accent')} />
        </button>
        <ImageGallery media={media} productName={productName} compact={compact} />
      </div>
      {images.length > 5 && (
        <span className="pointer-events-none absolute bottom-3 right-3 z-10 rounded-full border border-border bg-bg-base/85 px-2.5 py-1 text-[11px] font-semibold text-text-secondary backdrop-blur-md">
          +{images.length - 5} more
        </span>
      )}
    </div>
  );
}
