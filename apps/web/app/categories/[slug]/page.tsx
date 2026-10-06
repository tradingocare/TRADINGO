import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, Package } from 'lucide-react';
import { getProducts } from '@/lib/api/products';
import { getCategory } from '@/lib/api/categories';
import { getCatalogCategoryBySlug } from '@/lib/api/enterprise-catalog';
import { buildSelfCanonical, ROBOTS_INDEX_FOLLOW } from '@/lib/seo/seo-policy';

/**
 * PHASE 2-B §6 — category metadata from the authoritative catalog source.
 * Lookup chain (first non-empty wins, never breaks the route):
 *   1. CatalogCategory authority (GET .../taxonomy/categories/slug/:slug):
 *      seoTitle / seoDescription used verbatim when non-empty.
 *   2. Legacy Category record (same URL slug namespace): seoTitle /
 *      seoDescription when non-empty.
 *   3. Deterministic title-cased fallback (previous behavior, preserved).
 * Self-canonical always. Listing behavior, UX, and breadcrumbs untouched.
 */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const categoryName = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const canonical = buildSelfCanonical(`https://tradingo.in/categories/${slug}`, {});
  const fallback = {
    title: `${categoryName} - Browse Products`,
    description: `Explore ${categoryName} products on TRADINGO TEM E-Marketplace. Find quality suppliers and competitive prices.`,
    openGraph: {
      title: `${categoryName} | TRADINGO`,
      description: `Browse ${categoryName} products from verified sellers.`,
    },
    robots: ROBOTS_INDEX_FOLLOW,
    alternates: { canonical },
  };
  // Tier 1 — canonical catalog authority.
  try {
    const authority = await getCatalogCategoryBySlug(slug).catch(() => null);
    const seoTitle = authority?.seoTitle?.trim();
    const seoDescription = authority?.seoDescription?.trim();
    if (seoTitle || seoDescription) {
      const displayName = authority?.name?.trim() || categoryName;
      return {
        title: seoTitle || `${displayName} - Browse Products`,
        description: seoDescription || fallback.description,
        openGraph: {
          title: seoTitle || `${displayName} | TRADINGO`,
          description: seoDescription || fallback.openGraph.description,
        },
        robots: ROBOTS_INDEX_FOLLOW,
        alternates: { canonical },
      };
    }
  } catch {
    // fall through — never break the route on metadata lookup failure
  }
  // Tier 2 — legacy record in this route's slug namespace.
  try {
    const record = await getCategory(slug).catch(() => null);
    const seoTitle = record?.seoTitle?.trim();
    const seoDescription = record?.seoDescription?.trim();
    if (seoTitle || seoDescription) {
      return {
        title: seoTitle || `${categoryName} - Browse Products`,
        description: seoDescription || fallback.description,
        openGraph: {
          title: seoTitle || `${categoryName} | TRADINGO`,
          description: seoDescription || fallback.openGraph.description,
        },
        robots: ROBOTS_INDEX_FOLLOW,
        alternates: { canonical },
      };
    }
  } catch {
    // fall through to the previous title-cased metadata
  }
  return fallback;
}
import type { Product } from '@/lib/api/types';
import { ProductCard } from '@/components/product/product-card';
import { fromBasicProduct } from '@/components/product/card-converters';
import ClaimYourGrowth from '@/components/sections/ClaimYourGrowth';

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

  // PHASE 2-B §10 — Category → Subcategory internal links (data-backed only).
  // Subcategories come from the canonical catalog authority; every chip links
  // to a real subcategory route. Fail-soft: the strip hides if the authority
  // lookup fails — the product listing below is unaffected.
  let subcategoryLinks: Array<{ slug: string; name: string }> = [];
  try {
    const authority = await getCatalogCategoryBySlug(slug).catch(() => null);
    if (authority && Array.isArray(authority.subcategories)) {
      subcategoryLinks = authority.subcategories
        .filter((s) => s && s.slug && s.name)
        .map((s) => ({ slug: s.slug, name: s.name }));
    }
  } catch {
    subcategoryLinks = [];
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
                <Link href="/trading" className="transition-colors hover:text-accent">Products</Link>
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
              {subcategoryLinks.length > 0 && (
                <nav aria-label="Subcategories" className="mt-6 flex flex-wrap gap-2">
                  {subcategoryLinks.map((sub) => (
                    <Link
                      key={sub.slug}
                      href={`/categories/${slug}/${sub.slug}`}
                      className="rounded-full border border-border bg-surface px-4 py-1.5 text-sm text-text-secondary transition-colors hover:border-accent hover:text-accent"
                    >
                      {sub.name}
                    </Link>
                  ))}
                </nav>
              )}
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
                    <Link href="/trading">
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
