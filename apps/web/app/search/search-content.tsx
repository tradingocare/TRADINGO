'use client'

import Link from 'next/link'
import { Search, IndianRupee, Package, ChevronLeft, ChevronRight, Star, Store, Sparkles, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useProducts } from '@/hooks'
import SellerBadge, { resolveSellerInfo } from '@/components/shared/SellerBadge'
import { RankBadge } from '@/components/shared/RankBadge'
import { AiSearchCopilot } from '@/components/search/ai-search-copilot'
import {
  useAiSemanticSearch, useAiSearchIntent, useAiSimilarProducts,
  useAiSimilarSuppliers, useAiPersonalizedRanking,
  useAiBuyerRecommendations, useAiSellerRecommendations,
  useAiSearchSummary, useAiSmartFilters, useAiCrossSellUpsell,
} from '@/hooks/use-ai-search'
import ClaimYourGrowth from '@/components/sections/ClaimYourGrowth'

export function SearchContent({ q }: { q: string }) {
  const [page, setPage] = useState(1)
  const [aiSidebar, setAiSidebar] = useState(false)
  const { data, isLoading, error } = useProducts({ search: q, page, limit: 20 })
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
          <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,77,0,0.12)' }}>
            <Search size={24} style={{ color: '#FF4D00' }} />
          </div>
          <h1 className="mt-4 text-2xl font-black text-white">Search Products</h1>
          <p className="mt-2 text-sm text-white/40">Enter a search term to find products across TRADINGO.</p>
        </div>
      </section>
    )
  }

  if (isLoading) {
    const shimmer = 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent'
    return (
      <div className="mx-auto max-w-7xl px-4 pt-24">
        <div className={`h-10 w-96 rounded-2xl ${shimmer}`} style={{ background: 'rgba(255,255,255,0.04)' }} />
        <div className={`mt-2 h-4 w-64 rounded-xl ${shimmer}`} style={{ background: 'rgba(255,255,255,0.04)' }} />
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`rounded-3xl p-6 ${shimmer}`} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className={`h-40 w-full rounded-2xl ${shimmer}`} style={{ background: 'rgba(255,255,255,0.06)' }} />
              <div className={`mt-4 h-5 w-3/4 rounded-xl ${shimmer}`} style={{ background: 'rgba(255,255,255,0.06)' }} />
              <div className={`mt-2 h-6 w-1/3 rounded-xl ${shimmer}`} style={{ background: 'rgba(255,255,255,0.06)' }} />
              <div className={`mt-3 h-4 w-1/2 rounded-xl ${shimmer}`} style={{ background: 'rgba(255,255,255,0.06)' }} />
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
          <h1 className="mt-4 text-2xl font-black text-white">Something went wrong</h1>
          <p className="mt-2 text-sm text-white/40">Failed to load search results. Please try again.</p>
          <button onClick={() => window.location.reload()}
            className="mt-6 px-5 py-2.5 rounded-xl text-xs font-bold transition-all"
            style={{ background: 'rgba(255,77,0,0.15)', border: '1px solid rgba(255,77,0,0.35)', color: '#FF4D00' }}>
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
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,77,0,0.12)' }}>
              <Search size={18} style={{ color: '#FF4D00' }} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">
                Search results for &ldquo;{q}&rdquo;
              </h1>
              <p className="text-sm text-white/40">{total} result{total !== 1 ? 's' : ''} found</p>
            </div>
            <button onClick={() => setAiSidebar(!aiSidebar)}
              className={`ml-auto flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${aiSidebar ? 'text-orange-300 bg-orange-500/15 border border-orange-400/30' : 'text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10'}`}>
              <Sparkles className="h-3.5 w-3.5" />
              AI Search
            </button>
          </div>
        </div>
      </section>

      <section className="py-6 pb-20">
        <div className={`mx-auto ${aiSidebar ? 'max-w-7xl' : 'max-w-7xl'} px-4`}>
          <div className={`flex gap-6 ${aiSidebar ? 'flex-col lg:flex-row' : ''}`}>
          {aiSidebar && (
            <div className="lg:w-80 shrink-0">
              <div className="rounded-2xl p-4 sticky top-24"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-white/50">AI Copilot</span>
                  <button onClick={() => setAiSidebar(false)} className="text-white/30 hover:text-white/60">
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
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <Package size={24} className="text-white/30" />
              </div>
              <h2 className="mt-4 text-xl font-bold text-white">No results found for &ldquo;{q}&rdquo;</h2>
              <p className="mt-2 text-sm text-white/40">Try adjusting your search terms or browse all products.</p>
              <Link href="/products">
                <span className="inline-block mt-6 px-5 py-2.5 rounded-xl text-xs font-bold transition-all"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }}>
                  Browse All Products
                </span>
              </Link>
            </div>
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                  <Link key={product.id} href={`/products/${product.id}`} className="group block">
                    <div className="h-full rounded-3xl overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_12px_48px_rgba(255,77,0,0.12)]"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255,255,255,0.09)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
                      }}>
                      <div className="relative aspect-[4/3] overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={48} className="text-white/10" />
                        </div>
                      </div>
                      <div className="p-5 space-y-3">
                        <SellerBadge
                          seller={resolveSellerInfo(product)}
                          size="xs"
                          showLocation={true}
                          showLogo={false}
                          linkToProfile={true}
                        />

                        <h3 className="text-white font-bold text-sm leading-snug line-clamp-2 group-hover:text-[#FF4D00] transition-colors">
                          {product.name}
                        </h3>

                        <div className="flex items-baseline gap-1">
                          <IndianRupee size={14} style={{ color: '#FF4D00' }} />
                          <span className="text-xl font-black text-white">
                            {product.price?.toLocaleString('en-IN') ?? 'N/A'}
                          </span>
                          {product.unit && <span className="text-xs text-white/40">/{product.unit}</span>}
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {product.category && (
                            <span className="px-2.5 py-1 text-[10px] font-semibold rounded-full"
                              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' }}>
                              {product.category}
                            </span>
                          )}
                          <span className="px-2.5 py-1 text-[10px] font-semibold rounded-full"
                            style={{
                              background: product.stock > 0 ? 'rgba(34,197,94,0.12)' : 'rgba(248,113,113,0.12)',
                              border: `1px solid ${product.stock > 0 ? 'rgba(34,197,94,0.3)' : 'rgba(248,113,113,0.3)'}`,
                              color: product.stock > 0 ? '#4ade80' : '#f87171',
                            }}>
                            {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                          </span>
                          {product.trustScoreSnapshot != null && product.trustScoreSnapshot > 0 && (
                            <span className="px-2 py-1 text-[10px] font-semibold rounded-full flex items-center gap-1"
                              style={{
                                background: product.trustScoreSnapshot >= 80 ? 'rgba(245,158,11,0.12)' : product.trustScoreSnapshot >= 60 ? 'rgba(59,130,246,0.12)' : 'rgba(107,114,128,0.12)',
                                border: `1px solid ${product.trustScoreSnapshot >= 80 ? 'rgba(245,158,11,0.3)' : product.trustScoreSnapshot >= 60 ? 'rgba(59,130,246,0.3)' : 'rgba(107,114,128,0.3)'}`,
                                color: product.trustScoreSnapshot >= 80 ? '#f59e0b' : product.trustScoreSnapshot >= 60 ? '#3b82f6' : '#6b7280',
                              }}>
                              <Star size={10} fill="currentColor" />
                              {product.trustScoreSnapshot}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-4">
                  <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-30"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
                    <ChevronLeft size={14} /> Previous
                  </button>
                  <span className="text-sm text-white/40">Page {page} of {totalPages}</span>
                  <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-30"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
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
