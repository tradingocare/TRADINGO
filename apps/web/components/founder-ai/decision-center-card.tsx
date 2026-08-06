'use client'
import { useState } from 'react'
import { Lightbulb, Sparkles, Target, TrendingUp, Shield, Users, DollarSign } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DecisionCenterResponse } from '@/lib/api/ai-founder'

interface DecisionCenterCardProps {
  onAnalyze: (data: { focusArea?: string; context?: Record<string, unknown> }) => Promise<any>
  isGenerating: boolean
}

const FOCUS_AREAS = [
  { value: 'revenue', label: 'Revenue Growth', icon: TrendingUp },
  { value: 'users', label: 'User Acquisition', icon: Users },
  { value: 'risk', label: 'Risk Management', icon: Shield },
  { value: 'operations', label: 'Operations', icon: Target },
  { value: 'finance', label: 'Financial', icon: DollarSign },
]

export function DecisionCenterCard({ onAnalyze, isGenerating }: DecisionCenterCardProps) {
  const [focusArea, setFocusArea] = useState<string>('revenue')
  const [result, setResult] = useState<DecisionCenterResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const handleAnalyze = async () => {
    setLoading(true)
    try {
      const res = await onAnalyze({ focusArea })
      if (res?.data) setResult(res.data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-4 space-y-3">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <Lightbulb className="h-4 w-4 text-yellow-400" />
          Decision Center
        </CardTitle>
      </CardHeader>
      <div className="flex flex-wrap gap-1.5">
        {FOCUS_AREAS.map(f => {
          const Icon = f.icon
          return (
            <button key={f.value} onClick={() => setFocusArea(f.value)}
              className={`flex items-center gap-1 px-2 py-1 text-[11px] rounded transition-colors ${focusArea === f.value ? 'bg-yellow-500/20 text-yellow-300' : 'bg-surface text-text-tertiary hover:text-text-secondary'}`}>
              <Icon className="h-3 w-3" />
              {f.label}
            </button>
          )
        })}
      </div>
      <button onClick={handleAnalyze} disabled={loading || isGenerating}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-yellow-500/20 text-yellow-300 rounded hover:bg-yellow-500/30 disabled:opacity-40 transition-colors">
        {loading || isGenerating ? <LoadingSpinner size="xs" color="accent" /> : <Sparkles className="h-3 w-3" />}
        {loading ? 'Analyzing...' : 'Analyze'}
      </button>
      {result && result.recommendations.length > 0 && (
        <div className="space-y-2">
          {result.recommendations.map((rec, i) => (
            <div key={i} className="rounded-lg border border-border bg-surface p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-medium text-text-primary">
                <Lightbulb className="h-3 w-3 text-yellow-400" />
                {rec.title}
              </div>
              <p className="text-[11px] text-text-tertiary">{rec.description}</p>
              <div className="flex items-center justify-between text-[10px] text-text-tertiary">
                <span>Confidence: {rec.confidence}%</span>
                <span>{rec.area}</span>
              </div>
              <div className="text-[11px] text-text-tertiary">
                <span className="text-text-secondary">Impact:</span> {rec.businessImpact}
              </div>
              <div className="text-[11px] text-emerald-400/70">
                <span className="text-text-secondary">Action:</span> {rec.recommendedAction}
              </div>
            </div>
          ))}
        </div>
      )}
      {!result && !loading && (
        <p className="text-[11px] text-text-tertiary">Select a focus area and analyze for AI-powered decision recommendations.</p>
      )}
    </Card>
  )
}
