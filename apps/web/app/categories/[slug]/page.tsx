import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, Package } from 'lucide-react';
import { getProducts } from '@/lib/api/products';
import type { Product } from '@/lib/api/types';
import { ProductCard } from '@/components/product/product-card';
import { fromBasicProduct } from '@/components/product/card-converters';
import ClaimYourGrowth from '@/components/sections/ClaimYourGrowth';

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

const shimmer = 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent'

function CategorySkeleton() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <div className="mx-auto max-w-7xl px-4 py-20">
        <div className={`h-5 w-48 rounded-full bg-surface ${shimmer}`} />
        <div className={`mt-6 h-10 w-64 rounded-2xl bg-surface ${shimmer}`} />
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`surface-card-xl p-6 ${shimmer}`}>
              <div className="flex h-40 items-center justify-center rounded-2xl bg-surface">
                <Package className="h-12 w-12 text-text-tertiary opacity-10" />
              </div>
              <div className={`mt-4 h-5 w-3/4 rounded-xl bg-surface ${shimmer}`} />
              <div className={`mt-2 h-6 w-1/3 rounded-xl bg-surface ${shimmer}`} />
              <div className={`mt-3 h-4 w-1/2 rounded-xl bg-surface ${shimmer}`} />
            </div>
          ))}
        </div>
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

      <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
        <div
          className="pointer-events-none fixed inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(255,77,0,0.08), transparent)',
          }}
        />
        <div className="relative z-10">
          <section className="relative overflow-hidden pb-8 pt-24">
            <div className="mx-auto max-w-7xl px-4">
              <nav className="flex items-center gap-2 text-sm text-text-secondary">
                <Link href="/products" className="transition-colors hover:text-accent">Products</Link>
                <ChevronRight className="h-4 w-4 text-text-tertiary" />
                <span className="text-text-primary font-medium">{categoryName}</span>
              </nav>

              <div className="mt-6 inline-block surface-card-xl px-6 py-5 backdrop-blur-xl">
                <h1 className="text-4xl font-bold tracking-tight text-text-primary">
                  {categoryName}
                </h1>
                <p className="mt-2 text-text-tertiary">
                  {total} product{total !== 1 ? 's' : ''} available
                </p>
              </div>
            </div>
          </section>

          <section className="py-12">
            <div className="mx-auto max-w-7xl px-4">
              {products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="surface-card-xl px-12 py-10 backdrop-blur-xl">
                    <Package className="mx-auto h-16 w-16 text-text-tertiary" />
                    <h2 className="mt-4 text-xl font-semibold text-text-primary">
                      No products in this category
                    </h2>
                    <p className="mt-2 text-text-tertiary">
                      Check back later or browse other categories.
                    </p>
                    <Link href="/products">
                      <div
                        className="mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:brightness-110"
                        style={{
                          background: 'linear-gradient(135deg, #FF4D00, #FF7A3D)',
                          boxShadow: '0 4px 16px rgba(255,77,0,0.3)',
                        }}
                      >
                        Browse All Products
                      </div>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={fromBasicProduct(product)} variant="compact" />
                  ))}
                </div>
              )}
            </div>
          </section>

          <ClaimYourGrowth />
        </div>
      </div>
    </>
  );
}
