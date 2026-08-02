'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, DollarSign, BarChart3, Target, ShoppingBag, Loader2 } from 'lucide-react'
import { getFullCommerceInsights, getSalesPotential, getSuggestedPrice, getDemandTrend, getCompetitionAnalysis, getSuggestedAdvertising, type FullCommerceInsightsResponse } from '@/lib/api/ai'

interface CommerceInsightsProps {
  productId: string
}

export function CommerceInsights({ productId }: CommerceInsightsProps) {
  const [loading, setLoading] = useState(false)
  const [insights, setInsights] = useState<FullCommerceInsightsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleLoad = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getFullCommerceInsights(productId)
      setInsights(result)
    } catch {
      setError('Failed to load commerce insights')
    } finally {
      setLoading(false)
    }
  }

  if (!insights && !loading && !error) {
    return (
      <button onClick={handleLoad}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-surface hover:bg-surface-secondary text-sm text-text-primary transition-colors">
        <TrendingUp className="h-4 w-4 text-accent" />
        Load Commerce Insights
      </button>
    )
  }

  if (loading) return (
    <div className="flex items-center gap-2 text-sm text-text-tertiary">
      <Loader2 className="h-4 w-4 animate-spin text-accent" />
      Loading commerce insights...
    </div>
  )

  if (error) return (
    <div className="text-sm text-red-400 flex items-center gap-2">
      <span>{error}</span>
      <button onClick={handleLoad} className="text-accent underline">Retry</button>
    </div>
  )

  if (!insights) return null

  return (
    <Card className="border-border bg-surface mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-text-primary flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-accent" />
          AI Commerce Intelligence
          <span className="text-xs text-text-tertiary font-normal ml-auto">
            Overall: {insights.overallCommerceScore}/100
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        {insights.salesPotential && (
          <div className="p-2 rounded-lg bg-surface-secondary border border-border">
            <div className="flex items-center gap-1 text-xs text-text-tertiary mb-1"><Target className="h-3 w-3" /> Sales Potential</div>
            <div className="text-lg font-bold text-text-primary">{insights.salesPotential.salesPotential}/100</div>
            <div className="text-xs text-text-tertiary">{insights.salesPotential.demandLevel} demand · {insights.salesPotential.competitionLevel} competition</div>
          </div>
        )}
        {insights.suggestedPricing && (
          <div className="p-2 rounded-lg bg-surface-secondary border border-border">
            <div className="flex items-center gap-1 text-xs text-text-tertiary mb-1"><DollarSign className="h-3 w-3" /> Suggested Price</div>
            <div className="text-lg font-bold text-text-primary">₹{insights.suggestedPricing.suggestedPrice}</div>
            <div className="text-xs text-text-tertiary">{insights.suggestedPricing.pricePosition} · {insights.suggestedPricing.suggestedMargin}% margin</div>
          </div>
        )}
        {insights.demandTrend && (
          <div className="p-2 rounded-lg bg-surface-secondary border border-border">
            <div className="flex items-center gap-1 text-xs text-text-tertiary mb-1"><BarChart3 className="h-3 w-3" /> Demand Trend</div>
            <div className="text-lg font-bold text-text-primary capitalize">{insights.demandTrend.trend}</div>
            <div className="text-xs text-text-tertiary">{insights.demandTrend.rfqCount} RFQs · {insights.demandTrend.orderCount} orders</div>
          </div>
        )}
        {insights.competitionAnalysis && (
          <div className="p-2 rounded-lg bg-surface-secondary border border-border">
            <div className="flex items-center gap-1 text-xs text-text-tertiary mb-1"><ShoppingBag className="h-3 w-3" /> Competition</div>
            <div className="text-lg font-bold text-text-primary">{insights.competitionAnalysis.totalCompetitors}</div>
            <div className="text-xs text-text-tertiary">{insights.competitionAnalysis.brandCount} brands · {insights.competitionAnalysis.marketConcentration}</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}