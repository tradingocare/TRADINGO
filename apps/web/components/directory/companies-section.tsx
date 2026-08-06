'use client'

import { useMemo, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { BadgeCheck, Building2, Crown, Loader2, Sparkles } from 'lucide-react'
import CompanyCard from '@/components/company/CompanyCard'
import { getCompanyDirectory, type DirectoryCompany } from '@/lib/api/companies'
import { SectionShell, DirHeader, SectionError, EmptyNote, InfiniteSentinel } from './primitives'
import { useInfiniteScroll } from './use-infinite-scroll'
import { cn } from '@/lib/utils'

type TabId = 'featured' | 'newest' | 'verified' | 'elite'

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'featured', label: 'Featured', icon: <Sparkles size={13} /> },
  { id: 'newest', label: 'Newest', icon: <Building2 size={13} /> },
  { id: 'verified', label: 'Verified', icon: <BadgeCheck size={13} /> },
  { id: 'elite', label: 'Elite', icon: <Crown size={13} /> },
]

function toCardData(c: DirectoryCompany) {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    logo: c.logo,
    bannerUrl: c.banner,
    description: c.description,
    city: c.city ?? '',
    state: c.state ?? '',
    categories: c.categories ?? [],
    isVerified: c.isVerified,
    isTradgoElite: c.isTradgoElite,
    trustScore: c.trustScore,
    rating: c.rating,
    reviewCount: c.reviewCount,
    productCount: c.totalProducts ?? c.productCount ?? 0,
    yearsActive: c.yearsActive ?? 0,
    isGstVerified: !!c.gstNumber,
  }
}

export function CompaniesSection() {
  const [tab, setTab] = useState<TabId>('featured')

  const paramsFor = (t: TabId) => {
    const params: Record<string, string> = { sortBy: t === 'newest' ? 'newest' : 'trustScore' }
    if (t === 'verified') params.verified = 'true'
    if (t === 'elite') params.elite = 'true'
    return params
  }

  const directory = useInfiniteQuery({
    queryKey: ['directory-companies', tab],
    queryFn: ({ pageParam }) =>
      getCompanyDirectory({
        ...paramsFor(tab),
        page: String(pageParam),
        limit: '24',
      }),
    initialPageParam: 1,
    getNextPageParam: last =>
      last.pagination?.hasNext ? last.pagination.page + 1 : undefined,
    staleTime: 60_000,
  })

  const companies = useMemo(() => {
    const out: DirectoryCompany[] = []
    for (const page of directory.data?.pages ?? []) {
      for (const c of page?.companies ?? []) out.push(c)
    }
    return out
  }, [directory.data])

  const total = directory.data?.pages?.[0]?.stats?.totalCompanies ?? companies.length

  const sentinelRef = useInfiniteScroll(() => {
    if (directory.hasNextPage && !directory.isFetchingNextPage) directory.fetchNextPage()
  }, !!directory.hasNextPage)

  return (
    <SectionShell>
      <DirHeader
        title="Companies"
        subtitle={`${total.toLocaleString()} businesses in the directory — trust-ranked, filterable, always live.`}
        viewMoreHref="/companies"
        viewMoreLabel="All Suppliers"
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

      {directory.isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-56 rounded-3xl border border-border bg-surface" />
          ))}
        </div>
      ) : directory.isError ? (
        <SectionError label="companies" onRetry={() => directory.refetch()} />
      ) : companies.length === 0 ? (
        <EmptyNote
          icon={<Building2 className="h-6 w-6" />}
          text={`No ${tab} companies yet.`}
          actionHref="/register"
          actionLabel="Register Your Company"
        />
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {companies.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
              >
                <CompanyCard company={toCardData(c) as any} index={i} />
              </motion.div>
            ))}
          </div>
          <InfiniteSentinel ref={sentinelRef} visible={!!directory.hasNextPage} loading={directory.isFetchingNextPage} />
          {directory.isFetchingNextPage && !directory.hasNextPage && (
            <div className="mt-6 flex justify-center">
              <Loader2 size={18} className="animate-spin text-accent" />
            </div>
          )}
        </>
      )}
    </SectionShell>
  )
}
