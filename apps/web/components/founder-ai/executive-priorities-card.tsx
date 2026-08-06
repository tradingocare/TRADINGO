'use client'
import { ListChecks, AlertTriangle, TrendingUp, Shield, DollarSign, Target, Globe } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ExecutivePrioritiesResponse } from '@/lib/api/ai-founder'

interface Props { data?: ExecutivePrioritiesResponse; isLoading: boolean; error?: Error | null }

const IMPACT_ICONS: Record<string, typeof TrendingUp> = {
  Growth: TrendingUp, Trust: Shield, Finance: DollarSign, Revenue: TrendingUp,
  Marketplace: Globe, Operations: Target,
}

export function ExecutivePrioritiesCard({ data, isLoading, error }: Props) {
  if (isLoading) return <div className="flex items-center justify-center h-48 text-text-tertiary"><LoadingSpinner size="sm" color="accent" /></div>
  if (error || !data) return <div className="flex items-center justify-center h-48 text-red-400 text-sm">Failed to load priorities</div>

  return (
    <Card className="p-4 space-y-3">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <ListChecks className="h-4 w-4 text-accent-500" />
          Executive Priorities
        </CardTitle>
      </CardHeader>
      <div className="space-y-2">
        {data.priorities.map((p) => {
          const Icon = IMPACT_ICONS[p.impactArea] ?? Target
          const riskColor = p.riskLevel === 'Critical' ? 'text-red-400' : p.riskLevel === 'High' ? 'text-accent-500' : 'text-yellow-400'
          return (
            <div key={p.rank} className="flex items-start gap-3 rounded-lg border border-border bg-surface p-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-500/10 text-xs font-bold text-accent-500">{p.rank}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Icon className="h-3 w-3 text-gray-400" />
                  <span className="text-sm font-medium text-text-primary">{p.title}</span>
                  <span className={`ml-auto text-[10px] font-medium ${riskColor}`}>{p.riskLevel}</span>
                </div>
                <p className="mt-0.5 text-[11px] text-text-tertiary">{p.description}</p>
                <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-text-tertiary">
                  <span>Impact: {p.impactArea}</span>
                  <span>Revenue: {p.revenueImpact}</span>
                  <span>ROI: {p.roi}</span>
                  <span>Timeline: {p.timeframe}</span>
                </div>
                <div className="mt-1 text-[11px] text-emerald-400/60">{p.recommendedAction}</div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
