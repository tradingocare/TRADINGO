'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useInfiniteQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Building2, ChevronRight, Factory, Package, Search } from 'lucide-react'
import { getIndustries } from '@/lib/api/industries'
import {
  SectionShell,
  DirHeader,
  SectionError,
  EmptyNote,
  ViewMoreButton,
} from './primitives'

const PAGE = 100

export function IndustriesSection() {
  const [visibleCount, setVisibleCount] = useState(12)
  const [query, setQuery] = useState('')

  const industries = useInfiniteQuery({
    queryKey: ['directory-industries'],
    queryFn: ({ pageParam }) => getIndustries({ cursor: pageParam, limit: PAGE }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: last => last?.meta?.cursor ?? undefined,
    staleTime: 60_000,
  })

  const all = useMemo(() => {
    const out: any[] = []
    for (const page of industries.data?.pages ?? []) {
      for (const item of page?.data ?? []) out.push(item)
    }
    return out
  }, [industries.data])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return all
    return all.filter((i: any) =>
      `${i.name} ${i.description ?? ''}`.toLowerCase().includes(q),
    )
  }, [all, query])

  const visible = filtered.slice(0, visibleCount)
  const hasMore = visible.length < filtered.length
  const total = industries.data?.pages?.[0]?.meta?.total ?? filtered.length

  return (
    <SectionShell>
      <DirHeader
        title="Industries"
        subtitle={`Explore by sector — ${total.toLocaleString()} industries and growing.`}
        viewMoreHref="/industries"
        viewMoreLabel="All Industries"
        extra={
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search industries"
              className="h-10 w-48 rounded-xl border border-border bg-surface pl-9 pr-3 text-sm text-text-primary placeholder:text-text-tertiary outline-none transition-colors focus:border-accent/50 sm:w-56"
            />
          </div>
        }
      />

      {industries.isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="h-36 rounded-3xl border border-border bg-surface"
            />
          ))}
        </div>
      ) : industries.isError ? (
        <SectionError label="industries" onRetry={() => industries.refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyNote
          icon={<Factory className="h-6 w-6" />}
          text={query ? `No industries match "${query}".` : 'No industries yet.'}
          actionHref="/register"
          actionLabel="Register Your Industry"
        />
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((industry: any, i: number) => (
              <motion.div
                key={industry.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
              >
                <Link
                  href={`/industry/${industry.slug}`}
                  className="group flex h-full flex-col rounded-3xl border border-border bg-surface p-6 transition-all duration-300 hover:border-accent/20 hover:shadow-xl"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                    <Factory className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-semibold text-text-primary transition-colors group-hover:text-accent">
                    {industry.name}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-sm text-text-tertiary">
                    {industry.description ?? 'Explore products and suppliers in this industry.'}
                  </p>
                  <div className="mt-auto flex items-center gap-4 pt-4 text-xs text-text-secondary">
                    <span className="inline-flex items-center gap-1">
                      <Package size={12} /> {industry._count?.products ?? 0} products
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Building2 size={12} /> {industry._count?.companies ?? 0} suppliers
                    </span>
                    <ChevronRight
                      size={14}
                      className="ml-auto text-text-tertiary transition-all group-hover:translate-x-1 group-hover:text-accent"
                    />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
          {hasMore && (
            <ViewMoreButton
              remaining={filtered.length - visible.length}
              loading={industries.isFetchingNextPage}
              onClick={() => {
                const next = visibleCount + 24
                const needed = next - all.length
                if (needed > 0 && industries.hasNextPage) industries.fetchNextPage()
                setVisibleCount(next)
              }}
            />
          )}
        </>
      )}
    </SectionShell>
  )
}
