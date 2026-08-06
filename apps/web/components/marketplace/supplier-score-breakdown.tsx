'use client'

import { FactorDetail } from '@/lib/api/marketplace-intelligence'

interface SupplierScoreBreakdownProps {
  score: number
  grade?: string
  recommendation?: string
  factors: FactorDetail[]
  expanded?: boolean
}

const GRADE_COLORS: Record<string, string> = {
  'A+': 'text-emerald-400',
  'A': 'text-emerald-500',
  'B+': 'text-blue-400',
  'B': 'text-blue-500',
  'C': 'text-[#FF4D00]',
  'D': 'text-red-400',
}

const RECOMMENDATION_COLORS: Record<string, string> = {
  BEST: 'text-emerald-400',
  STRONG: 'text-blue-400',
  GOOD: 'text-[#FF4D00]',
  AVERAGE: 'text-gray-400',
  POOR: 'text-red-400',
}

export function SupplierScoreBreakdown({ score, grade, recommendation, factors, expanded = true }: SupplierScoreBreakdownProps) {
  const scoreColor = score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-blue-400' : score >= 40 ? 'text-accent-500' : 'text-red-400'

  return (
    <div className="rounded-lg border border-border bg-bg-elevated p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <span className={`text-3xl font-bold ${scoreColor}`}>{score}</span>
          <span className="ml-1 text-sm text-text-tertiary">/100</span>
        </div>
        <div className="flex items-center gap-2">
          {grade && (
            <span className={`rounded-md bg-surface-secondary px-2 py-1 text-sm font-bold ${GRADE_COLORS[grade] ?? 'text-text-tertiary'}`}>
              {grade}
            </span>
          )}
          {recommendation && (
            <span className={`rounded-md bg-surface-secondary px-2 py-1 text-xs font-semibold ${RECOMMENDATION_COLORS[recommendation] ?? 'text-text-tertiary'}`}>
              {recommendation}
            </span>
          )}
        </div>
      </div>

      {expanded && (
        <div className="space-y-1.5">
          {factors.map((f, i) => (
            <div key={i} className="group relative">
              <div className="mb-0.5 flex items-center justify-between text-xs">
                <span className="font-medium text-text-tertiary" title={f.reason}>
                  {f.label}
                </span>
                <span className="text-text-tertiary">{f.score}/100</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-secondary">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    f.score >= 80 ? 'bg-emerald-500' : f.score >= 60 ? 'bg-blue-500' : f.score >= 40 ? 'bg-accent-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${f.score}%` }}
                />
              </div>
              <div className="mt-0.5 text-[10px] text-text-secondary">{f.reason}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
