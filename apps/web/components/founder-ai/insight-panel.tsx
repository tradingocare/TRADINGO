'use client'
import { AlertTriangle, Info, AlertCircle } from 'lucide-react'
import type { FounderAiInsight } from '@/lib/api/ai-founder'

interface InsightPanelProps {
  insights: FounderAiInsight[]
}

export function InsightPanel({ insights }: InsightPanelProps) {
  if (!insights || insights.length === 0) return null

  const priorityIcon = (p: string) => {
    switch (p) {
      case 'critical': return <AlertTriangle className="h-3 w-3 text-red-400" />
      case 'high': return <AlertCircle className="h-3 w-3 text-accent-500" />
      default: return <Info className="h-3 w-3 text-blue-400" />
    }
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4 space-y-2">
      <div className="text-[11px] font-medium text-text-secondary">Intelligence Insights</div>
      <div className="space-y-1.5 max-h-64 overflow-y-auto">
        {insights.map((insight, i) => (
          <div key={i} className="flex items-start gap-2 text-[11px] bg-surface rounded p-2">
            <div className="mt-0.5 flex-shrink-0">{priorityIcon(insight.priority)}</div>
            <div className="space-y-0.5 flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-text-primary truncate">{insight.title}</span>
                <span className="text-[10px] text-text-tertiary ml-auto">{insight.confidence}% conf.</span>
              </div>
              <p className="text-text-tertiary line-clamp-2">{insight.reason}</p>
              <p className="text-emerald-400/60">{insight.recommendedAction}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
