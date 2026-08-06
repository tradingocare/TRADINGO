'use client'
import { ShieldCheck, Award, AlertTriangle, TrendingUp } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { TradTrustIntelligenceResponse } from '@/lib/api/ai-founder'

interface Props { data?: TradTrustIntelligenceResponse; isLoading: boolean; error?: Error | null }

export function TradTrustIntelligenceCard({ data, isLoading, error }: Props) {
  if (isLoading) return <div className="flex items-center justify-center h-48 text-text-tertiary"><LoadingSpinner size="sm" color="accent" /></div>
  if (error || !data) return <div className="flex items-center justify-center h-48 text-red-400 text-sm">Failed to load TradTrust intelligence</div>

  return (
    <Card className="p-4 space-y-3">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <ShieldCheck className="h-4 w-4 text-cyan-400" />
          TradTrust Intelligence
        </CardTitle>
      </CardHeader>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-border bg-surface p-2 text-center">
          <p className="text-[10px] font-medium text-text-secondary flex items-center justify-center gap-1"><Award className="h-3 w-3 text-cyan-400" />Grades</p>
          <p className="text-base font-bold text-text-primary">{data.trustDistribution.length}</p>
          <p className="text-[9px] text-text-tertiary">unique grades</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-2 text-center">
          <p className="text-[10px] font-medium text-text-secondary flex items-center justify-center gap-1"><ShieldCheck className="h-3 w-3 text-emerald-400" />Verified</p>
          <p className="text-base font-bold text-text-primary">{data.verificationFunnel.approved}</p>
          <p className="text-[9px] text-text-tertiary">{data.verificationFunnel.pending} pending</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-2 text-center">
          <p className="text-[10px] font-medium text-text-secondary flex items-center justify-center gap-1"><AlertTriangle className="h-3 w-3 text-amber-400" />Risk</p>
          <p className="text-base font-bold text-text-primary">{data.riskAnalysis.length}</p>
          <p className="text-[9px] text-text-tertiary">risk levels</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-border bg-surface p-2">
          <p className="text-[10px] font-medium text-text-secondary mb-1">Grade Distribution</p>
          {data.trustDistribution.slice(0, 5).map((g, i) => (
            <div key={i} className="flex items-center gap-1 text-[11px] py-0.5">
              <span className="w-8 text-text-primary font-medium">{g.grade}</span>
              <div className="h-1.5 flex-1 rounded-full bg-bg-elevated overflow-hidden">
                <div className="h-full rounded-full bg-accent" style={{ width: `${g.percentage}%` }} />
              </div>
              <span className="w-8 text-right text-text-tertiary">{g.companyCount}</span>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-border bg-surface p-2">
          <p className="text-[10px] font-medium text-text-secondary mb-1">Verification Funnel</p>
          <div className="flex justify-between text-[11px]"><span className="text-text-secondary">Total</span><span className="text-text-primary">{data.verificationFunnel.total}</span></div>
          <div className="flex justify-between text-[11px]"><span className="text-emerald-400">Approved</span><span className="text-text-primary">{data.verificationFunnel.approved}</span></div>
          <div className="flex justify-between text-[11px]"><span className="text-amber-400">Pending</span><span className="text-text-primary">{data.verificationFunnel.pending}</span></div>
          <div className="flex justify-between text-[11px]"><span className="text-red-400">Rejected</span><span className="text-text-primary">{data.verificationFunnel.rejected}</span></div>
        </div>
      </div>
    </Card>
  )
}
