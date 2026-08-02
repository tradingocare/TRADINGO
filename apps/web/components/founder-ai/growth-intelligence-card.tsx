'use client'
import { TrendingUp, Globe, Building2, Lightbulb } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { GrowthIntelligenceResponse } from '@/lib/api/ai-founder'

interface GrowthIntelligenceCardProps {
  data?: GrowthIntelligenceResponse
  isLoading: boolean
  error?: Error | null
}

export function GrowthIntelligenceCard({ data, isLoading, error }: GrowthIntelligenceCardProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-text-tertiary">
        <LoadingSpinner size="sm" color="accent" />
      </div>
    )
  }
  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-48 text-red-400 text-sm">
        Failed to load growth intelligence
      </div>
    )
  }

  return (
    <Card className="p-4 space-y-3">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          Growth Intelligence
        </CardTitle>
      </CardHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-surface p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-text-secondary">
            <TrendingUp className="h-3 w-3 text-emerald-400" />
            High-Growth Categories
          </div>
          {data.highGrowthCategories.map((c, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-text-secondary">{c.name}</span>
              <span className="text-emerald-400">{c.growthRate.toFixed(0)}%</span>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-border bg-surface p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-text-secondary">
            <Globe className="h-3 w-3 text-blue-400" />
            Emerging Cities
          </div>
          {data.emergingCities.map((c, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-text-secondary">{c.name}, {c.state}</span>
              <span className="text-blue-400">{c.growthRate.toFixed(0)}%</span>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-border bg-surface p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-text-secondary">
            <Building2 className="h-3 w-3 text-purple-400" />
            Emerging Industries
          </div>
          {data.emergingIndustries.map((ind, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-text-secondary">{ind.name}</span>
              <span className="text-purple-400">{ind.growthRate.toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>

      {data.businessOpportunities.length > 0 && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-300">
            <Lightbulb className="h-3 w-3" />
            Business Opportunities
          </div>
          <div className="space-y-1">
            {data.businessOpportunities.map((opp, i) => (
              <div key={i} className="flex items-center justify-between text-[11px]">
                <span className="text-text-secondary">{opp.category}</span>
                <span className="text-text-tertiary">{opp.potentialRevenue}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
