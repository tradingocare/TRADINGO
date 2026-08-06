'use client'
import { Moon, TrendingUp, TrendingDown, Target, AlertTriangle, Clock, Zap } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { EveningSummaryResponse } from '@/lib/api/ai-founder'

interface EveningSummaryCardProps {
  data?: EveningSummaryResponse
  isLoading: boolean
  error?: Error | null
}

export function EveningSummaryCard({ data, isLoading, error }: EveningSummaryCardProps) {
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
        Failed to load evening summary
      </div>
    )
  }

  const stats = [
    { icon: TrendingUp, label: 'Daily Revenue', value: `\u20B9${data.dailyRevenue.toLocaleString()}`, growth: data.dailyGrowth, sub: `${data.dailyOrders} orders` },
    { icon: Target, label: 'Completed Missions', value: data.completedMissions.toString() },
    { icon: AlertTriangle, label: 'Expired RFQs', value: data.missedOpportunities.expiredRfqs.toString() },
    { icon: AlertTriangle, label: 'Cancelled Orders', value: data.missedOpportunities.cancelledOrders.toString() },
    { icon: AlertTriangle, label: 'Abandoned Quotes', value: data.missedOpportunities.abandonedQuotes.toString() },
    { icon: Shield_exp, label: 'Pending Verifications', value: data.pendingActions.pendingVerifications.toString() },
    { icon: Clock, label: 'Overdue Collections', value: data.pendingActions.overdueCollections.toString() },
    { icon: Zap, label: 'Expiring Subscriptions', value: data.pendingActions.expiringSubscriptions.toString() },
  ]

  const missedTotal = data.missedOpportunities.expiredRfqs + data.missedOpportunities.cancelledOrders + data.missedOpportunities.abandonedQuotes

  return (
    <Card className="p-4 space-y-3">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <Moon className="h-4 w-4 text-indigo-400" />
          Evening Summary
          <span className="text-[10px] text-text-tertiary ml-auto">{data.date}</span>
        </CardTitle>
      </CardHeader>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className="rounded-lg border border-border bg-surface p-3">
              <div className="flex items-center gap-1.5 text-[11px] text-text-tertiary mb-1">
                <Icon className="h-3 w-3" />
                {s.label}
              </div>
              <div className="text-lg font-bold text-text-primary">{s.value}</div>
              {s.growth !== undefined && (
                <div className={`flex items-center gap-0.5 text-[11px] mt-0.5 ${s.growth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {s.growth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {s.growth.toFixed(1)}% vs avg
                </div>
              )}
              {s.sub && <div className="text-[11px] text-text-tertiary mt-0.5">{s.sub}</div>}
            </div>
          )
        })}
      </div>
      {missedTotal > 0 && (
        <div className="rounded-lg border border-accent-500/20 bg-accent-500/5 p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-accent-500">
            <AlertTriangle className="h-3 w-3" />
            Missed Opportunities â€” {missedTotal} total
          </div>
          <div className="text-xs text-text-tertiary">
            {data.missedOpportunities.expiredRfqs > 0 && `${data.missedOpportunities.expiredRfqs} RFQs expired. `}
            {data.missedOpportunities.cancelledOrders > 0 && `${data.missedOpportunities.cancelledOrders} orders cancelled. `}
            {data.missedOpportunities.abandonedQuotes > 0 && `${data.missedOpportunities.abandonedQuotes} quotes abandoned.`}
          </div>
        </div>
      )}
      {data.tomorrowFocus.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[11px] font-medium text-text-secondary">Tomorrow Focus</div>
          {data.tomorrowFocus.map((f, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-text-tertiary">
              <span className="text-accent-500 mt-0.5">&#x2022;</span>
              {f}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

const Shield_exp = AlertTriangle
