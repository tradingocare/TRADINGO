import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, Package, Tag } from 'lucide-react';
import { getCatalogCategoryBySlug } from '@/lib/api/enterprise-catalog';
import { searchProducts } from '@/lib/api/discovery';
import { Skeleton } from '@/components/ui/skeleton';
import {
  buildSelfCanonical,
  eligibilityRobots,
  getSubcategoryEligibility,
  hasIndexAffectingParams,
  resolveSearchParams,
  type SearchParamsLike,
} from '@/lib/seo/seo-policy';

/**
 * PHASE 2-B §7 — subcategory SEO route (canonical pattern).
 *
 * Chosen URL pattern: /categories/[category-slug]/[subcategory-slug]
 * Evidence: CatalogSubcategory slugs are unique PER CATEGORY
 * (@@unique([categoryId, slug]) — prisma/schema.prisma), so the
 * category-scoped two-segment route is the only URL that maps 1:1 to the
 * canonical taxonomy without collision risk. The longer
 * /categories/[category]/subcategories/[subcategory] alternative adds a
 * static segment with zero disambiguation value — rejected.
 * No competing public subcategory URL is created.
 *
 * ROUTER CONSTRAINT (verified 2026-10-06): Next.js requires sibling dynamic
 * segments under one parent to share a single param name, so the first
 * segment reuses the existing [slug] name alongside
 * app/categories/[slug]/page.tsx (a [category] sibling 500s the route
 * reload: "different slug names for the same dynamic path"). URL SHAPE is
 * exactly the chosen pattern — only the param identifier is shared.
 *
 * Data (all real, none fabricated):
 *  - hierarchy: GET .../taxonomy/categories/slug/:category (authority)
 *  - listings: GET /search/products?catalogSubcategoryId= (existing API)
 *  - products carry company slugs → seller discovery via real company links
 *  - catalog items render as TEXT chips (no item route exists yet — §10:
 *    every generated link must resolve, so items are deliberately unlinkable)
 *  - ratings/reviews are NEVER displayed (search hits carry zeros)
 *
 * Indexability (§8): eligibility engine (INDEX/HOLD/NOINDEX) + Phase 2-A
 * pagination policy (?page= variants noindex). Subcategory URLs are NOT
 * added to the XML sitemap in this phase (§11).
 */

type Params = { slug: string; subcategory: string };

async function resolveSubcategory(categorySlug: string, subSlug: string) {
  const cat = await getCatalogCategoryBySlug(categorySlug).catch(() => null);
  if (!cat) return null;
  const sub = (cat.subcategories ?? []).find((s) => s.slug === subSlug) ?? null;
  if (!sub) return null;
  return { cat, sub };
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { slug: categorySlug, subcategory: subSlug } = await params;
  const sp = await resolveSearchParams(searchParams as SearchParamsLike);
  const canonical = buildSelfCanonical(
    `https://tradingo.in/categories/${categorySlug}/${subSlug}`,
    sp,
  );
  const resolved = await resolveSubcategory(categorySlug, subSlug).catch(() => null);
  if (!resolved) return { title: 'Subcategory Not Found' };
  const { cat, sub } = resolved;
  const status = getSubcategoryEligibility({
    categoryIsActive: cat.isActive,
    subcategoryExists: true,
    activeProductCount: sub.activeProductCount,
    activeCatalogItemCount: sub.items.length,
  });
  const paginated = hasIndexAffectingParams(sp);
  // Fallback naming is deterministic and brand-free: the root layout template
  // appends "| TRADINGO" (never repeat the brand here — cf. companies page).
  // Authoritative seoTitle from the DB is used verbatim when non-empty.
  const title = sub.seoTitle?.trim() || `${sub.name} - ${cat.name}`;
  const description =
    sub.seoDescription?.trim() ||
    `Explore ${sub.name} products, suppliers and services in ${cat.name} on TRADINGO.`;
  return {
    title,
    description,
    openGraph: { title, description },
    robots: status === 'NOINDEX' || paginated ? eligibilityRobots('NOINDEX') : eligibilityRobots(status),
    alternates: { canonical },
  };
}

function SubcategorySkeleton() {
  return (
    <div className="container-main py-20">
      <Skeleton className="h-5 w-64" />
      <Skeleton className="mt-6 h-10 w-72" />
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

function formatINR(n: number | undefined) {
  if (n === undefined || n === null || Number.isNaN(n)) return null;
  return `₹${Number(n).toLocaleString('en-IN')}`;
}

export default async function SubcategoryPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug: categorySlug, subcategory: subSlug } = await params;
  const sp = await resolveSearchParams(searchParams as SearchParamsLike);
  const page = Math.max(Number(Array.isArray(sp.page) ? sp.page[0] : sp.page) || 1, 1);
  return (
    <Suspense fallback={<SubcategorySkeleton />}>
      <SubcategoryContent categorySlug={categorySlug} subSlug={subSlug} page={page} />
    </Suspense>
  );
}

async function SubcategoryContent({
  categorySlug,
  subSlug,
  page,
}: {
  categorySlug: string;
  subSlug: string;
  page: number;
}) {
  const resolved = await resolveSubcategory(categorySlug, subSlug).catch(() => null);
  if (!resolved) notFound();
  const { cat, sub } = resolved;

  const siblings = (cat.subcategories ?? []).filter((s) => s.slug !== sub.slug);

  // Listings via the existing public search API (server-side validated;
  // invalid combos resolve to honest empty). Fail-soft: taxonomy content
  // below still renders if search is unreachable/throttled.
  let listingTotal = 0;
  let listings: Array<{
    id: string; name: string; slug: string; images: string[];
    price?: number; unit?: string; moq?: number; city: string;
    seller: { name: string; slug?: string };
  }> = [];
  try {
    const res = await searchProducts({ catalogSubcategoryId: sub.id, limit: 24, page }).catch(() => null);
    if (res) {
      listingTotal = res.total ?? 0;
      listings = (res.results ?? []).map((r: any) => ({
        id: String(r.id ?? ''),
        name: String(r.name ?? ''),
        slug: String(r.slug ?? ''),
        images: Array.isArray(r.images) ? r.images : [],
        price: typeof r.price === 'number' ? r.price : undefined,
        unit: typeof r.unit === 'string' ? r.unit : undefined,
        moq: typeof r.moq === 'number' ? r.moq : undefined,
        city: typeof r.city === 'string' ? r.city : '',
        seller: {
          name: String(r.seller?.name ?? ''),
          slug: typeof r.seller?.slug === 'string' && r.seller.slug ? r.seller.slug : undefined,
        },
      }));
    }
  } catch {
    listings = [];
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Products', item: 'https://tradingo.in/trading' },
      { '@type': 'ListItem', position: 2, name: cat.name, item: `https://tradingo.in/categories/${cat.slug}` },
      { '@type': 'ListItem', position: 3, name: sub.name },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
        <div className="relative z-10">
          <section className="relative overflow-hidden pb-8 pt-24">
            <div className="mx-auto max-w-7xl px-4">
              <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
                <Link href="/trading" className="transition-colors hover:text-accent">Products</Link>
                <ChevronRight className="h-4 w-4 text-text-tertiary" />
                <Link href={`/categories/${cat.slug}`} className="transition-colors hover:text-accent">
                  {cat.name}
                </Link>
                <ChevronRight className="h-4 w-4 text-text-tertiary" />
                <span className="font-medium text-text-primary">{sub.name}</span>
              </nav>

              <div className="mt-6 inline-block surface-card-xl px-6 py-5 backdrop-blur-xl">
                <h1 className="text-4xl font-bold tracking-tight text-text-primary">{sub.name}</h1>
                <p className="mt-2 text-text-tertiary">
                  {listingTotal} product{listingTotal !== 1 ? 's' : ''} · {sub.items.length} catalog item
                  {sub.items.length !== 1 ? 's' : ''} · in {cat.name}
                </p>
              </div>

              {siblings.length > 0 && (
                <nav aria-label="Sibling subcategories" className="mt-6 flex flex-wrap gap-2">
                  {siblings.map((s) => (
                    <Link
                      key={s.slug}
                      href={`/categories/${cat.slug}/${s.slug}`}
                      className="rounded-full border border-border bg-surface px-4 py-1.5 text-sm text-text-secondary transition-colors hover:border-accent hover:text-accent"
                    >
                      {s.name}
                    </Link>
                  ))}
                </nav>
              )}
            </div>
          </section>

          <section className="py-12">
            <div className="mx-auto max-w-7xl px-4">
              {listings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="surface-card-xl px-12 py-10 backdrop-blur-xl">
                    <Package className="mx-auto h-16 w-16 text-text-tertiary" />
                    <h2 className="mt-4 text-xl font-semibold text-text-primary">
                      No live listings in {sub.name} yet
                    </h2>
                    <p className="mt-2 text-text-tertiary">
                      Browse the catalog below or explore {cat.name}.
                    </p>
                    <Link href={`/categories/${cat.slug}`}>
                      <div
                        className="mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:brightness-110"
                        style={{
                          background: 'linear-gradient(135deg, #FF4D00, #FF7A3D)',
                          boxShadow: '0 4px 16px rgba(255,77,0,0.3)',
                        }}
                      >
                        Browse {cat.name}
                      </div>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {listings.map((p) => {
                    const price = formatINR(p.price);
                    const title = (
                      <span className="line-clamp-2 text-sm font-semibold text-text-primary">
                        {p.name || 'Untitled product'}
                      </span>
                    );
                    return (
                      <div key={p.id || p.slug} className="surface-card-xl overflow-hidden p-4">
                        <div className="flex h-40 items-center justify-center rounded-2xl bg-surface">
                          {p.images[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.images[0]} alt={p.name} className="h-full w-full rounded-2xl object-cover" />
                          ) : (
                            <Package className="h-12 w-12 text-text-tertiary opacity-40" />
                          )}
                        </div>
                        <div className="mt-3">
                          {p.slug ? (
                            <Link href={`/products/${p.slug}`} className="transition-colors hover:text-accent">
                              {title}
                            </Link>
                          ) : (
                            title
                          )}
                        </div>
                        {price && (
                          <p className="mt-1 text-sm font-bold text-text-primary">
                            {price}
                            {p.unit ? <span className="font-normal text-text-tertiary"> / {p.unit}</span> : null}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-text-tertiary">
                          {p.seller.slug ? (
                            <Link href={`/companies/${p.seller.slug}`} className="transition-colors hover:text-accent">
                              {p.seller.name || 'Supplier'}
                            </Link>
                          ) : (
                            <span>{p.seller.name || 'Supplier'}</span>
                          )}
                          {p.city ? <span> · {p.city}</span> : null}
                          {p.moq ? <span> · MOQ {p.moq}</span> : null}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {sub.items.length > 0 && (
                <div className="mt-12">
                  <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-text-primary">
                    <Tag className="h-5 w-5 text-text-tertiary" />
                    Catalog items in {sub.name}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {sub.items.map((item) => (
                      <span
                        key={item.id}
                        className="rounded-full border border-border bg-surface px-4 py-1.5 text-sm text-text-secondary"
                        title={item.type}
                      >
                        {item.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
