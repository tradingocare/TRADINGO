'use client'
import { Calendar, TrendingUp, TrendingDown } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ExecutiveTimelineResponse } from '@/lib/api/ai-founder'

interface Props { data?: ExecutiveTimelineResponse; isLoading: boolean; error?: Error | null }

const PERIODS = ['today', 'thisWeek', 'thisMonth', 'thisQuarter', 'thisYear'] as const
const LABELS: Record<string, string> = { today: 'Today', thisWeek: 'This Week', thisMonth: 'This Month', thisQuarter: 'This Quarter', thisYear: 'This Year' }

export function ExecutiveTimelineCard({ data, isLoading, error }: Props) {
  if (isLoading) return <div className="flex items-center justify-center h-48 text-text-tertiary"><LoadingSpinner size="sm" color="accent" /></div>
  if (error || !data) return <div className="flex items-center justify-center h-48 text-red-400 text-sm">Failed to load timeline</div>

  return (
    <Card className="p-4 space-y-3">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <Calendar className="h-4 w-4 text-blue-400" />
          Executive Timeline
        </CardTitle>
      </CardHeader>
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
        {PERIODS.map((period) => {
          const p = data[period]
          const isPositive = p.revenue > 0
          return (
            <div key={period} className="rounded-lg border border-border bg-surface p-2.5">
              <div className="text-[10px] font-medium text-text-secondary mb-1.5">{LABELS[period]}</div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-text-tertiary">Revenue</span>
                  <span className={`font-medium ${isPositive ? 'text-emerald-400' : 'text-text-secondary'}`}>â‚¹{p.revenue.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-text-tertiary">Orders</span>
                  <span className="font-medium text-text-primary">{p.orders}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-text-tertiary">Signups</span>
                  <span className="font-medium text-text-primary">{p.signups}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-text-tertiary">RFQs</span>
                  <span className="font-medium text-text-primary">{p.rfqs}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-text-tertiary">Missions</span>
                  <span className="font-medium text-accent-500">{p.completedMissions}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-text-tertiary">Disputes</span>
                  <span className={`font-medium ${p.openDisputes > 0 ? 'text-red-400' : 'text-text-secondary'}`}>{p.openDisputes}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
