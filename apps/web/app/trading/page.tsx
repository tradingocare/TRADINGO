import { Suspense } from 'react';
import type { Metadata } from 'next';
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

const TRADING_DESCRIPTION =
  'Find verified manufacturers, suppliers, traders, and distributors worldwide. Explore business profiles, products, capabilities, and locations, compare suppliers, and connect directly with trusted trade partners through TRADINGO.';

/**
 * PHASE 2-A §3 — /trading pagination/filter policy.
 * CURRENT: static canonical '/trading' covers every variant (?page=2,
 *   ?category=..., ?q=..., ?sort=...) — paginated/filtered views all point
 *   canonical at page 1 while remaining indexable.
 * EXAMINED: the canonical category landings live at /categories/[slug]
 *   (indexable, real data); /trading filter views (?category=, ?q=, ?sort=,
 *   ?page=) are navigation conveniences, not canonical resources.
 * POLICY: bare /trading = index + existing canonical '/trading' (unchanged);
 *   any filtered/paginated variant = noindex + follow (navigation preserved,
 *   crawl explosion prevented) + honest self-canonical.
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const sp = await resolveSearchParams(searchParams as SearchParamsLike);
  const isVariant = hasIndexAffectingParams(sp);
  return {
    title: { absolute: 'TRADINGO | Global Manufacturers, Suppliers & Distributors Directory' },
    description: TRADING_DESCRIPTION,
    openGraph: {
      title: 'TRADINGO | Global Manufacturers, Suppliers & Distributors Directory',
      description: TRADING_DESCRIPTION,
      type: 'website',
    },
    robots: isVariant ? ROBOTS_NOINDEX_FOLLOW : ROBOTS_INDEX_FOLLOW,
    alternates: {
      canonical: isVariant
        ? buildSelfCanonical('https://tradingo.in/trading', sp)
        : '/trading',
    },
  };
}

export default function TradingPage() {
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
