'use client'
import { Sun, TrendingUp, TrendingDown, Users, FileText, DollarSign, AlertTriangle, Shield } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { MorningBriefResponse } from '@/lib/api/ai-founder'

interface MorningBriefCardProps {
  data?: MorningBriefResponse
  isLoading: boolean
  error?: Error | null
}

export function MorningBriefCard({ data, isLoading, error }: MorningBriefCardProps) {
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
        Failed to load morning brief
      </div>
    )
  }

  const stats = [
    { icon: DollarSign, label: 'Revenue Today', value: `\u20B9${data.revenue.today.toLocaleString()}`, change: data.revenue.change, changeType: data.revenue.changeType },
    { icon: TrendingUp, label: 'Orders Today', value: data.orders.today.toString(), change: data.orders.change > 0 ? `+${data.orders.change}` : data.orders.change.toString(), changeType: data.orders.changeType },
    { icon: Users, label: 'Signups Today', value: data.signups.today.toString(), sub: `${data.signups.total} total` },
    { icon: FileText, label: 'RFQs Today', value: data.rfqs.today.toString() },
    { icon: DollarSign, label: 'Payments', value: `\u20B9${data.payments.volume.toLocaleString()}`, sub: `${data.payments.today} txns` },
    { icon: AlertTriangle, label: 'Open Disputes', value: data.disputes.open.toString(), sub: `${data.disputes.newToday} new today`, alert: data.disputes.open > 5 },
    { icon: Shield, label: 'Verification Queue', value: data.verificationQueue.toString(), alert: data.verificationQueue > 20 },
  ]

  return (
    <Card className="p-4 space-y-3">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <Sun className="h-4 w-4 text-accent-500" />
          Morning Brief
          <span className="text-[10px] text-text-tertiary ml-auto">{data.date}</span>
        </CardTitle>
      </CardHeader>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className={`rounded-lg border ${s.alert ? 'border-red-500/20 bg-red-500/5' : 'border-border bg-surface'} p-3`}>
              <div className="flex items-center gap-1.5 text-[11px] text-text-tertiary mb-1">
                <Icon className={`h-3 w-3 ${s.alert ? 'text-red-400' : ''}`} />
                {s.label}
              </div>
              <div className="text-lg font-bold text-text-primary">{s.value}</div>
              {s.change !== undefined && (
                <div className={`flex items-center gap-0.5 text-[11px] mt-0.5 ${s.changeType === 'positive' ? 'text-emerald-400' : s.changeType === 'negative' ? 'text-red-400' : 'text-text-tertiary'}`}>
                  {s.changeType === 'positive' ? <TrendingUp className="h-3 w-3" /> : s.changeType === 'negative' ? <TrendingDown className="h-3 w-3" /> : null}
                  {s.change}
                </div>
              )}
              {s.sub && <div className="text-[11px] text-text-tertiary mt-0.5">{s.sub}</div>}
            </div>
          )
        })}
      </div>
      {data.criticalAlerts > 0 && (
        <div className="flex items-center gap-2 text-[11px] text-accent-500 bg-accent-500/10 rounded-lg px-3 py-2">
          <AlertTriangle className="h-3 w-3 flex-shrink-0" />
          {data.criticalAlerts} critical alert{data.criticalAlerts !== 1 ? 's' : ''} requiring attention
        </div>
      )}
    </Card>
  )
}
