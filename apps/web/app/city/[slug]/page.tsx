import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin, IndianRupee, Package, Store } from 'lucide-react';
import { getProducts } from '@/lib/api/products';
import type { Product, PaginatedResponse } from '@/lib/api/types';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { CTABlock } from '@/components/shared/cta-block';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const cityName = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return {
    title: `Marketplace in ${cityName} | TRADINGO`,
    description: `Find products and sellers in ${cityName}. Browse local listings on TRADINGO TEM E-Marketplace.`,
    openGraph: {
      title: `${cityName} Marketplace | TRADINGO`,
      description: `Discover products available in ${cityName}.`,
    },
  };
}

function CitySkeleton() {
  return (
    <div className="container-main py-20">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="mt-6 h-10 w-72" />
      <Skeleton className="mt-2 h-4 w-56" />
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}><CardContent className="p-6"><Skeleton className="h-6 w-full" /><Skeleton className="mt-2 h-4 w-3/4" /></CardContent></Card>
        ))}
      </div>
    </div>
  );
}

export default async function CityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <Suspense fallback={<CitySkeleton />}>
      <CityContent slug={slug} />
    </Suspense>
  );
}

async function CityContent({ slug }: { slug: string }) {
  const cityName = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  let result: PaginatedResponse<Product>;
  try {
    result = await getProducts({ limit: 50 } as Record<string, unknown> as never);
  } catch {
    notFound();
  }

  const cityProducts = result.data;
  const uniqueSellers = new Set(cityProducts.map(p => p.companyId)).size;

  const cityJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'City',
    name: cityName,
    description: `Marketplace in ${cityName} on TRADINGO`,
    numberOfActiveListings: cityProducts.length,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(cityJsonLd) }} />

      <section className="border-b border-border bg-surface-secondary/50 pb-8 pt-24 dark:bg-dark-surface-secondary/50 dark:border-dark-border">
        <div className="container-main">
          <nav className="flex items-center gap-2 text-sm text-text-secondary dark:text-dark-text-secondary">
            <MapPin className="h-4 w-4" />
            <span className="text-text-primary dark:text-dark-text-primary">{cityName}</span>
          </nav>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-text-primary dark:text-dark-text-primary">
            Marketplace in {cityName}
          </h1>
          <div className="mt-4 flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              <span className="text-text-secondary dark:text-dark-text-secondary">
                {cityProducts.length} listing{cityProducts.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              <span className="text-text-secondary dark:text-dark-text-secondary">
                {uniqueSellers} active seller{uniqueSellers !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container-main">
          {cityProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <MapPin className="h-16 w-16 text-text-secondary dark:text-dark-text-secondary" />
              <h2 className="mt-4 text-xl font-semibold text-text-primary dark:text-dark-text-primary">
                No listings in {cityName} yet
              </h2>
              <p className="mt-2 text-text-secondary dark:text-dark-text-secondary">
                Be the first to list a product or check back later.
              </p>
              <Link href="/products">
                <button className="mt-6 rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-primary-700">
                  Browse All Products
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {cityProducts.map((product) => (
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
                        <IndianRupee className="h-4 w-4 text-text-primary dark:text-dark-text-primary" />
                        <span className="text-xl font-bold text-text-primary dark:text-dark-text-primary">
                          {product.price.toLocaleString()}
                        </span>
                        <span className="text-xs text-text-secondary dark:text-dark-text-secondary">/{product.unit}</span>
                      </div>
                      <Badge variant={product.stock > 0 ? 'success' : 'destructive'} className="mt-3">
                        {product.stock > 0 ? 'In Stock' : 'Out of stock'}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <CTABlock
        title={`Sell in ${cityName}`}
        subtitle="List your products and reach buyers across India."
        primaryLabel="Start Selling"
        primaryHref="/seller"
        secondaryLabel="Browse All Products"
        secondaryHref="/products"
        variant="default"
      />
    </>
  );
}
