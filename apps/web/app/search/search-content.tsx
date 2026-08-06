'use client'

import Link from 'next/link'
import { Search, Package, ChevronLeft, ChevronRight, Sparkles, X, FolderTree } from 'lucide-react'
import { useState, useMemo } from 'react'
import { useEnrichedProductSearch } from '@/hooks'
import { ProductCard } from '@/components/product/product-card'
import { fromEnrichedProduct } from '@/components/product/card-converters'
import { AiSearchCopilot } from '@/components/search/ai-search-copilot'
import { BrandSelect } from '@/components/enterprise-catalog/brand-select'
import { useCategoryTree } from '@/hooks/use-categories'
import {
  useAiSemanticSearch, useAiSearchIntent, useAiSimilarProducts,
  useAiSimilarSuppliers, useAiPersonalizedRanking,
  useAiBuyerRecommendations, useAiSellerRecommendations,
  useAiSearchSummary, useAiSmartFilters, useAiCrossSellUpsell,
} from '@/hooks/use-ai-search'
import ClaimYourGrowth from '@/components/sections/ClaimYourGrowth'

export function SearchContent({ q }: { q: string }) {
  const [page, setPage] = useState(1)
  const [brandFilter, setBrandFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [aiSidebar, setAiSidebar] = useState(false)
  const { data: categoryTree } = useCategoryTree()
  const { data, isLoading, error } = useEnrichedProductSearch({ q, brand: brandFilter || undefined, categoryId: categoryFilter || undefined, page, limit: 20 })

  const categoryOptions = useMemo(() => {
    if (!categoryTree) return []
    return categoryTree.map(c => ({ id: c.id, name: c.name }))
  }, [categoryTree])
  const products = data?.data || []
  const total = data?.total || 0
  const totalPages = data?.totalPages || 1

  const semanticSearch = useAiSemanticSearch()
  const searchIntent = useAiSearchIntent()
  const similarProducts = useAiSimilarProducts()
  const similarSuppliers = useAiSimilarSuppliers()
  const personalizedRanking = useAiPersonalizedRanking()
  const buyerRecommendations = useAiBuyerRecommendations()
  const sellerRecommendations = useAiSellerRecommendations()
  const searchSummary = useAiSearchSummary()
  const smartFilters = useAiSmartFilters()
  const crossSellUpsell = useAiCrossSellUpsell()

  if (!q) {
    return (
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(245, 158, 11, 0.12)' }}>
            <Search size={24} className="text-accent-500" />
          </div>
          <h1 className="mt-4 text-2xl font-black text-text-primary">Search Products</h1>
          <p className="mt-2 text-sm text-text-tertiary">Enter a search term to find products across TRADINGO.</p>
        </div>
      </section>
    )
  }

  if (isLoading) {
    const shimmer = 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent'
    return (
      <div className="mx-auto max-w-7xl px-4 pt-24">
        <div className={`h-10 w-96 rounded-2xl ${shimmer} bg-surface`} />
        <div className={`mt-2 h-4 w-64 rounded-xl ${shimmer} bg-surface`} />
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`rounded-3xl p-6 ${shimmer} bg-surface border-border`}>
              <div className={`h-40 w-full rounded-2xl ${shimmer} bg-surface`} />
              <div className={`mt-4 h-5 w-3/4 rounded-xl ${shimmer} bg-surface`} />
              <div className={`mt-2 h-6 w-1/3 rounded-xl ${shimmer} bg-surface`} />
              <div className={`mt-3 h-4 w-1/2 rounded-xl ${shimmer} bg-surface`} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(248,113,113,0.12)' }}>
            <Package size={24} style={{ color: '#f87171' }} />
          </div>
          <h1 className="mt-4 text-2xl font-black text-text-primary">Something went wrong</h1>
          <p className="mt-2 text-sm text-text-tertiary">Failed to load search results. Please try again.</p>
          <button onClick={() => window.location.reload()}
            className="mt-6 px-5 py-2.5 rounded-xl text-xs font-bold transition-all bg-accent/15 border-accent/30 text-accent">
            Try Again
          </button>
        </div>
      </section>
    )
  }

  return (
    <>
      <section className="pt-24 pb-6">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245, 158, 11, 0.12)' }}>
              <Search size={18} className="text-accent-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-text-primary">
                Search results for &ldquo;{q}&rdquo;
              </h1>
              <p className="text-sm text-text-tertiary">{total} result{total !== 1 ? 's' : ''} found</p>
            </div>
            <button onClick={() => setAiSidebar(!aiSidebar)}
              className={`ml-auto flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${aiSidebar ? 'text-orange-300 bg-orange-500/15 border border-orange-400/30' : 'text-text-tertiary hover:text-text-primary bg-surface hover:bg-bg-elevated border border-border'}`}>
              <Sparkles className="h-3.5 w-3.5" />
              AI Search
            </button>
          </div>
        </div>
      </section>

      <section className="pb-4">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-semibold text-text-tertiary">Filter by brand:</span>
            <div className="w-56">
              <BrandSelect
                value={brandFilter}
                onChange={(_, name) => { setBrandFilter(name); setPage(1) }}
                placeholder="All brands"
              />
            </div>
            {brandFilter && (
              <button onClick={() => { setBrandFilter(''); setPage(1) }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-text-secondary hover:text-text-primary bg-surface border-border transition-colors">
                <X className="h-3 w-3" /> Clear
              </button>
            )}
            <span className="text-xs font-semibold text-text-tertiary ml-2">Category:</span>
            <div className="w-48">
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }}
                className="w-full surface-card py-2 pl-3 pr-8 text-xs text-text-primary border-border rounded-xl focus:outline-none focus:border-accent/30 appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                }}
              >
                <option value="">All categories</option>
                {categoryOptions.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            {categoryFilter && (
              <button onClick={() => { setCategoryFilter(''); setPage(1) }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-text-secondary hover:text-text-primary bg-surface border-border transition-colors">
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="py-6 pb-20">
        <div className={`mx-auto ${aiSidebar ? 'max-w-7xl' : 'max-w-7xl'} px-4`}>
          <div className={`flex gap-6 ${aiSidebar ? 'flex-col lg:flex-row' : ''}`}>
          {aiSidebar && (
            <div className="lg:w-80 shrink-0">
              <div className="rounded-2xl p-4 sticky top-24 bg-surface border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-text-tertiary">AI Copilot</span>
                  <button onClick={() => setAiSidebar(false)} className="text-text-tertiary hover:text-text-primary">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <AiSearchCopilot
                  isGenerating={semanticSearch.isPending || searchIntent.isPending || similarProducts.isPending || similarSuppliers.isPending || personalizedRanking.isPending || buyerRecommendations.isPending || sellerRecommendations.isPending || searchSummary.isPending || smartFilters.isPending || crossSellUpsell.isPending}
                  contextData={{ query: q, totalResults: total, topResults: products?.slice(0, 5) }}
                  onSemanticSearch={(d) => semanticSearch.mutateAsync(d)}
                  onSearchIntent={(d) => searchIntent.mutateAsync(d)}
                  onSimilarProducts={(d) => similarProducts.mutateAsync(d)}
                  onSimilarSuppliers={(d) => similarSuppliers.mutateAsync(d)}
                  onPersonalizedRanking={(d) => personalizedRanking.mutateAsync(d)}
                  onBuyerRecommendations={(d) => buyerRecommendations.mutateAsync(d)}
                  onSellerRecommendations={(d) => sellerRecommendations.mutateAsync(d)}
                  onSearchSummary={(d) => searchSummary.mutateAsync(d)}
                  onSmartFilters={(d) => smartFilters.mutateAsync(d)}
                  onCrossSellUpsell={(d) => crossSellUpsell.mutateAsync(d)}
                />
              </div>
            </div>
          )}
          <div className="flex-1 min-w-0">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-surface">
                <Package size={24} className="text-text-tertiary" />
              </div>
              <h2 className="mt-4 text-xl font-bold text-text-primary">No results found for &ldquo;{q}&rdquo;</h2>
              <p className="mt-2 text-sm text-text-tertiary">Try adjusting your search terms or browse all products.</p>
              <Link href="/products">
                  <span className="inline-block mt-6 px-5 py-2.5 rounded-xl text-xs font-bold text-text-secondary transition-all bg-surface border-border">
                  Browse All Products
                </span>
              </Link>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={fromEnrichedProduct(product)}
                    variant="compact"
                    features={{ showTrustScore: true, showBrand: true, showCompare: false, showWishlist: false, showActions: false }}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-4">
                  <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary transition-all disabled:opacity-30 bg-surface border-border">
                    <ChevronLeft size={14} /> Previous
                  </button>
                  <span className="text-sm text-text-tertiary">Page {page} of {totalPages}</span>
                  <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary transition-all disabled:opacity-30 bg-surface border-border">
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
          </div>
        </div>
      </section>

      <ClaimYourGrowth />
    </>
  )
}
