'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import ProductCard, { type ProductCardData } from '@/components/product/product-card';

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

  if (loading) {
    return (
      <section>
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="min-w-[280px] flex-1">
              <Skeleton className="aspect-square w-full rounded-xl" />
              <Skeleton className="mt-3 h-4 w-3/4" />
              <Skeleton className="mt-1 h-5 w-1/3" />
              <Skeleton className="mt-1 h-3 w-1/2" />
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
        <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">
          {title}
        </h3>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            View All
          </Link>
        )}
      </div>

      <div className="group relative">
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scroll-smooth pb-2"
          style={{ scrollbarWidth: 'none' }}
        >
          {products.map((product) => (
            <div key={product._id || product.id} className="min-w-[280px] max-w-[320px] flex-shrink-0">
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {products.length > 2 && (
          <>
            <button
              onClick={() => scroll('left')}
              className="absolute -left-3 top-1/2 -translate-y-1/2 rounded-full bg-surface p-2 text-text-primary shadow-md opacity-0 transition-opacity hover:bg-surface-secondary group-hover:opacity-100 dark:bg-dark-surface dark:text-dark-text-primary dark:hover:bg-dark-surface-secondary"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="absolute -right-3 top-1/2 -translate-y-1/2 rounded-full bg-surface p-2 text-text-primary shadow-md opacity-0 transition-opacity hover:bg-surface-secondary group-hover:opacity-100 dark:bg-dark-surface dark:text-dark-text-primary dark:hover:bg-dark-surface-secondary"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
    </section>
  );
}
