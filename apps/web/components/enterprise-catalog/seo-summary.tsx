'use client'

import { useScore } from '@/hooks/use-catalog-quality'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'

interface SeoSummaryProps {
  productId: string
  compact?: boolean
}

export function SeoSummary({ productId, compact = false }: SeoSummaryProps) {
  const { data, isLoading } = useScore(productId)

  if (isLoading) return <div className="flex items-center gap-2 text-sm text-text-tertiary"><Loader2 className="h-4 w-4 animate-spin text-accent" />Loading SEO...</div>
  if (!data) return null

  const seoScore = data.seoQuality || 0

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-xs">
        {seoScore >= 70 ? <CheckCircle className="h-3 w-3 text-emerald-400" /> : <AlertTriangle className="h-3 w-3 text-amber-400" />}
        <span className="text-text-secondary">SEO</span>
        <span className={`font-semibold ${seoScore >= 70 ? 'text-emerald-400' : seoScore >= 40 ? 'text-amber-400' : 'text-red-400'}`}>{seoScore}</span>
      </div>
    )
  }

  return (
    <Card className="border-border bg-surface">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-text-primary flex items-center gap-2">
          <Search className="h-4 w-4 text-accent" />
          SEO Health
          <span className={`ml-auto text-lg font-bold ${
            seoScore >= 70 ? 'text-emerald-400' : seoScore >= 40 ? 'text-amber-400' : 'text-red-400'
          }`}>{seoScore}/100</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div className="flex justify-between"><span className="text-text-tertiary">Score Breakdown</span><span className="text-text-secondary">{seoScore}/100</span></div>
        <div className="flex justify-between"><span className="text-text-tertiary">Status</span><span className={seoScore >= 70 ? 'text-emerald-400' : 'text-amber-400'}>{seoScore >= 70 ? 'Good' : seoScore >= 40 ? 'Fair' : 'Poor'}</span></div>
      </CardContent>
    </Card>
  )
}