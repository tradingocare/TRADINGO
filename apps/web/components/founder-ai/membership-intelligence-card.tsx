'use client'
import { Crown, RefreshCw, AlarmClock, TrendingUp } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { MembershipIntelligenceResponse } from '@/lib/api/ai-founder'

interface Props { data?: MembershipIntelligenceResponse; isLoading: boolean; error?: Error | null }

export function MembershipIntelligenceCard({ data, isLoading, error }: Props) {
  if (isLoading) return <div className="flex items-center justify-center h-48 text-text-tertiary"><LoadingSpinner size="sm" color="accent" /></div>
  if (error || !data) return <div className="flex items-center justify-center h-48 text-red-400 text-sm">Failed to load membership intelligence</div>

  return (
    <Card className="p-4 space-y-3">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <Crown className="h-4 w-4 text-yellow-400" />
          Membership Intelligence
        </CardTitle>
      </CardHeader>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-border bg-surface p-3 text-center">
          <p className="text-[11px] font-medium text-text-secondary flex items-center justify-center gap-1"><Crown className="h-3 w-3 text-yellow-400" />Active</p>
          <p className="text-lg font-bold text-text-primary">{data.planDistribution.reduce((a, p) => a + p.subscriberCount, 0)}</p>
          <p className="text-[10px] text-text-tertiary">total subscribers</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-3 text-center">
          <p className="text-[11px] font-medium text-text-secondary flex items-center justify-center gap-1"><RefreshCw className="h-3 w-3 text-blue-400" />Renewals</p>
          <p className="text-lg font-bold text-text-primary">{data.renewals.thisMonth}</p>
          <p className="text-[10px] text-text-tertiary">this month</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-3 text-center">
          <p className="text-[11px] font-medium text-text-secondary flex items-center justify-center gap-1"><AlarmClock className="h-3 w-3 text-red-400" />At Risk</p>
          <p className="text-lg font-bold text-text-primary">{data.renewals.atRisk}</p>
          <p className="text-[10px] text-text-tertiary">expiring &le;30d</p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-2">
        <p className="text-[10px] font-medium text-text-secondary mb-1">Plan Distribution</p>
        {data.planDistribution.map((p, i) => (
          <div key={i} className="flex items-center gap-2 text-[11px] py-0.5">
            <span className="text-text-secondary flex-1">{p.planName}</span>
            <div className="h-1.5 flex-1 rounded-full bg-bg-elevated overflow-hidden">
              <div className="h-full rounded-full bg-accent" style={{ width: `${p.percentage}%` }} />
            </div>
            <span className="text-text-primary w-8 text-right">{p.subscriberCount}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}
