'use client'
import { Briefcase, Star, ShieldCheck, Users } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { TradeservIntelligenceResponse } from '@/lib/api/ai-founder'

interface Props { data?: TradeservIntelligenceResponse; isLoading: boolean; error?: Error | null }

export function TradeservIntelligenceCard({ data, isLoading, error }: Props) {
  if (isLoading) return <div className="flex items-center justify-center h-48 text-text-tertiary"><LoadingSpinner size="sm" color="accent" /></div>
  if (error || !data) return <div className="flex items-center justify-center h-48 text-red-400 text-sm">Failed to load TradeServ intelligence</div>

  return (
    <Card className="p-4 space-y-3">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <Briefcase className="h-4 w-4 text-purple-400" />
          TradeServ Intelligence
        </CardTitle>
      </CardHeader>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-border bg-surface p-3 text-center">
          <p className="text-[11px] font-medium text-text-secondary flex items-center justify-center gap-1"><Users className="h-3 w-3 text-purple-400" />Professionals</p>
          <p className="text-lg font-bold text-text-primary">{data.professionalGrowth.total}</p>
          <p className="text-[10px] text-text-tertiary">{data.professionalGrowth.growth30d > 0 ? '+' : ''}{data.professionalGrowth.growth30d}% 30d</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-3 text-center">
          <p className="text-[11px] font-medium text-text-secondary flex items-center justify-center gap-1"><Star className="h-3 w-3 text-amber-400" />Services</p>
          <p className="text-lg font-bold text-text-primary">{data.serviceDemand.totalServices}</p>
          <p className="text-[10px] text-text-tertiary">{data.serviceDemand.bookingRate}% booking rate</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-3 text-center">
          <p className="text-[11px] font-medium text-text-secondary flex items-center justify-center gap-1"><ShieldCheck className="h-3 w-3 text-emerald-400" />Verified</p>
          <p className="text-lg font-bold text-text-primary">{data.verificationHealth.approved}</p>
          <p className="text-[10px] text-text-tertiary">{data.profileQuality.verificationRate}% rate</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-border bg-surface p-2">
          <p className="text-[10px] font-medium text-text-secondary mb-1">Top Service Categories</p>
          {data.serviceDemand.topCategories.slice(0, 3).map((c, i) => (
            <div key={i} className="flex justify-between text-[11px]"><span className="text-text-secondary">{c.name}</span><span className="text-text-primary">{c.count}</span></div>
          ))}
        </div>
        <div className="rounded-lg border border-border bg-surface p-2">
          <p className="text-[10px] font-medium text-text-secondary mb-1">Verification Funnel</p>
          <div className="flex justify-between text-[11px]"><span className="text-text-secondary">Approved</span><span className="text-emerald-400">{data.verificationHealth.approved}</span></div>
          <div className="flex justify-between text-[11px]"><span className="text-text-secondary">Pending</span><span className="text-amber-400">{data.verificationHealth.pending}</span></div>
          <div className="flex justify-between text-[11px]"><span className="text-text-secondary">Rejected</span><span className="text-red-400">{data.verificationHealth.rejected}</span></div>
        </div>
      </div>
    </Card>
  )
}
