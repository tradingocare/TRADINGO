'use client'
import { Activity, TrendingUp, Users, Shield, DollarSign, Globe, Zap } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { HealthScoreResponse } from '@/lib/api/ai-founder'

interface Props { data?: HealthScoreResponse; isLoading: boolean; error?: Error | null }

const DIMENSION_ICONS: Record<string, typeof Activity> = {
  revenue: TrendingUp, growth: Users, retention: Activity, trust: Shield,
  collections: DollarSign, marketplaceHealth: Globe, ecosystemReadiness: Zap,
}

export function HealthScoreCard({ data, isLoading, error }: Props) {
  if (isLoading) return <div className="flex items-center justify-center h-48 text-text-tertiary"><LoadingSpinner size="sm" color="accent" /></div>
  if (error || !data) return <div className="flex items-center justify-center h-48 text-red-400 text-sm">Failed to load health score</div>

  const dimensions = [
    { key: 'revenue', label: 'Revenue', score: data.revenue.score, contribution: data.revenue.contribution, weight: data.revenue.weight },
    { key: 'growth', label: 'Growth', score: data.growth.score, contribution: data.growth.contribution, weight: data.growth.weight },
    { key: 'retention', label: 'Retention', score: data.retention.score, contribution: data.retention.contribution, weight: data.retention.weight },
    { key: 'trust', label: 'Trust', score: data.trust.score, contribution: data.trust.contribution, weight: data.trust.weight },
    { key: 'collections', label: 'Collections', score: data.collections.score, contribution: data.collections.contribution, weight: data.collections.weight },
    { key: 'marketplaceHealth', label: 'Marketplace', score: data.marketplaceHealth.score, contribution: data.marketplaceHealth.contribution, weight: data.marketplaceHealth.weight },
    { key: 'ecosystemReadiness', label: 'Ecosystem', score: data.ecosystemReadiness.score, contribution: data.ecosystemReadiness.contribution, weight: data.ecosystemReadiness.weight },
  ]

  return (
    <Card className="p-4 space-y-3">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <Activity className="h-4 w-4 text-emerald-400" />
          Business Health Score
        </CardTitle>
      </CardHeader>
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-emerald-500/30 bg-emerald-500/10">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-400">{data.overallScore}</div>
            <div className="text-[10px] font-medium text-emerald-400/60">{data.grade}</div>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          {dimensions.map((d) => {
            const Icon = DIMENSION_ICONS[d.key] ?? Activity
            const pct = data.overallScore > 0 ? Math.round((d.contribution / data.overallScore) * 100) : 0
            return (
              <div key={d.key} className="flex items-center gap-2 text-xs">
                <Icon className="h-3 w-3 shrink-0 text-gray-400" />
                <span className="w-20 text-text-secondary">{d.label}</span>
                <Progress value={d.score} size="sm" variant="success" className="flex-1" />
                <span className="w-8 text-right font-medium text-text-primary">{d.score}</span>
                <span className="w-10 text-right text-[10px] text-text-tertiary">{pct}%</span>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
