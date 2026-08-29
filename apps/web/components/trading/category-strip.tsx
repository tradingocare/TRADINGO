'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Boxes } from 'lucide-react'
import { cn } from '@/lib/utils'

const DEFAULT_LIMIT = 20

export interface CategoryStripItem {
  id: string
  name: string
  slug: string
  icon: string | null
}

export function CategoryStrip() {
  const [activeCategory, setActiveCategory] = useState<CategoryStripItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  // Preserve existing query params except category, to avoid duplication
  const baseSearch = new URLSearchParams(searchParams.toString())

  // Remove category param from preserved params if present, to be set explicitly
  baseSearch.delete('category')
  // Reset pagination: a category change must restart discovery at page 1
  baseSearch.delete('page')

  // Base path = first segment of current route (e.g. /trading)
  const basePath = `/${pathname.split('/')[1] || ''}`

  // Get existing category from search params, default to 'all'
  const existingCategory = searchParams.get('category') || 'all'

  // Fetch top categories from API
  const {
    data: topCategories,
    isLoading: apiIsLoading,
    error: apiError,
  } = useQuery({
    queryKey: ['categories/top'],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/categories/top?limit=${DEFAULT_LIMIT}`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to fetch top categories')
      const json = (await res.json()) as {
        data: {
          data: Array<{ categoryId: string; categoryName: string; slug: string; icon: string | null }>
          meta: { total: number }
        }
      }
      return {
        data: json.data.data.map((item) => ({ id: item.categoryId, name: item.categoryName, slug: item.slug, icon: item.icon })),
        meta: json.data.meta,
      }
    },
    refetchInterval: false,
    staleTime: 300_000, // 5 minutes, matches BullMQ cache TTL
    enabled: true,
  })

  const categories = topCategories?.data ?? []

  // Update loading state based on API
  useEffect(() => {
    setIsLoading(apiIsLoading)
    if (apiError) {
      setError(apiError.message)
    }
  }, [apiIsLoading, apiError])

  // Determine the active category from the current search params
  useEffect(() => {
    if (existingCategory === 'all') {
      setActiveCategory(null)
    } else {
      const found = categories.find((cat) => cat.slug === existingCategory)
      setActiveCategory(found ?? null)
    }
  }, [existingCategory, categories])

  // Handle "All" selection
  const handleAllSelect = useCallback(() => {
    const newSearch = new URLSearchParams(baseSearch.toString())
    // Remove category param for "All"
    newSearch.delete('category')
    const params = newSearch.toString() || undefined

    router.replace(params ? `${basePath}?${params}` : basePath, { scroll: false })
  }, [baseSearch, basePath, router])

  if (isLoading && !topCategories) {
    return (
      <div className="h-16 overflow-x-auto rounded-lg border border-border bg-surface">
        <div className="flex items-center gap-3 px-3 py-2 text-sm text-text-tertiary">
          <span>Loading categories…</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-16 overflow-x-auto rounded-lg border border-border bg-surface">
        <div className="flex items-center gap-3 px-3 py-2 text-sm text-text-tertiary">
          <span>Error loading categories: {error}</span>
        </div>
      </div>
    )
  }

  // If no categories fetched yet but we have an existing category, show placeholder
  if (categories.length === 0 && existingCategory !== 'all') {
    return (
      <div className="h-16 overflow-x-auto rounded-lg border border-border bg-surface">
        <div className="flex items-center gap-3 px-3 py-2 text-sm text-text-tertiary">
          <span>No categories available</span>
        </div>
      </div>
    )
  }

  const allParams = baseSearch.toString() || undefined
  const allHref = allParams ? `${basePath}?${allParams}` : basePath

  return (
    <div className="flex h-16 items-center gap-1.5 overflow-x-auto rounded-lg border border-border bg-surface px-3">
      {/* "All" button - leftmost, always visible */}
      <Link
        href={allHref}
        className={cn(
          'flex h-12 w-24 flex-shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border px-1.5 text-[10px] font-semibold leading-[1.15] transition-all',
          activeCategory == null
            ? 'border-accent bg-accent text-white shadow-sm'
            : 'text-text-primary hover:bg-surface-secondary border-border/20',
        )}
        onClick={handleAllSelect}
        aria-pressed={activeCategory == null}
        aria-label="Show all categories"
      >
        <Boxes size={12} className="h-3 w-3 flex-shrink-0" />
        <span className="line-clamp-2 whitespace-normal text-center">All</span>
      </Link>

      {/* Ranked categories horizontal scroll */}
      {categories.map((cat) => {
        const isActive = cat.slug === activeCategory?.slug
        const catParams = new URLSearchParams(baseSearch.toString())
        catParams.set('category', cat.slug)
        const catParamsStr = catParams.toString() || undefined
        const catHref = catParamsStr ? `${basePath}?${catParamsStr}` : basePath
        return (
          <Link
            key={cat.id}
            href={catHref}
            className={cn(
              'flex h-12 w-24 flex-shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border px-1.5 text-[10px] font-semibold leading-[1.15] transition-all',
              isActive
                ? 'border-accent bg-accent text-white shadow-lg'
                : 'text-text-primary hover:bg-surface-secondary border-border/20',
            )}
            aria-pressed={isActive}
            aria-label={`View ${cat.name} category`}
          >
            <Boxes size={12} className="h-3 w-3 flex-shrink-0" />
            <span className="line-clamp-2 whitespace-normal text-center">{cat.name}</span>
          </Link>
        )
      })}

      {/* Fallback empty state text when no categories */}
      {categories.length === 0 && (
        <span className="self-center text-xs text-text-tertiary select-none">
          No categories
        </span>
      )}
    </div>
  )
}