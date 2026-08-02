'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Boxes, ChevronRight, Flame, Search, Sparkles } from 'lucide-react'
import { getCategories, getCategoryTree } from '@/lib/api/categories'
import { getDiscoveryFeed } from '@/lib/api/discovery'
import { useCategoryTree } from '@/hooks/use-categories'
import { SectionShell, DirHeader, SectionError, EmptyNote } from './primitives'
import { cn } from '@/lib/utils'

type Tab = 'featured' | 'popular' | 'all'

const TABS: { id: Tab; label: string }[] = [
  { id: 'featured', label: 'Featured' },
  { id: 'popular', label: 'Popular' },
  { id: 'all', label: 'All Categories' },
]

export function CategoriesSection() {
  const [tab, setTab] = useState<Tab>('featured')
  const [query, setQuery] = useState('')

  const categoryTree = useCategoryTree()
  const discover = useQuery({
    queryKey: ['directory-discover'],
    queryFn: () => getDiscoveryFeed(1, 72),
    staleTime: 120_000,
  })

  const allCategories = useInfiniteQuery({
    queryKey: ['directory-all-categories', query],
    queryFn: ({ pageParam }) =>
      getCategories({ cursor: pageParam, limit: 100, search: query.trim() || undefined, isActive: 'true' }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: last => last?.meta?.cursor ?? undefined,
    enabled: tab === 'all',
    staleTime: 60_000,
  })

  const tree = useMemo(() => {
    const t: any = categoryTree.data
    return Array.isArray(t) ? t : (t?.data ?? [])
  }, [categoryTree.data])

  const featured = useMemo(
    () =>
      [...tree]
        .sort((a: any, b: any) => (b._count?.products ?? 0) - (a._count?.products ?? 0))
        .slice(0, 8),
    [tree],
  )

  const popular = useMemo(() => {
    const items = discover.data?.items ?? []
    return items.filter(i => i.type === 'category').slice(0, 8)
  }, [discover.data])

  const allList = useMemo(() => {
    const out: any[] = []
    for (const page of allCategories.data?.pages ?? []) {
      for (const item of page?.data ?? []) out.push(item)
    }
    return out
  }, [allCategories.data])

  const allSorted = useMemo(() => [...allList].sort((a: any, b: any) => a.name.localeCompare(b.name)), [allList])
  const total = allCategories.data?.pages?.[0]?.meta?.total ?? tree.length

  const renderGrid = (items: any[], label: string, skeletonKey: string) => {
    if (allCategories.isLoading && tab === 'all' && label === 'all') {
      return (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={`${skeletonKey}-${i}`} className="h-28 rounded-3xl border border-border bg-surface" />
          ))}
        </div>
      )
    }
    if (items.length === 0) {
      return (
        <EmptyNote
          icon={<Boxes className="h-6 w-6" />}
          text={query ? `No categories match "${query}".` : 'No categories yet.'}
          actionHref="/register"
          actionLabel="List a Category"
        />
      )
    }
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((cat: any, i: number) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: Math.min(i * 0.03, 0.3) }}
          >
            <Link
              href={`/categories/${cat.slug}`}
              className="group flex h-full items-start gap-4 rounded-3xl border border-border bg-surface p-5 transition-all duration-300 hover:border-accent/20 hover:shadow-xl"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Boxes className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="truncate font-semibold text-text-primary transition-colors group-hover:text-accent">
                  {cat.name}
                </h3>
                <p className="mt-0.5 text-xs text-text-tertiary">
                  {cat._count?.products ?? 0} products · {cat._count?.children ?? 0} sub-categories
                </p>
              </div>
              <ChevronRight
                size={14}
                className="ml-auto mt-1 flex-shrink-0 text-text-tertiary transition-all group-hover:translate-x-1 group-hover:text-accent"
              />
            </Link>
          </motion.div>
        ))}
      </div>
    )
  }

  return (
    <SectionShell>
      <DirHeader
        title="Categories"
        subtitle={`Browse the full TRADINGO taxonomy — ${total.toLocaleString()} categories today, scaling to 160+ at launch.`}
        viewMoreHref="/categories"
        viewMoreLabel="All Categories"
      />

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex rounded-xl border border-border bg-surface p-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                tab === t.id
                  ? 'bg-accent text-white shadow-lg'
                  : 'text-text-secondary hover:text-text-primary',
              )}
            >
              {t.id === 'featured' && <Sparkles size={13} />}
              {t.id === 'popular' && <Flame size={13} />}
              {t.id === 'all' && <Boxes size={13} />}
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'all' && (
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search categories"
              className="h-10 w-48 rounded-xl border border-border bg-surface pl-9 pr-3 text-sm text-text-primary placeholder:text-text-tertiary outline-none transition-colors focus:border-accent/50 sm:w-64"
            />
          </div>
        )}
      </div>

      {tab === 'featured' &&
        (categoryTree.isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={`ft-${i}`} className="h-28 rounded-3xl border border-border bg-surface" />
            ))}
          </div>
        ) : (
          renderGrid(featured, 'featured', 'ft')
        ))}

      {tab === 'popular' &&
        (discover.isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={`pp-${i}`} className="h-28 rounded-3xl border border-border bg-surface" />
            ))}
          </div>
        ) : (
          renderGrid(popular.map(p => p.data), 'popular', 'pp')
        ))}

      {tab === 'all' &&
        (allCategories.isError ? (
          <SectionError label="categories" onRetry={() => allCategories.refetch()} />
        ) : (
          <>
            {renderGrid(allSorted, 'all', 'al')}
            {allCategories.hasNextPage && (
              <div className="mt-10 text-center">
                <button
                  onClick={() => allCategories.fetchNextPage()}
                  disabled={allCategories.isFetchingNextPage}
                  className="inline-flex items-center gap-2 rounded-xl border border-accent/25 bg-accent/10 px-6 py-2.5 text-sm font-semibold text-accent transition-all hover:bg-accent/20 disabled:opacity-60"
                >
                  Load more categories
                </button>
              </div>
            )}
          </>
        ))}
    </SectionShell>
  )
}
