import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CategoryStrip } from '@/components/trading/category-strip';
import TradingPageShell from '@/components/trading/trading-page-shell';
import TradingDiscoveryClient from './TradingDiscoveryClient';
import {
  buildSelfCanonical,
  hasIndexAffectingParams,
  resolveSearchParams,
  ROBOTS_INDEX_FOLLOW,
  ROBOTS_NOINDEX_FOLLOW,
  type SearchParamsLike,
} from '@/lib/seo/seo-policy';

const PRODUCTS_TITLE = 'TRADINGO | Global Marketplace to Buy Products & Services';
const PRODUCTS_DESCRIPTION =
  'Buy products, raw materials, daily essentials, machinery, business supplies, and professional services from verified manufacturers, traders, distributors, and service providers worldwide. Compare prices, connect directly, and request quotations on TRADINGO.';

/**
 * FOUNDER ROUTE CORRECTION — the full-featured trading product-discovery
 * experience (CategoryStrip + embedded discovery engine + directory
 * sections) is now served at /product; /trading is a permanent 308 alias.
 *
 * PHASE 2-A §3 — /product listing policy (canonical /products listing copy
 * locked by the /products consolidation; URL params identical):
 * bare /product = index + self-canonical; any filtered/paginated variant
 * (?page=, ?category=, ?q=, ?sort=, ?catalogCategory=...) = noindex + follow
 * + honest self-canonical.
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
    openGraph: {
      title: PRODUCTS_TITLE,
      description: PRODUCTS_DESCRIPTION,
      type: 'website',
    },
    robots: isVariant ? ROBOTS_NOINDEX_FOLLOW : ROBOTS_INDEX_FOLLOW,
    alternates: {
      canonical: buildSelfCanonical('https://tradingo.in/product', sp),
    },
  };
}

export default function ProductPage() {
  return (
    <TradingPageShell>
      <Suspense
        fallback={
          <div className="h-16 overflow-x-auto rounded-lg border border-border bg-surface">
            <div className="flex items-center gap-3 px-3 py-2 text-sm text-text-tertiary">
              <span>Loading categories…</span>
            </div>
          </div>
        }
      >
        <CategoryStrip />
        <TradingDiscoveryClient />
      </Suspense>
    </TradingPageShell>
  )
}
