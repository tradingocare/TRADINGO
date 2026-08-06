'use client'
import { MessageCircle, Users, TrendingUp, UserPlus } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { TradeTalkIntelligenceResponse } from '@/lib/api/ai-founder'

interface Props { data?: TradeTalkIntelligenceResponse; isLoading: boolean; error?: Error | null }

export function TradeTalkIntelligenceCard({ data, isLoading, error }: Props) {
  if (isLoading) return <div className="flex items-center justify-center h-48 text-text-tertiary"><LoadingSpinner size="sm" color="accent" /></div>
  if (error || !data) return <div className="flex items-center justify-center h-48 text-red-400 text-sm">Failed to load TradeTalk intelligence</div>

  return (
    <Card className="p-4 space-y-3">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <MessageCircle className="h-4 w-4 text-pink-400" />
          TradeTalk Intelligence
        </CardTitle>
      </CardHeader>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-border bg-surface p-3 text-center">
          <p className="text-[11px] font-medium text-text-secondary flex items-center justify-center gap-1"><Users className="h-3 w-3 text-pink-400" />Communities</p>
          <p className="text-lg font-bold text-text-primary">{data.communityGrowth.totalCommunities}</p>
          <p className="text-[10px] text-text-tertiary">{data.communityGrowth.growth30d > 0 ? '+' : ''}{data.communityGrowth.growth30d}% 30d</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-3 text-center">
          <p className="text-[11px] font-medium text-text-secondary flex items-center justify-center gap-1"><UserPlus className="h-3 w-3 text-blue-400" />Members</p>
          <p className="text-lg font-bold text-text-primary">{data.membershipAdoption.totalMembers}</p>
          <p className="text-[10px] text-text-tertiary">{data.membershipAdoption.activeMembers} active</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-3 text-center">
          <p className="text-[11px] font-medium text-text-secondary flex items-center justify-center gap-1"><TrendingUp className="h-3 w-3 text-emerald-400" />Adoption</p>
          <p className="text-lg font-bold text-text-primary">{data.membershipAdoption.inviteAcceptanceRate}%</p>
          <p className="text-[10px] text-text-tertiary">accept rate</p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-2">
        <p className="text-[10px] font-medium text-text-secondary mb-1">Most Active Communities</p>
        {data.mostActiveCommunities.slice(0, 4).map((c, i) => (
          <div key={i} className="flex justify-between text-[11px] py-0.5"><span className="text-text-secondary truncate">{c.name}</span><span className="text-text-primary">{c.memberCount} members</span></div>
        ))}
      </div>
    </Card>
  )
}
