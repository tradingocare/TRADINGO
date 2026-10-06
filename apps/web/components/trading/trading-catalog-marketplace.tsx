'use client'

/**
 * /trading CATEGORY MARKETPLACE LAYER
 *
 *   MAIN COLUMN                          │  RIGHT RAIL
 *   ──────────────────────────────────── │  ────────────────────
 *   context results panel                │  Popular Products
 *   ("Products in {selection}")          │  (context-aware)
 *   ↓                                    │
 *   wide category cards — every catalog category, top to bottom
 *   (name → image box → subcategory columns of real listings → View All)
 *
 * The selection lives in the URL so every part of the page agrees:
 *   ?catalogCategory={slug}&catalogSubcategory={slug}
 *
 * Data (existing public endpoints only — no API/DB change):
 *   tree + rows          : GET /marketplace-catalog-bridge/categories/tree
 *   context results      : GET /marketplace-catalog-bridge/products/search
 *   category card rows   : GET /marketplace-catalog-bridge/products/search?catalogSubcategoryId
 *   service rows         : GET /tradeserv/search/v2?catalogSubcategoryId
 *
 * The context results reuse the shipped detailed ProductCard (unmodified) and the shipped
 * fromEnrichedProduct converter. Category-card rows are fetched lazily as each card nears
 * the viewport, so listing all 160 categories never fires 1,600 queries at once.
 */

import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Package, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'
import { useEnrichedCategoryTree, useEnrichedProductSearch } from '@/hooks'
import { ProductCard, ProductCardSkeleton } from '@/components/product/product-card'
import { fromEnrichedProduct } from '@/components/product/card-converters'
import { marketplaceHref, type CatalogCategoryNode } from './category-card'
import { CategoryMarketplaceCard } from './category-marketplace-card'
import { PopularProductsRail } from './popular-products-rail'

// Kept small on purpose: the context panel is a preview of the current selection, while the
// category cards below carry the catalog-wide browsing experience.
const PAGE_SIZE = 3

function ResultsEmpty({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-6 py-12 text-center">
      <Package className="mx-auto h-8 w-8 text-text-tertiary" />
      <p className="mt-3 text-sm font-semibold text-text-secondary">No products in {label} yet</p>
      <p className="mt-1 text-xs text-text-tertiary">
        Try another subcategory, or browse the category cards below.
      </p>
      <Link href="/trading" className="mt-3 inline-block text-xs font-semibold text-accent hover:underline">
        Clear selection
      </Link>
    </div>
  )
}

/** Shared selection state: URL slugs resolved against the authoritative tree.
 * Each rail calls this independently (React Query cache dedupes the fetches). */
function useCatalogSelection() {
  const params = useSearchParams()
  const categorySlug = params.get('catalogCategory') || undefined
  const subcategorySlug = params.get('catalogSubcategory') || undefined

  const tree = useEnrichedCategoryTree()
  const catalogTree: CatalogCategoryNode[] = useMemo(
    () => ((tree.data?.catalogTree ?? []) as unknown as CatalogCategoryNode[]).filter(c => c.subcategories?.length > 0),
    [tree.data],
  )

  // ── Resolve the URL slugs to canonical IDs against the authoritative tree ──
  const selectedCategory = useMemo(
    () => (categorySlug ? catalogTree.find(c => c.slug === categorySlug) : undefined),
    [catalogTree, categorySlug],
  )
  const selectedSubcategory = useMemo(
    () => (subcategorySlug ? selectedCategory?.subcategories.find(s => s.slug === subcategorySlug) : undefined),
    [selectedCategory, subcategorySlug],
  )

  const context = {
    catalogCategoryId: selectedCategory?.id,
    catalogSubcategoryId: selectedSubcategory?.id,
  }

  const label = selectedSubcategory?.name ?? selectedCategory?.name ?? 'All Categories'

  return { categorySlug, subcategorySlug, tree, catalogTree, selectedCategory, selectedSubcategory, context, label }
}

/** LEFT rail piece: "Products in {selection}" context results.
 * Always rendered — the parent layout decides placement. */
export function CatalogContextPanel() {
  const { context, label, categorySlug, subcategorySlug } = useCatalogSelection()
  const [page, setPage] = useState(1)

  const results = useEnrichedProductSearch({ ...context, page, limit: PAGE_SIZE })
  const products = useMemo(
    () => (results.data?.data ?? []).map((p: any) => fromEnrichedProduct(p)),
    [results.data],
  )
  const total = results.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  // Reset to page 1 whenever the selection changes.
  const selectionKey = `${categorySlug ?? ''}|${subcategorySlug ?? ''}`
  const [lastKey, setLastKey] = useState(selectionKey)
  if (lastKey !== selectionKey) {
    setLastKey(selectionKey)
    setPage(1)
  }

  return (
    <div className="min-w-0">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3 py-2.5">
        <h2 className="min-w-0 truncate text-[15px] font-extrabold text-text-primary">
          Products in {label}
        </h2>
        {!results.isLoading && !results.isError && (
          <span className="rounded-full bg-bg-elevated px-2.5 py-0.5 text-[11px] font-semibold text-text-secondary">
            {total.toLocaleString('en-IN')} results
          </span>
        )}
      </div>

      {results.isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      )}

      {!results.isLoading && results.isError && (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-8 text-xs text-text-tertiary">
          <AlertCircle size={14} /> Products could not be loaded. Please try again.
        </div>
      )}

      {!results.isLoading && !results.isError && products.length === 0 && <ResultsEmpty label={label} />}

      {!results.isLoading && !results.isError && products.length > 0 && (
        <>
          <div className="space-y-4">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>

          {totalPages > 1 && (
            <nav className="mt-4 flex items-center justify-between" aria-label="Product pagination">
              <button
                type="button"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={13} /> Previous
              </button>
              <span className="text-[11px] text-text-tertiary">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next <ChevronRight size={13} />
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  )
}

/** Category browser piece: "Browse all categories" + tree + cards. */
export function CatalogBrowser({ basePath = '/trading' }: { basePath?: string }) {
  const { tree, catalogTree, selectedCategory } = useCatalogSelection()

  return (
    <div className="min-w-0">
      <div className="mt-6 mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary">
          Browse all categories
        </h2>
        {!tree.isLoading && !tree.isError && (
          <span className="text-[11px] text-text-tertiary">
            {catalogTree.length.toLocaleString('en-IN')} categories
          </span>
        )}
      </div>

      {tree.isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl border border-border bg-surface" />
          ))}
        </div>
      )}

      {tree.isError && (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-8 text-xs text-text-tertiary">
          <AlertCircle size={14} /> Categories unavailable right now.
        </div>
      )}

      {!tree.isLoading && !tree.isError && (
        <div className="space-y-4">
          {catalogTree.map(cat => (
            <CategoryMarketplaceCard
              key={cat.id}
              category={cat}
              isSelected={cat.slug === (selectedCategory?.slug ?? catalogTree[0]?.slug)}
              basePath={basePath}
            />
          ))}
          {catalogTree.length === 0 && (
            <div className="rounded-xl border border-border bg-surface px-4 py-6 text-[11px] text-text-tertiary">
              No categories published yet.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/** RIGHT rail piece: Popular Products + reset link. */
export function CatalogPopularRail({ basePath = '/trading' }: { basePath?: string }) {
  const { context, label, categorySlug, subcategorySlug } = useCatalogSelection()

  return (
    <div className="min-w-0">
      <PopularProductsRail
        context={{
          ...context,
          label,
          categorySlug,
          subcategorySlug,
        }}
        basePath={basePath}
      />
      <Link
        href={marketplaceHref(basePath, {})}
        className="mt-2 block text-center text-[10px] text-text-tertiary hover:text-accent"
      >
        Reset to all categories
      </Link>
    </div>
  )
}

export function TradingCatalogMarketplace({ basePath = '/trading' }: { basePath?: string }) {
  return (
    // Wider than the page's max-w-7xl on purpose: the reference composition gives the
    // category cards the available width while the rail keeps its column.
    <section
      className="mx-auto w-full max-w-[1500px] px-4 pb-8 2xl:max-w-[1640px]"
      aria-label="Category marketplace"
    >
      {/* Wide main column from 1280 up (cards + context results); the rail becomes the
          right column there and stacks below on tablet/mobile, preserving the approved
          responsive ladder. */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <CatalogContextPanel />
          <CatalogBrowser basePath={basePath} />
        </div>
        <div className="min-w-0">
          <CatalogPopularRail basePath={basePath} />
        </div>
      </div>
    </section>
  )
}
