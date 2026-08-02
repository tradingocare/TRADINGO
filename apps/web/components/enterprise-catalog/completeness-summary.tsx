'use client'

import { useProductCompleteness } from '@/hooks/use-product-completeness'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, AlertCircle, XCircle, Loader2 } from 'lucide-react'

interface CompletenessSummaryProps {
  productId: string
  compact?: boolean
}

export function CompletenessSummary({ productId, compact = false }: CompletenessSummaryProps) {
  const { data, isLoading, error } = useProductCompleteness(productId)

  if (isLoading) return <div className="flex items-center gap-2 text-sm text-text-tertiary"><Loader2 className="h-4 w-4 animate-spin text-accent" />Loading completeness...</div>
  if (error || !data) return null

  const gradeColors: Record<string, string> = { A: 'text-emerald-400', B: 'text-blue-400', C: 'text-amber-400', D: 'text-red-400' }
  const gradeBars: Record<string, string> = { A: 'bg-emerald-500', B: 'bg-blue-500', C: 'bg-amber-500', D: 'bg-red-500' }

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <div className="w-20 h-1.5 bg-bg-base rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${gradeBars[data.grade] || 'bg-gray-500'}`} style={{ width: `${data.completionPercent}%` }} />
        </div>
        <span className={`font-semibold ${gradeColors[data.grade] || 'text-text-tertiary'}`}>
          {data.completionPercent}% · Grade {data.grade}
        </span>
      </div>
    )
  }

  return (
    <Card className="border-border bg-surface">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-text-primary flex items-center justify-between">
          <span>Completeness</span>
          <span className={`text-lg font-bold ${gradeColors[data.grade]}`}>{data.grade}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-bg-base rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${gradeBars[data.grade]}`} style={{ width: `${data.completionPercent}%` }} />
          </div>
          <span className="text-sm font-bold text-text-primary">{data.completionPercent}%</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-1.5 rounded bg-emerald-500/10"><CheckCircle className="h-3 w-3 text-emerald-400 mx-auto mb-0.5" /><span className="text-emerald-400 font-medium">{data.presentFields}</span><span className="text-text-tertiary ml-1">ok</span></div>
          <div className="p-1.5 rounded bg-amber-500/10"><AlertCircle className="h-3 w-3 text-amber-400 mx-auto mb-0.5" /><span className="text-amber-400 font-medium">{data.incompleteFields}</span><span className="text-text-tertiary ml-1">partial</span></div>
          <div className="p-1.5 rounded bg-red-500/10"><XCircle className="h-3 w-3 text-red-400 mx-auto mb-0.5" /><span className="text-red-400 font-medium">{data.missingFields}</span><span className="text-text-tertiary ml-1">missing</span></div>
        </div>
        {data.fields.filter(f => f.status !== 'present').slice(0, 5).map(f => (
          <div key={f.name} className="flex items-center gap-2 text-xs">
            {f.status === 'missing' ? <XCircle className="h-3 w-3 text-red-400 shrink-0" /> : <AlertCircle className="h-3 w-3 text-amber-400 shrink-0" />}
            <span className="text-text-primary capitalize">{f.name.replace(/([A-Z])/g, ' $1').trim()}</span>
            <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded font-medium ${
              f.importance === 'critical' ? 'bg-red-500/20 text-red-400' : f.importance === 'high' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
            }`}>{f.importance}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}