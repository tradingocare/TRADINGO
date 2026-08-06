'use client'
import { Wallet, Medal, Gift, Target } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { GocashIntelligenceResponse } from '@/lib/api/ai-founder'

interface Props { data?: GocashIntelligenceResponse; isLoading: boolean; error?: Error | null }

export function GocashIntelligenceCard({ data, isLoading, error }: Props) {
  if (isLoading) return <div className="flex items-center justify-center h-48 text-text-tertiary"><LoadingSpinner size="sm" color="accent" /></div>
  if (error || !data) return <div className="flex items-center justify-center h-48 text-red-400 text-sm">Failed to load GOCASH intelligence</div>

  return (
    <Card className="p-4 space-y-3">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <Wallet className="h-4 w-4 text-emerald-400" />
          GOCASH Intelligence
        </CardTitle>
      </CardHeader>

      <div className="grid grid-cols-4 gap-2">
        <div className="rounded-lg border border-border bg-surface p-2 text-center">
          <p className="text-[10px] font-medium text-text-secondary flex items-center justify-center gap-1"><Wallet className="h-3 w-3 text-emerald-400" />Wallets</p>
          <p className="text-base font-bold text-text-primary">{data.walletActivity.totalWallets}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-2 text-center">
          <p className="text-[10px] font-medium text-text-secondary flex items-center justify-center gap-1"><Medal className="h-3 w-3 text-amber-400" />XP Users</p>
          <p className="text-base font-bold text-text-primary">{data.xpDistribution.byLevel.reduce((a, l) => a + l.userCount, 0)}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-2 text-center">
          <p className="text-[10px] font-medium text-text-secondary flex items-center justify-center gap-1"><Gift className="h-3 w-3 text-purple-400" />Utilization</p>
          <p className="text-base font-bold text-text-primary">{data.rewardUtilization.utilizationRate}%</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-2 text-center">
          <p className="text-[10px] font-medium text-text-secondary flex items-center justify-center gap-1"><Target className="h-3 w-3 text-blue-400" />Missions</p>
          <p className="text-base font-bold text-text-primary">{data.missionCompletion.completionRate}%</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-border bg-surface p-2">
          <p className="text-[10px] font-medium text-text-secondary mb-1">Reward Activity</p>
          <div className="flex justify-between text-[11px]"><span className="text-text-secondary">Earned</span><span className="text-emerald-400">{data.rewardUtilization.totalEarned}</span></div>
          <div className="flex justify-between text-[11px]"><span className="text-text-secondary">Redeemed</span><span className="text-amber-400">{data.rewardUtilization.totalRedeemed}</span></div>
          <div className="flex justify-between text-[11px]"><span className="text-text-secondary">Avg wallet</span><span className="text-text-primary">{data.walletActivity.avgBalance}</span></div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-2">
          <p className="text-[10px] font-medium text-text-secondary mb-1">XP by Level</p>
          {data.xpDistribution.byLevel.slice(0, 4).map((l, i) => (
            <div key={i} className="flex justify-between text-[11px]"><span className="text-text-secondary">Level {l.level}</span><span className="text-text-primary">{l.userCount} users</span></div>
          ))}
        </div>
      </div>
    </Card>
  )
}
