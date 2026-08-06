'use client'
import { Megaphone, BarChart3, MousePointerClick, Target, DollarSign } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AdvertisingIntelligenceResponse } from '@/lib/api/ai-founder'

interface Props { data?: AdvertisingIntelligenceResponse; isLoading: boolean; error?: Error | null }

export function AdvertisingIntelligenceCard({ data, isLoading, error }: Props) {
  if (isLoading) return <div className="flex items-center justify-center h-48 text-text-tertiary"><LoadingSpinner size="sm" color="accent" /></div>
  if (error || !data) return <div className="flex items-center justify-center h-48 text-red-400 text-sm">Failed to load advertising intelligence</div>

  return (
    <Card className="p-4 space-y-3">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <Megaphone className="h-4 w-4 text-orange-400" />
          Advertising Intelligence
        </CardTitle>
      </CardHeader>

      <div className="grid grid-cols-4 gap-2">
        <div className="rounded-lg border border-border bg-surface p-2 text-center">
          <p className="text-[10px] font-medium text-text-secondary flex items-center justify-center gap-1"><DollarSign className="h-3 w-3 text-orange-400" />Spend</p>
          <p className="text-base font-bold text-text-primary text-[13px]">{data.spend.total}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-2 text-center">
          <p className="text-[10px] font-medium text-text-secondary flex items-center justify-center gap-1"><BarChart3 className="h-3 w-3 text-blue-400" />ROI</p>
          <p className="text-base font-bold text-text-primary">{data.campaignROI.avgRoi}x</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-2 text-center">
          <p className="text-[10px] font-medium text-text-secondary flex items-center justify-center gap-1"><MousePointerClick className="h-3 w-3 text-purple-400" />CTR</p>
          <p className="text-base font-bold text-text-primary">{data.ctr.average}%</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-2 text-center">
          <p className="text-[10px] font-medium text-text-secondary flex items-center justify-center gap-1"><Target className="h-3 w-3 text-emerald-400" />Types</p>
          <p className="text-base font-bold text-text-primary">{data.ctr.byType.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-border bg-surface p-2">
          <p className="text-[10px] font-medium text-text-secondary mb-1">Spend by Type</p>
          {data.spend.byType.map((t, i) => (
            <div key={i} className="flex items-center gap-1 text-[11px] py-0.5">
              <span className="flex-1 text-text-secondary">{t.type}</span>
              <div className="h-1.5 w-12 rounded-full bg-bg-elevated overflow-hidden">
                <div className="h-full rounded-full bg-accent" style={{ width: `${t.percentage}%` }} />
              </div>
              <span className="w-16 text-right text-text-primary text-[10px]">{t.amount}</span>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-border bg-surface p-2">
          <p className="text-[10px] font-medium text-text-secondary mb-1">CTR by Type</p>
          {data.ctr.byType.map((t, i) => (
            <div key={i} className="flex justify-between text-[11px]"><span className="text-text-secondary">{t.type}</span><span className="text-text-primary">{t.ctr}%</span></div>
          ))}
        </div>
      </div>
    </Card>
  )
}
