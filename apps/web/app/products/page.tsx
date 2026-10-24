import type { Metadata } from 'next'
import { Suspense }      from 'react'
import ProductsPageClient from './ProductsPageClient'
import {
  buildSelfCanonical,
  hasIndexAffectingParams,
  resolveSearchParams,
  ROBOTS_INDEX_FOLLOW,
  ROBOTS_NOINDEX_FOLLOW,
  type SearchParamsLike,
} from '@/lib/seo/seo-policy'

const PRODUCTS_TITLE = 'TRADINGO | Global Marketplace to Buy Products & Services';
const PRODUCTS_DESCRIPTION =
  'Buy products, raw materials, daily essentials, machinery, business supplies, and professional services from verified manufacturers, traders, distributors, and service providers worldwide. Compare prices, connect directly, and request quotations on TRADINGO.';

/**
 * PHASE 2-A §3 — /products pagination/filter policy.
 * CURRENT: locked title/description, NO canonical; every filter/pagination
 *   variant (?q=, ?category=, ?catalogCategory=, ?sort=, ?page=...) indexable.
 * EXAMINED: canonical category landings live at /categories/[slug]; filter
 *   views are navigation conveniences, not canonical resources.
 * POLICY: bare /products = index + self-canonical (locked copy untouched);
 *   any filtered/paginated variant = noindex + follow + honest self-canonical.
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const sp = await resolveSearchParams(searchParams as SearchParamsLike);
  const isVariant = hasIndexAffectingParams(sp);
  return {
    title: { absolute: PRODUCTS_TITLE },
    description: PRODUCTS_DESCRIPTION,
    robots: isVariant ? ROBOTS_NOINDEX_FOLLOW : ROBOTS_INDEX_FOLLOW,
    alternates: { canonical: buildSelfCanonical('https://tradingo.in/products', sp) },
  };
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ProductsPageClient />
    </Suspense>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-2 border-t-accent border-border animate-spin mx-auto mb-4" />
        <p className="text-text-tertiary text-sm">Loading discovery engine...</p>
      </div>
    </div>
  )
}
