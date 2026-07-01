'use client'
import { useState } from 'react'
import { Sparkles, Loader2, Search, Lightbulb, Package, Building2, BarChart3, UserCheck, TrendingUp, ShoppingBag, Sliders, Shuffle, LayoutDashboard } from 'lucide-react'

type CopilotTab = 'discover' | 'similar' | 'recommend' | 'rank'

interface AiSearchCopilotProps {
  isGenerating: boolean
  onSemanticSearch: (data: any) => Promise<any>
  onSearchIntent: (data: any) => Promise<any>
  onSimilarProducts: (data: any) => Promise<any>
  onSimilarSuppliers: (data: any) => Promise<any>
  onPersonalizedRanking: (data: any) => Promise<any>
  onBuyerRecommendations: (data: any) => Promise<any>
  onSellerRecommendations: (data: any) => Promise<any>
  onSearchSummary: (data: any) => Promise<any>
  onSmartFilters: (data: any) => Promise<any>
  onCrossSellUpsell: (data: any) => Promise<any>
  contextData?: Record<string, unknown>
}

const TABS: { key: CopilotTab; label: string; icon: typeof Search }[] = [
  { key: 'discover', label: 'Discover', icon: Search },
  { key: 'similar', label: 'Similar', icon: Shuffle },
  { key: 'recommend', label: 'Recommend', icon: UserCheck },
  { key: 'rank', label: 'Rank', icon: BarChart3 },
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
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState<string | null>(null)

  const handleAction = async (action: string, fn: (data: any) => Promise<any>, data: any) => {
    setLoading(action)
    try {
      const res = await fn(data)
      setResult(res?.data || res)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <Sparkles className="h-4 w-4 text-orange-400" />
        AI Search Copilot
      </div>

      <div className="flex gap-1 border-b border-white/[0.06] text-xs overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1 px-2 py-1.5 border-b-2 whitespace-nowrap transition-colors ${activeTab === t.key ? 'border-orange-400 text-orange-300' : 'border-transparent text-white/40 hover:text-white/60'}`}>
              <Icon className="h-3 w-3" />
              {t.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'discover' && (
        <div className="space-y-2">
          <p className="text-[11px] text-white/40">Understand intent, summarize results, and generate smart filters</p>
          <input type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Enter a search query..."
            className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-white placeholder-white/30 outline-none focus:border-orange-400/50" />
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => handleAction('intent', onSearchIntent, { query })}
              disabled={loading === 'intent' || !query}
              className="flex items-center gap-1 px-2 py-1 text-[11px] bg-orange-500/10 text-orange-300 rounded hover:bg-orange-500/20 disabled:opacity-40 transition-colors">
              {loading === 'intent' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Lightbulb className="h-3 w-3" />}
              Detect Intent
            </button>
            <button onClick={() => handleAction('semantic', onSemanticSearch, { query })}
              disabled={loading === 'semantic' || !query}
              className="flex items-center gap-1 px-2 py-1 text-[11px] bg-orange-500/10 text-orange-300 rounded hover:bg-orange-500/20 disabled:opacity-40 transition-colors">
              {loading === 'semantic' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
              Semantic Search
            </button>
            <button onClick={() => handleAction('summary', onSearchSummary, { query, ...contextData })}
              disabled={loading === 'summary' || !query}
              className="flex items-center gap-1 px-2 py-1 text-[11px] bg-orange-500/10 text-orange-300 rounded hover:bg-orange-500/20 disabled:opacity-40 transition-colors">
              {loading === 'summary' ? <Loader2 className="h-3 w-3 animate-spin" /> : <LayoutDashboard className="h-3 w-3" />}
              Summary
            </button>
            <button onClick={() => handleAction('filters', onSmartFilters, { query, ...contextData })}
              disabled={loading === 'filters' || !query}
              className="flex items-center gap-1 px-2 py-1 text-[11px] bg-orange-500/10 text-orange-300 rounded hover:bg-orange-500/20 disabled:opacity-40 transition-colors">
              {loading === 'filters' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sliders className="h-3 w-3" />}
              Smart Filters
            </button>
          </div>
        </div>
      )}

      {activeTab === 'similar' && (
        <div className="space-y-2">
          <p className="text-[11px] text-white/40">Find similar products or suppliers</p>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => handleAction('similar-products', onSimilarProducts, { ...contextData })}
              disabled={loading === 'similar-products'}
              className="flex items-center gap-1 px-2 py-1 text-[11px] bg-orange-500/10 text-orange-300 rounded hover:bg-orange-500/20 disabled:opacity-40 transition-colors">
              {loading === 'similar-products' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Package className="h-3 w-3" />}
              Similar Products
            </button>
            <button onClick={() => handleAction('similar-suppliers', onSimilarSuppliers, { ...contextData })}
              disabled={loading === 'similar-suppliers'}
              className="flex items-center gap-1 px-2 py-1 text-[11px] bg-orange-500/10 text-orange-300 rounded hover:bg-orange-500/20 disabled:opacity-40 transition-colors">
              {loading === 'similar-suppliers' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Building2 className="h-3 w-3" />}
              Similar Suppliers
            </button>
          </div>
        </div>
      )}

      {activeTab === 'recommend' && (
        <div className="space-y-2">
          <p className="text-[11px] text-white/40">Get personalized product, supplier, and cross-sell recommendations</p>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => handleAction('buyer-recs', onBuyerRecommendations, { ...contextData })}
              disabled={loading === 'buyer-recs'}
              className="flex items-center gap-1 px-2 py-1 text-[11px] bg-orange-500/10 text-orange-300 rounded hover:bg-orange-500/20 disabled:opacity-40 transition-colors">
              {loading === 'buyer-recs' ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShoppingBag className="h-3 w-3" />}
              Buyer Recs
            </button>
            <button onClick={() => handleAction('seller-recs', onSellerRecommendations, { ...contextData })}
              disabled={loading === 'seller-recs'}
              className="flex items-center gap-1 px-2 py-1 text-[11px] bg-orange-500/10 text-orange-300 rounded hover:bg-orange-500/20 disabled:opacity-40 transition-colors">
              {loading === 'seller-recs' ? <Loader2 className="h-3 w-3 animate-spin" /> : <TrendingUp className="h-3 w-3" />}
              Seller Recs
            </button>
            <button onClick={() => handleAction('cross-sell', onCrossSellUpsell, { ...contextData })}
              disabled={loading === 'cross-sell'}
              className="flex items-center gap-1 px-2 py-1 text-[11px] bg-orange-500/10 text-orange-300 rounded hover:bg-orange-500/20 disabled:opacity-40 transition-colors">
              {loading === 'cross-sell' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Shuffle className="h-3 w-3" />}
              Cross-Sell/Upsell
            </button>
          </div>
        </div>
      )}

      {activeTab === 'rank' && (
        <div className="space-y-2">
          <p className="text-[11px] text-white/40">Personalize ranking and get AI-powered search insights</p>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => handleAction('ranking', onPersonalizedRanking, { query, results: contextData?.results, userContext: contextData?.userContext })}
              disabled={loading === 'ranking'}
              className="flex items-center gap-1 px-2 py-1 text-[11px] bg-orange-500/10 text-orange-300 rounded hover:bg-orange-500/20 disabled:opacity-40 transition-colors">
              {loading === 'ranking' ? <Loader2 className="h-3 w-3 animate-spin" /> : <BarChart3 className="h-3 w-3" />}
              Personalize Ranking
            </button>
            <button onClick={() => handleAction('sidebar', onPersonalizedRanking, { query, ...contextData })}
              disabled={loading === 'sidebar'}
              className="flex items-center gap-1 px-2 py-1 text-[11px] bg-orange-500/10 text-orange-300 rounded hover:bg-orange-500/20 disabled:opacity-40 transition-colors">
              {loading === 'sidebar' ? <Loader2 className="h-3 w-3 animate-spin" /> : <LayoutDashboard className="h-3 w-3" />}
              AI Insights
            </button>
          </div>
        </div>
      )}

      {isGenerating && result === null && (
        <div className="flex items-center gap-2 text-xs text-white/40 py-2">
          <Loader2 className="h-3 w-3 animate-spin" />
          Processing...
        </div>
      )}

      {result && (
        <div className="border border-white/[0.06] rounded bg-white/[0.02] p-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-white/30 font-mono">
              {result.provider}/{result.model} {result.cached && '(cached)'} · {result.latencyMs}ms · ${result.cost}
            </span>
          </div>
          <pre className="text-[11px] text-white/70 max-h-48 overflow-y-auto whitespace-pre-wrap font-mono">
            {typeof result.content === 'string' ? result.content : JSON.stringify(result.content, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
