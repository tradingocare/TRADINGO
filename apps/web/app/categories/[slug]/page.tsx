import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, IndianRupee, Package } from 'lucide-react';
import { getProducts } from '@/lib/api/products';
import type { Product } from '@/lib/api/types';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { CTABlock } from '@/components/shared/cta-block';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const categoryName = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return {
    title: `${categoryName} - Browse Products`,
    description: `Explore ${categoryName} products on TRADINGO TEM E-Marketplace. Find quality suppliers and competitive prices.`,
    openGraph: {
      title: `${categoryName} | TRADINGO`,
      description: `Browse ${categoryName} products from verified sellers.`,
    },
  };
}

function CategorySkeleton() {
  return (
    <div className="container-main py-20">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="mt-6 h-10 w-64" />
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-40 w-full rounded-lg" />
              <Skeleton className="mt-4 h-5 w-3/4" />
              <Skeleton className="mt-2 h-6 w-1/3" />
              <Skeleton className="mt-3 h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <Suspense fallback={<CategorySkeleton />}>
      <CategoryContent slug={slug} />
    </Suspense>
  );
}

async function CategoryContent({ slug }: { slug: string }) {
  const categoryName = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  let products: Product[];
  let total: number;
  try {
    const result = await getProducts({ category: slug, limit: 50 });
    products = result.data;
    total = result.total;
  } catch {
    notFound();
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Products', item: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/products` },
      { '@type': 'ListItem', position: 2, name: categoryName },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <section className="border-b border-border bg-surface-secondary/50 pb-8 pt-24 dark:bg-dark-surface-secondary/50 dark:border-dark-border">
        <div className="container-main">
          <nav className="flex items-center gap-2 text-sm text-text-secondary dark:text-dark-text-secondary">
            <Link href="/products" className="hover:text-primary-600 dark:hover:text-primary-400">Products</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-text-primary dark:text-dark-text-primary">{categoryName}</span>
          </nav>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-text-primary dark:text-dark-text-primary">
            {categoryName}
          </h1>
          <p className="mt-2 text-text-secondary dark:text-dark-text-secondary">
            {total} product{total !== 1 ? 's' : ''} available
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container-main">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Package className="h-16 w-16 text-text-secondary dark:text-dark-text-secondary" />
              <h2 className="mt-4 text-xl font-semibold text-text-primary dark:text-dark-text-primary">
                No products in this category
              </h2>
              <p className="mt-2 text-text-secondary dark:text-dark-text-secondary">
                Check back later or browse other categories.
              </p>
              <Link href="/products">
                <button className="mt-6 rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-primary-700">
                  Browse All Products
                </button>
              </Link>
            </div>
          ) : (
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
                        <IndianRupee className="h-4 w-4 text-text-primary dark:text-dark-text-primary" />
                        <span className="text-xl font-bold text-text-primary dark:text-dark-text-primary">
                          {product.price.toLocaleString()}
                        </span>
                        <span className="text-xs text-text-secondary dark:text-dark-text-secondary">/{product.unit}</span>
                      </div>
                      <Badge variant={product.stock > 0 ? 'success' : 'destructive'} className="mt-3">
                        {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
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
        title={`Looking for ${categoryName} products?`}
        subtitle="Post an RFQ and get quotes from verified sellers."
        primaryLabel="Post a Requirement"
        primaryHref="/rfq"
        secondaryLabel="View All Categories"
        secondaryHref="/products"
        variant="accent"
      />
    </>
  );
}
