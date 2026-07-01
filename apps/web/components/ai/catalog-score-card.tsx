'use client'
import { TrendingUp, Image, FileText, AlertTriangle, Search } from 'lucide-react'

interface CatalogScoreCardProps {
  score?: {
    total: number
    titleQuality: number
    descriptionQuality: number
    imageQuality: number
    specificationQuality: number
    seoQuality: number
    completeness: number
    recommendations: string[]
  } | null
  loading?: boolean
  error?: boolean
  onRecalculate?: () => void
  calculating?: boolean
}

function ScoreBar({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  const pct = Math.min((value / max) * 100, 100)
  const color = pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-500">{label}</span>
        <span className="font-medium">{Math.round(value)}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-300 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function CatalogScoreCard({ score, loading, error, onRecalculate, calculating }: CatalogScoreCardProps) {
  if (loading) return (
    <div className="rounded-lg border border-gray-200 p-4 space-y-3 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/3" />
      <div className="h-8 bg-gray-200 rounded w-1/4" />
      {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-3 bg-gray-200 rounded w-full" />)}
    </div>
  )

  if (error || !score) return (
    <div className="rounded-lg border border-gray-200 p-4 text-center text-sm text-gray-400">
      <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
      <p>No quality score available</p>
      {onRecalculate && <button onClick={onRecalculate} disabled={calculating}
        className="mt-2 text-orange-500 hover:text-orange-600 text-xs font-medium">{calculating ? 'Calculating...' : 'Calculate Now'}</button>}
    </div>
  )

  return (
    <div className="rounded-lg border border-gray-200 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
          <TrendingUp className="h-4 w-4 text-orange-500" /> Catalog Quality
        </span>
        <span className={`text-lg font-bold ${score.total >= 80 ? 'text-green-600' : score.total >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
          {Math.round(score.total)}%
        </span>
      </div>
      <div className="space-y-2">
        <ScoreBar label="Title" value={score.titleQuality} />
        <ScoreBar label="Description" value={score.descriptionQuality} />
        <ScoreBar label="Images" value={score.imageQuality} />
        <ScoreBar label="Specifications" value={score.specificationQuality} />
        <ScoreBar label="SEO" value={score.seoQuality} />
      </div>
      {score.recommendations.length > 0 && (
        <div className="space-y-1 pt-2 border-t border-gray-100">
          <span className="text-[10px] font-semibold text-gray-400 uppercase">Recommendations</span>
          {score.recommendations.slice(0, 3).map((r, i) => (
            <div key={i} className="flex items-start gap-1.5 text-[11px] text-gray-600">
              <AlertTriangle className="h-3 w-3 text-yellow-500 mt-0.5 shrink-0" />
              <span>{r}</span>
            </div>
          ))}
        </div>
      )}
      {onRecalculate && (
        <button onClick={onRecalculate} disabled={calculating}
          className="text-xs text-orange-500 hover:text-orange-600 font-medium">
          {calculating ? 'Recalculating...' : 'Recalculate Score'}
        </button>
      )}
    </div>
  )
}
