'use client'

import { useFullCommerceInsights } from '@/hooks/use-commerce-intelligence'
import { TrendingUp, Loader2, DollarSign, BarChart3, ShoppingBag } from 'lucide-react'

interface CommerceConfidenceProps {
  productId: string
  compact?: boolean
}

export function CommerceConfidence({ productId, compact = false }: CommerceConfidenceProps) {
  const { data, isLoading, error } = useFullCommerceInsights(productId)

  if (isLoading) return <div className="flex items-center gap-2 text-xs text-text-tertiary"><Loader2 className="h-3 w-3 animate-spin text-accent" />Loading insights...</div>
  if (error || !data) return null

  const score = data.overallCommerceScore || 0
  const level = score >= 70 ? 'High' : score >= 40 ? 'Medium' : 'Low'
  const color = score >= 70 ? 'text-emerald-400' : score >= 40 ? 'text-amber-400' : 'text-red-400'
  const barColor = score >= 70 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500'

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-xs">
        <TrendingUp className={`h-3 w-3 ${color}`} />
        <span className="text-text-secondary">Confidence</span>
        <span className={`font-semibold ${color}`}>{level} ({score})</span>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-accent" />
          <span className="text-sm font-medium text-text-primary">Commerce Confidence</span>
        </div>
        <span className={`text-lg font-bold ${color}`}>{score}</span>
      </div>
      <div className="w-full h-1.5 bg-bg-base rounded-full overflow-hidden mb-3">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${score}%` }} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {data.salesPotential && (
          <div className="flex items-center gap-1.5 p-1.5 rounded bg-surface-secondary">
            <BarChart3 className="h-3 w-3 text-blue-400" />
            <span className="text-text-tertiary">Potential</span>
            <span className="font-medium text-text-primary ml-auto">{data.salesPotential.salesPotential}</span>
          </div>
        )}
        {data.suggestedPricing && (
          <div className="flex items-center gap-1.5 p-1.5 rounded bg-surface-secondary">
            <DollarSign className="h-3 w-3 text-emerald-400" />
            <span className="text-text-tertiary">Price</span>
            <span className="font-medium text-text-primary ml-auto">₹{data.suggestedPricing.suggestedPrice}</span>
          </div>
        )}
        {data.demandTrend && (
          <div className="flex items-center gap-1.5 p-1.5 rounded bg-surface-secondary">
            <TrendingUp className="h-3 w-3 text-purple-400" />
            <span className="text-text-tertiary">Demand</span>
            <span className={`font-medium ml-auto capitalize ${
              data.demandTrend.trend === 'increasing' ? 'text-emerald-400' : data.demandTrend.trend === 'declining' ? 'text-red-400' : 'text-amber-400'
            }`}>{data.demandTrend.trend}</span>
          </div>
        )}
        {data.competitionAnalysis && (
          <div className="flex items-center gap-1.5 p-1.5 rounded bg-surface-secondary">
            <ShoppingBag className="h-3 w-3 text-rose-400" />
            <span className="text-text-tertiary">Competitors</span>
            <span className="font-medium text-text-primary ml-auto">{data.competitionAnalysis.totalCompetitors}</span>
          </div>
        )}
      </div>
    </div>
  )
}