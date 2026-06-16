'use client';

import Link from 'next/link';
import { Search, IndianRupee, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useProducts } from '@/hooks';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CTABlock } from '@/components/shared/cta-block';

export function SearchContent({ q }: { q: string }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useProducts({ search: q, page, limit: 20 });

  if (!q) {
    return (
      <section className="py-20">
        <div className="container-main text-center">
          <Search className="mx-auto h-16 w-16 text-text-secondary dark:text-dark-text-secondary" />
          <h1 className="mt-4 text-2xl font-bold text-text-primary dark:text-dark-text-primary">Search Products</h1>
          <p className="mt-2 text-text-secondary dark:text-dark-text-secondary">
            Enter a search term to find products.
          </p>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <div className="container-main py-20">
        <div className="h-10 w-96 animate-pulse rounded-lg bg-surface-tertiary dark:bg-dark-surface-tertiary" />
        <div className="mt-2 h-4 w-64 animate-pulse rounded-lg bg-surface-tertiary dark:bg-dark-surface-tertiary" />
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-6 dark:bg-dark-surface dark:border-dark-border">
              <div className="h-40 w-full animate-pulse rounded-lg bg-surface-tertiary dark:bg-dark-surface-tertiary" />
              <div className="mt-4 h-5 w-3/4 animate-pulse rounded bg-surface-tertiary dark:bg-dark-surface-tertiary" />
              <div className="mt-2 h-6 w-1/3 animate-pulse rounded bg-surface-tertiary dark:bg-dark-surface-tertiary" />
              <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-surface-tertiary dark:bg-dark-surface-tertiary" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <section className="py-20">
        <div className="container-main text-center">
          <h1 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary">Something went wrong</h1>
          <p className="mt-2 text-text-secondary dark:text-dark-text-secondary">Failed to load search results. Please try again.</p>
          <Button variant="outline" className="mt-6" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </section>
    );
  }

  const products = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  return (
    <>
      <section className="border-b border-border bg-surface-secondary/50 pb-8 pt-24 dark:bg-dark-surface-secondary/50 dark:border-dark-border">
        <div className="container-main">
          <div className="flex items-center gap-3">
            <Search className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            <h1 className="text-3xl font-bold tracking-tight text-text-primary dark:text-dark-text-primary">
              Search results for &ldquo;{q}&rdquo;
            </h1>
          </div>
          <p className="mt-2 text-text-secondary dark:text-dark-text-secondary">
            {total} result{total !== 1 ? 's' : ''} found
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container-main">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Package className="h-16 w-16 text-text-secondary dark:text-dark-text-secondary" />
              <h2 className="mt-4 text-xl font-semibold text-text-primary dark:text-dark-text-primary">
                No results found for &ldquo;{q}&rdquo;
              </h2>
              <p className="mt-2 text-text-secondary dark:text-dark-text-secondary">
                Try adjusting your search terms or browse all products.
              </p>
              <Link href="/products">
                <Button variant="outline" className="mt-6">Browse All Products</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                  <Link key={product.id} href={`/products/${product.id}`}>
                    <Card className="h-full transition-all hover:shadow-md hover:-translate-y-1">
                      <CardContent className="p-6">
                        <div className="flex h-40 items-center justify-center rounded-lg bg-surface-secondary dark:bg-dark-surface-secondary">
                          <Package className="h-12 w-12 text-text-secondary dark:text-dark-text-secondary" />
                        </div>
                        <h3 className="mt-4 font-semibold text-text-primary dark:text-dark-text-primary line-clamp-2">
                          {product.name}
                        </h3>
                        <div className="mt-2 flex items-baseline gap-1">
                          <IndianRupee className="h-4 w-4 text-text-primary" />
                          <span className="text-xl font-bold text-text-primary dark:text-dark-text-primary">
                            {product.price.toLocaleString('en-IN')}
                          </span>
                          <span className="text-xs text-text-secondary dark:text-dark-text-secondary">/{product.unit}</span>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                          <Badge variant={product.stock > 0 ? 'success' : 'destructive'}>
                            {product.stock > 0 ? 'In Stock' : 'Out of stock'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-4">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                  </Button>
                  <span className="text-sm text-text-secondary dark:text-dark-text-secondary">
                    Page {page} of {totalPages}
                  </span>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                    Next <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <CTABlock
        title="Can't find what you're looking for?"
        subtitle="Post an RFQ and let sellers come to you with competitive quotes."
        primaryLabel="Post a Requirement"
        primaryHref="/rfq"
        secondaryLabel="Browse All Products"
        secondaryHref="/products"
        variant="accent"
      />
    </>
  );
}
