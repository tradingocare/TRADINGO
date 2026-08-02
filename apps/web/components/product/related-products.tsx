'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard, ProductCardSkeleton } from '@/components/product/product-card';
import { fromProductCardData } from '@/components/product/card-converters';
import type { ProductCardData } from '@/types/product-card';

const GLASS = 'var(--bg-elevated)';
const BORDER = '1px solid var(--border-color)';

interface RelatedProductsProps {
  products: ProductCardData[];
  title: string;
  viewAllHref?: string;
  loading?: boolean;
}

export function RelatedProducts({
  products,
  title,
  viewAllHref,
  loading,
}: RelatedProductsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({
      left: dir === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  const shimmer = 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent'

  if (loading) {
    return (
      <section>
        <div className={`mb-4 h-6 w-48 rounded-2xl ${shimmer} bg-surface`} />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="min-w-[280px] flex-1">
              <ProductCardSkeleton />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-text-primary">{title}</h3>
        {viewAllHref && (
          <Link href={viewAllHref} className="text-sm font-semibold transition-colors text-accent">
            View All →
          </Link>
        )}
      </div>

      <div className="group relative">
        <div ref={scrollRef} className="flex gap-4 overflow-x-auto scroll-smooth pb-2" style={{ scrollbarWidth: 'none' }}>
          {products.map((product) => (
            <div key={product._id || product.id} className="min-w-[280px] max-w-[320px] flex-shrink-0">
              <ProductCard product={fromProductCardData(product)} variant="compact" />
            </div>
          ))}
        </div>

        {products.length > 2 && (
          <>
            <button onClick={() => scroll('left')}
              className="absolute -left-3 top-1/2 -translate-y-1/2 rounded-full p-2 shadow-md opacity-0 transition-all hover:scale-105 group-hover:opacity-100"
              style={{ background: GLASS, border: BORDER, color: 'var(--text-secondary)' }} aria-label="Scroll left">
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => scroll('right')}
              className="absolute -right-3 top-1/2 -translate-y-1/2 rounded-full p-2 shadow-md opacity-0 transition-all hover:scale-105 group-hover:opacity-100"
              style={{ background: GLASS, border: BORDER, color: 'var(--text-secondary)' }} aria-label="Scroll right">
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>
    </section>
  );
}
