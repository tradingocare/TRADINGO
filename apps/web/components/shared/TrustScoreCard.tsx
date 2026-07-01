'use client'

import { Shield, TrendingUp, TrendingDown, Clock, AlertTriangle, Info } from 'lucide-react'
import { VerifiedBadge } from '@/components/shared/VerifiedBadge'
import { RankBadge } from '@/components/shared/RankBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface BreakdownItem {
  category: string
  score: number
  weight: number
  contribution: number
  maxContribution: number
}

interface TrustScoreCardProps {
  score: number
  grade: string
  riskLevel: string
  breakdown?: BreakdownItem[]
  updatedAt?: string | null
  rank?: number | null
  totalEntries?: number
  loading?: boolean
}

const gradeColors: Record<string, { bg: string; text: string; ring: string }> = {
  'A+': { bg: 'bg-emerald-500/20', text: 'text-emerald-400', ring: 'ring-emerald-500/30' },
  'A': { bg: 'bg-green-500/20', text: 'text-green-400', ring: 'ring-green-500/30' },
  'B+': { bg: 'bg-blue-500/20', text: 'text-blue-400', ring: 'ring-blue-500/30' },
  'B': { bg: 'bg-amber-500/20', text: 'text-amber-400', ring: 'ring-amber-500/30' },
  'C': { bg: 'bg-orange-500/20', text: 'text-orange-400', ring: 'ring-orange-500/30' },
  'D': { bg: 'bg-red-500/20', text: 'text-red-400', ring: 'ring-red-500/30' },
}

const riskColors: Record<string, { bg: string; text: string }> = {
  'Low': { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  'Medium': { bg: 'bg-amber-500/10', text: 'text-amber-400' },
  'High': { bg: 'bg-orange-500/10', text: 'text-orange-400' },
  'Critical': { bg: 'bg-red-500/10', text: 'text-red-400' },
}

function getScoreBarColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 60) return 'bg-blue-500'
  if (score >= 40) return 'bg-amber-500'
  return 'bg-red-500'
}

function getBadgeType(grade: string): string {
  if (grade === 'A+') return 'elite'
  if (grade === 'A') return 'gold'
  if (grade === 'B+') return 'premium'
  if (grade === 'B') return 'trusted'
  if (grade === 'C') return 'verified'
  return 'verified'
}

function BreakdownBar({ item }: { item: BreakdownItem }) {
  const pct = item.maxContribution > 0 ? Math.round((item.contribution / item.maxContribution) * 100) : 0
  const absPct = Math.round((item.contribution / item.maxContribution) * 100)

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-secondary dark:text-dark-text-secondary truncate">{item.category}</span>
        <span className="text-text-primary dark:text-dark-text-primary font-medium ml-2">
          {item.score}/100
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-surface-secondary dark:bg-dark-surface-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getScoreBarColor(item.score)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-[10px] text-text-secondary/60 dark:text-dark-text-secondary/60">
        {item.contribution >= 0 ? `+${item.contribution}` : item.contribution} pts of {item.maxContribution} max
      </div>
    </div>
  )
}

export function TrustScoreCard({ score, grade, riskLevel, breakdown, updatedAt, rank, totalEntries, loading }: TrustScoreCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Trust Score
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-24 animate-pulse rounded-xl bg-surface-secondary dark:bg-dark-surface-secondary" />
          <div className="h-4 animate-pulse rounded bg-surface-secondary dark:bg-dark-surface-secondary w-2/3" />
          <div className="h-4 animate-pulse rounded bg-surface-secondary dark:bg-dark-surface-secondary w-1/2" />
        </CardContent>
      </Card>
    )
  }

  const gc = gradeColors[grade] ?? gradeColors['C']
  const rc = riskColors[riskLevel] ?? riskColors['Medium']

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-text-primary dark:text-dark-text-primary">
          <Shield className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          TradTrust Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`relative overflow-hidden rounded-2xl p-5 ${gc.bg} ${gc.ring} ring-1`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className={`text-5xl font-black ${gc.text}`}>{score}</span>
                <span className="text-text-secondary dark:text-dark-text-secondary text-sm font-medium">/ 1000</span>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <div className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${gc.bg} ${gc.text}`}>
                  Grade {grade}
                </div>
                <div className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${rc.bg} ${rc.text}`}>
                  {riskLevel} Risk
                </div>
                <VerifiedBadge type={getBadgeType(grade) as any} size="sm" />
              </div>
            </div>
            {rank && (
              <RankBadge rank={rank} total={totalEntries} size="lg" showLabel />
            )}
          </div>

          {updatedAt && (
            <div className="flex items-center gap-1.5 mt-3 text-[11px] text-text-secondary dark:text-dark-text-secondary">
              <Clock className="h-3 w-3" />
              Last updated: {new Date(updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          )}
        </div>

        {breakdown && breakdown.length > 0 && (
          <div className="space-y-4 pt-2">
            <h4 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">
              Score Breakdown
            </h4>

            <div className="space-y-3">
              {breakdown.map((item) => (
                <BreakdownBar key={item.category} item={item} />
              ))}
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-text-secondary/60 dark:text-dark-text-secondary/60 pt-1">
              <Info className="h-3 w-3" />
              Each category scored 0-100. Contribution = score × weight / 100
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
