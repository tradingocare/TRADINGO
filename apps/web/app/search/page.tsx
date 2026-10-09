import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SearchContent } from './search-content';
import {
  buildSelfCanonical,
  hasIndexAffectingParams,
  resolveSearchParams,
  ROBOTS_INDEX_FOLLOW,
  ROBOTS_NOINDEX_FOLLOW,
  type SearchParamsLike,
} from '@/lib/seo/seo-policy';

const SEARCH_BASE_URL = 'https://tradingo.in/search';
const SEARCH_TITLE = 'Search Products & Services — TRADINGO';
const SEARCH_DESCRIPTION =
  'Search thousands of B2B products and services from verified Indian suppliers on TRADINGO.';

/**
 * PHASE 2-A §1 — /search indexing policy.
 * CURRENT: static indexable metadata for every URL incl. /search?q=... permutations.
 * PROBLEM: uncontrolled indexable query permutations (q/city/sort combos).
 * POLICY: bare /search = indexable search landing (self-canonical); any
 *   query-result variant (?q=..., tracking params ignored) = noindex + follow
 *   (users unaffected; link equity preserved; self-canonical, never fake).
 * UX/functionality/navigation untouched — metadata only.
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const sp = await resolveSearchParams(searchParams as SearchParamsLike);
  const isQueryVariant = hasIndexAffectingParams(sp);
  return {
    title: SEARCH_TITLE,
    description: SEARCH_DESCRIPTION,
    robots: isQueryVariant ? ROBOTS_NOINDEX_FOLLOW : ROBOTS_INDEX_FOLLOW,
    alternates: { canonical: buildSelfCanonical(SEARCH_BASE_URL, sp) },
  };
}

export default function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] opacity-10 rounded-full"
          style={{ background: 'radial-gradient(circle, #f59e0b, transparent 70%)', filter: 'blur(100px)' }} />
      </div>
      <div className="relative z-10">
        <Suspense fallback={<SearchSkeleton />}>
          <SearchContent q={searchParams.q || ''} />
        </Suspense>
      </div>
    </div>
  );
}

function SearchSkeleton() {
  const shimmer = 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent'

  return (
    <div className="mx-auto max-w-7xl px-4 pt-24">
      <div className={`h-10 w-96 rounded-2xl ${shimmer}`} style={{ background: 'rgba(255,255,255,0.04)' }} />
      <div className={`mt-2 h-4 w-64 rounded-xl ${shimmer}`} style={{ background: 'rgba(255,255,255,0.04)' }} />
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={`rounded-3xl p-6 ${shimmer}`} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)' }}>
            <div className={`h-40 w-full rounded-2xl ${shimmer}`} style={{ background: 'rgba(255,255,255,0.06)' }} />
            <div className={`mt-4 h-5 w-3/4 rounded-xl ${shimmer}`} style={{ background: 'rgba(255,255,255,0.06)' }} />
            <div className={`mt-2 h-6 w-1/3 rounded-xl ${shimmer}`} style={{ background: 'rgba(255,255,255,0.06)' }} />
            <div className={`mt-3 h-4 w-1/2 rounded-xl ${shimmer}`} style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>
        ))}
      </div>
    </div>
  );
}
