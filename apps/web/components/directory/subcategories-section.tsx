'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useInfiniteQuery } from '@tanstack/react-query'
import { ChevronRight, ChevronsUpDown, Layers, Search } from 'lucide-react'
import { getCategories } from '@/lib/api/categories'
import { SectionShell, DirHeader, SectionError, EmptyNote } from './primitives'
import { cn } from '@/lib/utils'

const PAGE = 100
const PER_GROUP_INITIAL = 20
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export function SubcategoriesSection() {
  const [query, setQuery] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [showAllGroups, setShowAllGroups] = useState(false)
  const alphaRef = useRef<HTMLDivElement | null>(null)

  const subcategories = useInfiniteQuery({
    queryKey: ['directory-subcategories'],
    queryFn: ({ pageParam }) => getCategories({ cursor: pageParam, limit: PAGE, isActive: 'true' }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: last => last?.meta?.cursor ?? undefined,
    staleTime: 120_000,
  })

  const all = useMemo(() => {
    const out: any[] = []
    for (const page of subcategories.data?.pages ?? []) {
      for (const item of page?.data ?? []) out.push(item)
    }
    return out
  }, [subcategories.data])

  /** Group flat categories under their parent (sub-categories). Root rows become their own group. */
  const groups = useMemo(() => {
    const map = new Map<string, { id: string; name: string; slug: string; items: any[] }>()
    const q = query.trim().toLowerCase()

    const push = (parentName: string, item: any) => {
      if (q && !`${item.name} ${parentName}`.toLowerCase().includes(q)) return
      if (!map.has(parentName)) {
        map.set(parentName, { id: parentName, name: parentName, slug: '', items: [] })
      }
      map.get(parentName)!.items.push(item)
    }

    for (const cat of all) {
      if (!cat) continue
      const parentName = cat.parent?.name
      if (parentName) {
        push(parentName, cat)
      } else {
        // Root categories — group their children if any are present in the flat list
        const ownChildren = all.filter((c: any) => c.parentId === cat.id)
        if (ownChildren.length === 0) push(cat.name, cat)
      }
    }

    // Sort groups alphabetically, items alphabetically
    return [...map.entries()]
      .map(([name, g]) => ({
        ...g,
        items: [...g.items].sort((a: any, b: any) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [all, query])

  const total = subcategories.data?.pages?.[0]?.meta?.total ?? all.length

  const toggleGroup = (name: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const scrollToLetter = (letter: string) => {
    const el = document.getElementById(`group-${letter}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const lettersPresent = useMemo(() => {
    const set = new Set<string>()
    for (const g of groups) {
      const first = g.name.charAt(0).toUpperCase()
      if (first >= 'A' && first <= 'Z') set.add(first)
    }
    return set
  }, [groups])

  const visibleGroups = showAllGroups ? groups : groups.slice(0, 12)

  return (
    <SectionShell>
      <DirHeader
        title="Sub-categories"
        subtitle={`${total.toLocaleString()} sub-categories grouped by category — searchable, A–Z indexed.`}
        extra={
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search sub-categories"
              className="h-10 w-52 rounded-xl border border-border bg-surface pl-9 pr-3 text-sm text-text-primary placeholder:text-text-tertiary outline-none transition-colors focus:border-accent/50 sm:w-72"
            />
          </div>
        }
      />

      {/* A–Z index */}
      {lettersPresent.size > 0 && (
        <div
          ref={alphaRef}
          className="mb-8 flex flex-wrap gap-1 rounded-2xl border border-border bg-surface p-2"
        >
          {ALPHABET.map(letter => (
            <button
              key={letter}
              onClick={() => scrollToLetter(letter)}
              className={cn(
                'h-8 w-8 rounded-lg text-xs font-bold transition-all',
                lettersPresent.has(letter)
                  ? 'bg-accent/10 text-accent hover:bg-accent/20'
                  : 'text-text-tertiary/40 hover:text-text-tertiary',
              )}
            >
              {letter}
            </button>
          ))}
        </div>
      )}

      {subcategories.isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 rounded-3xl border border-border bg-surface" />
          ))}
        </div>
      ) : subcategories.isError ? (
        <SectionError label="sub-categories" onRetry={() => subcategories.refetch()} />
      ) : visibleGroups.length === 0 ? (
        <EmptyNote
          icon={<Layers className="h-6 w-6" />}
          text={query ? `No sub-categories match "${query}".` : 'No sub-categories yet.'}
          actionHref="/register"
          actionLabel="Register Your Business"
        />
      ) : (
        <>
          <div className="grid gap-5 lg:grid-cols-2">
            {visibleGroups.map(group => {
              const letter = group.name.charAt(0).toUpperCase()
              const isExpanded = expandedGroups.has(group.name)
              const items = isExpanded ? group.items : group.items.slice(0, PER_GROUP_INITIAL)
              return (
                <div
                  key={group.id}
                  id={`group-${letter}`}
                  className="rounded-3xl border border-border bg-surface p-5"
                >
                  <button
                    onClick={() => toggleGroup(group.name)}
                    className="flex w-full items-center justify-between gap-2"
                  >
                    <span className="inline-flex items-center gap-2 font-semibold text-text-primary">
                      <Layers size={15} className="text-accent" />
                      {group.name}
                    </span>
                    <span className="inline-flex items-center gap-2 text-xs text-text-tertiary">
                      {group.items.length} sub-categories
                      <ChevronsUpDown size={13} />
                    </span>
                  </button>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {items.map((sub: any) => (
                      <Link
                        key={sub.id}
                        href={`/categories/${sub.slug}`}
                        className="group inline-flex items-center gap-1 rounded-full border border-border bg-bg-base px-3 py-1.5 text-xs font-medium text-text-secondary transition-all hover:border-accent/30 hover:text-accent"
                      >
                        {sub.name}
                        <ChevronRight size={11} className="text-text-tertiary transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    ))}
                  </div>

                  {group.items.length > PER_GROUP_INITIAL && (
                    <button
                      onClick={() => toggleGroup(group.name)}
                      className="mt-3 text-xs font-semibold text-accent hover:underline"
                    >
                      {isExpanded ? 'Show less' : `Show all ${group.items.length}`}
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {groups.length > 12 && (
            <div className="mt-10 text-center">
              <button
                onClick={() => setShowAllGroups(v => !v)}
                className="inline-flex items-center gap-2 rounded-xl border border-accent/25 bg-accent/10 px-6 py-2.5 text-sm font-semibold text-accent transition-all hover:bg-accent/20"
              >
                <ChevronsUpDown size={14} />
                {showAllGroups ? 'Show top 12 groups' : `Show all ${groups.length} groups`}
              </button>
            </div>
          )}

          {subcategories.hasNextPage && (
            <div className="mt-10 text-center">
              <button
                onClick={() => subcategories.fetchNextPage()}
                disabled={subcategories.isFetchingNextPage}
                className="inline-flex items-center gap-2 rounded-xl border border-accent/25 bg-accent/10 px-6 py-2.5 text-sm font-semibold text-accent transition-all hover:bg-accent/20 disabled:opacity-60"
              >
                Load more
              </button>
            </div>
          )}
        </>
      )}
    </SectionShell>
  )
}
