'use client'
import { useState } from 'react'
import { Sparkles, Search, Lightbulb, Package, Building2, BarChart3, UserCheck, TrendingUp, ShoppingBag, Sliders, Shuffle, LayoutDashboard } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Input } from '@/components/ui/input'
import { Tabs, type Tab } from '@/components/ui/tabs'

interface AiCopilotResponse {
  provider: string
  model: string
  cached?: boolean
  latencyMs: number
  cost: number
  content: string | Record<string, unknown>
}

type CopilotTab = 'discover' | 'similar' | 'recommend' | 'rank'

interface AiSearchCopilotProps {
  isGenerating: boolean
  onSemanticSearch: (data: { query: string }) => Promise<unknown>
  onSearchIntent: (data: { query: string }) => Promise<unknown>
  onSimilarProducts: (data: Record<string, unknown>) => Promise<unknown>
  onSimilarSuppliers: (data: Record<string, unknown>) => Promise<unknown>
  onPersonalizedRanking: (data: { query?: string; results?: unknown; userContext?: unknown }) => Promise<unknown>
  onBuyerRecommendations: (data: Record<string, unknown>) => Promise<unknown>
  onSellerRecommendations: (data: Record<string, unknown>) => Promise<unknown>
  onSearchSummary: (data: { query: string } & Record<string, unknown>) => Promise<unknown>
  onSmartFilters: (data: { query: string } & Record<string, unknown>) => Promise<unknown>
  onCrossSellUpsell: (data: Record<string, unknown>) => Promise<unknown>
  contextData?: Record<string, unknown>
}

const tabs: Tab[] = [
  { value: 'discover', label: 'Discover', icon: <Search className="h-3.5 w-3.5" /> },
  { value: 'similar', label: 'Similar', icon: <Shuffle className="h-3.5 w-3.5" /> },
  { value: 'recommend', label: 'Recommend', icon: <UserCheck className="h-3.5 w-3.5" /> },
  { value: 'rank', label: 'Rank', icon: <BarChart3 className="h-3.5 w-3.5" /> },
]

export function AiSearchCopilot({
  isGenerating, contextData = {},
  onSemanticSearch, onSearchIntent,
  onSimilarProducts, onSimilarSuppliers,
  onPersonalizedRanking,
  onBuyerRecommendations, onSellerRecommendations,
  onSearchSummary, onSmartFilters, onCrossSellUpsell,
}: AiSearchCopilotProps) {
  const [activeTab, setActiveTab] = useState<CopilotTab>('discover')
  const [query, setQuery] = useState((contextData?.query as string) || '')
  const [result, setResult] = useState<AiCopilotResponse | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  const handleAction = async <T,>(action: string, fn: (data: T) => Promise<unknown>, data: T) => {
    setLoading(action)
    try {
      const res = await fn(data)
      const unwrapped = (res as { data?: AiCopilotResponse })?.data ?? (res as AiCopilotResponse)
      setResult(unwrapped)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
        <Sparkles className="h-4 w-4 text-accent-500" />
        AI Search Copilot
      </div>

      <Tabs tabs={tabs} value={activeTab} onChange={v => setActiveTab(v as CopilotTab)} />

      {activeTab === 'discover' && (
        <div className="space-y-2">
          <p className="text-[11px] text-text-tertiary">Understand intent, summarize results, and generate smart filters</p>
          <Input type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Enter a search query..."
            className="w-full bg-surface-secondary border border-border rounded px-2 py-1.5 text-xs text-text-primary placeholder-text-tertiary outline-none focus:border-accent-500/50" />
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => handleAction('intent', onSearchIntent, { query })}
              disabled={loading === 'intent' || !query}
              className="flex items-center gap-1 px-2 py-1 text-[11px] bg-accent-500/10 text-accent-500 rounded hover:bg-accent-500/20 disabled:opacity-40 transition-colors">
              {loading === 'intent' ? <LoadingSpinner size="xs" color="accent" /> : <Lightbulb className="h-3 w-3" />}
              Detect Intent
            </button>
            <button onClick={() => handleAction('semantic', onSemanticSearch, { query })}
              disabled={loading === 'semantic' || !query}
              className="flex items-center gap-1 px-2 py-1 text-[11px] bg-accent-500/10 text-accent-500 rounded hover:bg-accent-500/20 disabled:opacity-40 transition-colors">
              {loading === 'semantic' ? <LoadingSpinner size="xs" color="accent" /> : <Search className="h-3 w-3" />}
              Semantic Search
            </button>
            <button onClick={() => handleAction('summary', onSearchSummary, { query, ...contextData })}
              disabled={loading === 'summary' || !query}
              className="flex items-center gap-1 px-2 py-1 text-[11px] bg-accent-500/10 text-accent-500 rounded hover:bg-accent-500/20 disabled:opacity-40 transition-colors">
              {loading === 'summary' ? <LoadingSpinner size="xs" color="accent" /> : <LayoutDashboard className="h-3 w-3" />}
              Summary
            </button>
            <button onClick={() => handleAction('filters', onSmartFilters, { query, ...contextData })}
              disabled={loading === 'filters' || !query}
              className="flex items-center gap-1 px-2 py-1 text-[11px] bg-accent-500/10 text-accent-500 rounded hover:bg-accent-500/20 disabled:opacity-40 transition-colors">
              {loading === 'filters' ? <LoadingSpinner size="xs" color="accent" /> : <Sliders className="h-3 w-3" />}
              Smart Filters
            </button>
          </div>
        </div>
      )}

      {activeTab === 'similar' && (
        <div className="space-y-2">
          <p className="text-[11px] text-text-tertiary">Find similar products or suppliers</p>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => handleAction('similar-products', onSimilarProducts, { ...contextData })}
              disabled={loading === 'similar-products'}
              className="flex items-center gap-1 px-2 py-1 text-[11px] bg-accent-500/10 text-accent-500 rounded hover:bg-accent-500/20 disabled:opacity-40 transition-colors">
              {loading === 'similar-products' ? <LoadingSpinner size="xs" color="accent" /> : <Package className="h-3 w-3" />}
              Similar Products
            </button>
            <button onClick={() => handleAction('similar-suppliers', onSimilarSuppliers, { ...contextData })}
              disabled={loading === 'similar-suppliers'}
              className="flex items-center gap-1 px-2 py-1 text-[11px] bg-accent-500/10 text-accent-500 rounded hover:bg-accent-500/20 disabled:opacity-40 transition-colors">
              {loading === 'similar-suppliers' ? <LoadingSpinner size="xs" color="accent" /> : <Building2 className="h-3 w-3" />}
              Similar Suppliers
            </button>
          </div>
        </div>
      )}

      {activeTab === 'recommend' && (
        <div className="space-y-2">
          <p className="text-[11px] text-text-tertiary">Get personalized product, supplier, and cross-sell recommendations</p>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => handleAction('buyer-recs', onBuyerRecommendations, { ...contextData })}
              disabled={loading === 'buyer-recs'}
              className="flex items-center gap-1 px-2 py-1 text-[11px] bg-accent-500/10 text-accent-500 rounded hover:bg-accent-500/20 disabled:opacity-40 transition-colors">
              {loading === 'buyer-recs' ? <LoadingSpinner size="xs" color="accent" /> : <ShoppingBag className="h-3 w-3" />}
              Buyer Recs
            </button>
            <button onClick={() => handleAction('seller-recs', onSellerRecommendations, { ...contextData })}
              disabled={loading === 'seller-recs'}
              className="flex items-center gap-1 px-2 py-1 text-[11px] bg-accent-500/10 text-accent-500 rounded hover:bg-accent-500/20 disabled:opacity-40 transition-colors">
              {loading === 'seller-recs' ? <LoadingSpinner size="xs" color="accent" /> : <TrendingUp className="h-3 w-3" />}
              Seller Recs
            </button>
            <button onClick={() => handleAction('cross-sell', onCrossSellUpsell, { ...contextData })}
              disabled={loading === 'cross-sell'}
              className="flex items-center gap-1 px-2 py-1 text-[11px] bg-accent-500/10 text-accent-500 rounded hover:bg-accent-500/20 disabled:opacity-40 transition-colors">
              {loading === 'cross-sell' ? <LoadingSpinner size="xs" color="accent" /> : <Shuffle className="h-3 w-3" />}
              Cross-Sell/Upsell
            </button>
          </div>
        </div>
      )}

      {activeTab === 'rank' && (
        <div className="space-y-2">
          <p className="text-[11px] text-text-tertiary">Personalize ranking and get AI-powered search insights</p>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => handleAction('ranking', onPersonalizedRanking, { query, results: contextData?.results, userContext: contextData?.userContext })}
              disabled={loading === 'ranking'}
              className="flex items-center gap-1 px-2 py-1 text-[11px] bg-accent-500/10 text-accent-500 rounded hover:bg-accent-500/20 disabled:opacity-40 transition-colors">
              {loading === 'ranking' ? <LoadingSpinner size="xs" color="accent" /> : <BarChart3 className="h-3 w-3" />}
              Personalize Ranking
            </button>
            <button onClick={() => handleAction('sidebar', onPersonalizedRanking, { query, ...contextData })}
              disabled={loading === 'sidebar'}
              className="flex items-center gap-1 px-2 py-1 text-[11px] bg-accent-500/10 text-accent-500 rounded hover:bg-accent-500/20 disabled:opacity-40 transition-colors">
              {loading === 'sidebar' ? <LoadingSpinner size="xs" color="accent" /> : <LayoutDashboard className="h-3 w-3" />}
              AI Insights
            </button>
          </div>
        </div>
      )}

      {isGenerating && result === null && (
        <div className="flex items-center gap-2 text-xs text-text-tertiary py-2">
          <LoadingSpinner size="xs" color="accent" />
          Processing...
        </div>
      )}

      {result && (
        <div className="border border-border rounded bg-surface p-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-text-tertiary font-mono">
              {result.provider}/{result.model} {result.cached && '(cached)'} Â· {result.latencyMs}ms Â· ${result.cost}
            </span>
          </div>
          <pre className="text-[11px] text-text-primary max-h-48 overflow-y-auto whitespace-pre-wrap font-mono">
            {typeof result.content === 'string' ? result.content : JSON.stringify(result.content, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
