import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, IndianRupee, Package, LayoutGrid } from 'lucide-react';
import { getProducts } from '@/lib/api/products';
import type { Product, PaginatedResponse } from '@/lib/api/types';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { CTABlock } from '@/components/shared/cta-block';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const industryName = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return {
    title: `${industryName} Industry | TRADINGO`,
    description: `Explore ${industryName} industry products, suppliers, and market trends on TRADINGO TEM™ E-Marketplace.`,
    openGraph: {
      title: `${industryName} Industry | TRADINGO`,
      description: `Find ${industryName} products and suppliers.`,
    },
  };
}

function IndustrySkeleton() {
  return (
    <div className="container-main py-20">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="mt-6 h-10 w-72" />
      <Skeleton className="mt-2 h-4 w-96" />
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}><CardContent className="p-6"><Skeleton className="h-6 w-full" /><Skeleton className="mt-2 h-4 w-3/4" /></CardContent></Card>
        ))}
      </div>
    </div>
  );
}

export default async function IndustryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <Suspense fallback={<IndustrySkeleton />}>
      <IndustryContent slug={slug} />
    </Suspense>
  );
}

async function IndustryContent({ slug }: { slug: string }) {
  const industryName = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  let result: PaginatedResponse<Product>;
  try {
    result = await getProducts({ category: slug, limit: 50 });
  } catch {
    notFound();
  }

  const products = result.data;
  const subCategories = [...new Set(products.map(p => p.category))];

  return (
    <>
      <section className="border-b border-border bg-surface-secondary/50 pb-8 pt-24 dark:bg-dark-surface-secondary/50 dark:border-dark-border">
        <div className="container-main">
          <nav className="flex items-center gap-2 text-sm text-text-secondary dark:text-dark-text-secondary">
            <Link href="/products" className="hover:text-primary-600 dark:hover:text-primary-400">Products</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-text-primary dark:text-dark-text-primary">{industryName}</span>
          </nav>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-text-primary dark:text-dark-text-primary">
            {industryName} Industry
          </h1>
          <p className="mt-2 max-w-2xl text-text-secondary dark:text-dark-text-secondary">
            Explore {industryName.toLowerCase()} products, connect with suppliers, and discover market opportunities on TRADINGO.
          </p>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">
            {products.length} product{products.length !== 1 ? 's' : ''} available
            {subCategories.length > 0 ? ` across ${subCategories.length} sub-categor${subCategories.length !== 1 ? 'ies' : 'y'}` : ''}
          </p>
        </div>
      </section>

      {subCategories.length > 0 && (
        <section className="border-b border-border bg-surface py-8 dark:bg-dark-surface dark:border-dark-border">
          <div className="container-main">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              <h2 className="font-semibold text-text-primary dark:text-dark-text-primary">Sub-Categories</h2>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              {subCategories.map((cat) => (
                <Link key={cat} href={`/categories/${cat.toLowerCase().replace(/\s+/g, '-')}`}>
                  <Badge variant="secondary" className="cursor-pointer px-4 py-1.5 text-sm hover:bg-surface-tertiary dark:hover:bg-dark-surface-tertiary">
                    {cat}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-12">
        <div className="container-main">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Package className="h-16 w-16 text-text-secondary dark:text-dark-text-secondary" />
              <h2 className="mt-4 text-xl font-semibold text-text-primary dark:text-dark-text-primary">
                No products in this industry yet
              </h2>
              <p className="mt-2 text-text-secondary dark:text-dark-text-secondary">
                Check back later or browse other industries.
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
                      <div className="mt-3 flex items-center gap-2">
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
          )}
        </div>
      </section>

      <CTABlock
        title={`Join the ${industryName} Industry on TRADINGO`}
        subtitle="Connect with buyers and sellers in your industry today."
        primaryLabel="Get Started"
        primaryHref="/seller-plans"
        secondaryLabel="Browse All Industries"
        secondaryHref="/products"
        variant="accent"
      />
    </>
  );
}
