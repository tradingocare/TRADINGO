'use client'

import { useMemo, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  BadgeDollarSign,
  Clock,
  Eye,
  Flame,
  Loader2,
  Star,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { ProductCard, ProductCardSkeleton } from '@/components/product/product-card'
import { fromDiscoveryResult } from '@/components/product/card-converters'
import {
  getDiscoveryFeed,
  discoverItemToDiscoveryResult,
  searchProducts,
} from '@/lib/api/discovery'
import { SectionShell, DirHeader, SectionError, EmptyNote, InfiniteSentinel } from './primitives'
import { useInfiniteScroll } from './use-infinite-scroll'
import { cn } from '@/lib/utils'

type TabId = 'featured' | 'trending' | 'recent' | 'viewed' | 'rated' | 'gocash'

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'featured', label: 'Featured', icon: <Zap size={13} /> },
  { id: 'trending', label: 'Trending', icon: <TrendingUp size={13} /> },
  { id: 'recent', label: 'Recently Added', icon: <Clock size={13} /> },
  { id: 'viewed', label: 'Most Viewed', icon: <Eye size={13} /> },
  { id: 'rated', label: 'Best Rated', icon: <Star size={13} /> },
  { id: 'gocash', label: 'Highest GOCASH', icon: <BadgeDollarSign size={13} /> },
]

const SEARCH_SORT: Record<string, string> = {
  recent: 'newest',
  viewed: 'popularity',
  rated: 'rating',
}

export function ProductsSection() {
  const [tab, setTab] = useState<TabId>('featured')

  const featuredQuery = useInfiniteQuery({
    queryKey: ['directory-products-featured'],
    queryFn: ({ pageParam }) => getDiscoveryFeed(pageParam, 24),
    initialPageParam: 1,
    getNextPageParam: last =>
      last?.meta && last.meta.page * last.meta.limit < last.meta.total ? last.meta.page + 1 : undefined,
    enabled: tab === 'featured',
    staleTime: 120_000,
  })

  const trendingQuery = useInfiniteQuery({
    queryKey: ['directory-products-trending'],
    queryFn: ({ pageParam }) => getDiscoveryFeed(pageParam, 24),
    initialPageParam: 1,
    getNextPageParam: last =>
      last?.meta && last.meta.page * last.meta.limit < last.meta.total ? last.meta.page + 1 : undefined,
    enabled: tab === 'trending',
    staleTime: 120_000,
  })

  const searchQuery = useInfiniteQuery({
    queryKey: ['directory-products-search', tab],
    queryFn: ({ pageParam }) =>
      searchProducts({ sortBy: SEARCH_SORT[tab], page: pageParam, limit: 12 }),
    initialPageParam: 1,
    getNextPageParam: last => (last.page < last.pages ? last.page + 1 : undefined),
    enabled: tab === 'recent' || tab === 'viewed' || tab === 'rated',
    staleTime: 60_000,
  })

  const isSearchTab = tab === 'recent' || tab === 'viewed' || tab === 'rated'

  const feed = useMemo(() => {
    const q = tab === 'featured' ? featuredQuery : trendingQuery
    const out: any[] = []
    for (const page of q.data?.pages ?? []) {
      for (const item of page?.items ?? []) out.push(item)
    }
    return out
  }, [tab, featuredQuery.data, trendingQuery.data])

  const filteredFeed = useMemo(() => {
    if (tab === 'featured') return feed.filter(i => i.type === 'product' && i.reason === 'Trending Product')
    if (tab === 'trending') return feed.filter(i => i.type === 'deal' || i.reason === 'Deals & Offers')
    return []
  }, [tab, feed])

  const searchResults = useMemo(() => {
    const out: any[] = []
    for (const page of searchQuery.data?.pages ?? []) {
      for (const item of page?.results ?? []) out.push(item)
    }
    return out
  }, [searchQuery.data])

  const isLoading = isSearchTab
    ? searchQuery.isLoading
    : tab === 'featured'
      ? featuredQuery.isLoading
      : trendingQuery.isLoading

  const hasNext = isSearchTab
    ? !!searchQuery.hasNextPage
    : tab === 'featured'
      ? !!featuredQuery.hasNextPage
      : !!trendingQuery.hasNextPage

  const isFetchingNext = isSearchTab
    ? searchQuery.isFetchingNextPage
    : tab === 'featured'
      ? featuredQuery.isFetchingNextPage
      : trendingQuery.isFetchingNextPage

  const sentinelRef = useInfiniteScroll(() => {
    if (!hasNext || isFetchingNext) return
    if (isSearchTab) searchQuery.fetchNextPage()
    else if (tab === 'featured') featuredQuery.fetchNextPage()
    else trendingQuery.fetchNextPage()
  }, hasNext)

  const renderFeedItems = (items: any[]) => (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item, i) => {
        const dr = discoverItemToDiscoveryResult(item)
        if (!dr) return null
        return (
          <motion.div
            key={`${dr.id}-${i}`}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: Math.min(i * 0.03, 0.3) }}
          >
            <ProductCard product={fromDiscoveryResult(dr)} variant="compact" />
          </motion.div>
        )
      })}
    </div>
  )

  const renderSearchItems = (items: any[]) => (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((p: any, i: number) => (
        <motion.div
          key={`${p.id}-${i}`}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: Math.min(i * 0.03, 0.3) }}
        >
          <ProductCard product={fromDiscoveryResult(p)} variant="compact" />
        </motion.div>
      ))}
    </div>
  )

  const totalCount =
    isSearchTab
      ? searchQuery.data?.pages?.[0]?.total ?? 0
      : tab === 'featured'
        ? featuredQuery.data?.pages?.[0]?.meta?.total ?? filteredFeed.length
        : trendingQuery.data?.pages?.[0]?.meta?.total ?? filteredFeed.length

  const error =
    isSearchTab ? searchQuery.isError
      : tab === 'featured' ? featuredQuery.isError
        : trendingQuery.isError

  return (
    <SectionShell>
      <DirHeader
        title="Products"
        subtitle={`${totalCount.toLocaleString()} products across the marketplace — every list scales with the catalog.`}
        viewMoreHref="/products"
        viewMoreLabel="All Products"
      />

      <div className="mb-8 flex flex-wrap gap-2">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-medium transition-all',
              tab === t.id
                ? 'border-accent bg-accent text-white shadow-lg'
                : 'border-border bg-surface text-text-secondary hover:border-accent/30 hover:text-text-primary',
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : error ? (
        <SectionError
          label={`${tab} products`}
          onRetry={() =>
            isSearchTab ? searchQuery.refetch() : tab === 'featured' ? featuredQuery.refetch() : trendingQuery.refetch()
          }
        />
      ) : tab === 'gocash' ? (
        <EmptyNote
          icon={<BadgeDollarSign className="h-6 w-6" />}
          text="GOCASH-rewarded products ranking is coming soon — it will appear here automatically when the ranking ships."
          actionHref="/buyer/gocash"
          actionLabel="Learn about GOCASH"
        />
      ) : isSearchTab ? (
        searchResults.length === 0 ? (
          <EmptyNote icon={<Star className="h-6 w-6" />} text={`No ${tab} products yet.`} />
        ) : (
          <>
            {renderSearchItems(searchResults)}
            <InfiniteSentinel ref={sentinelRef} visible={hasNext} loading={isFetchingNext} />
          </>
        )
      ) : filteredFeed.length === 0 ? (
        <EmptyNote icon={<Zap className="h-6 w-6" />} text={`No ${tab} products yet.`} />
      ) : (
        <>
          {renderFeedItems(filteredFeed)}
          <InfiniteSentinel ref={sentinelRef} visible={hasNext} loading={isFetchingNext} />
        </>
      )}

      {isFetchingNext && !hasNext && (
        <div className="mt-6 flex justify-center">
          <Loader2 size={18} className="animate-spin text-accent" />
        </div>
      )}
    </SectionShell>
  )
}
