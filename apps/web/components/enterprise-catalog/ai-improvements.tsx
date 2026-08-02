'use client'

import { Sparkles, Loader2, CheckCircle, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { useScore } from '@/hooks/use-catalog-quality'
import { useToast } from '@/components/ui/use-toast'
import { apiClient } from '@/lib/api-client'

interface AiImprovementsProps {
  productId: string
  compact?: boolean
}

export function AiImprovements({ productId, compact = false }: AiImprovementsProps) {
  const { data: score, isLoading } = useScore(productId)
  const { toast } = useToast()
  const [applying, setApplying] = useState<string | null>(null)

  const recommendations = score?.recommendations || []
  const improvements: Array<{ key: string; label: string; action: string; apiCall: () => Promise<any> }> = []

  if (!score) return null

  if (score.titleQuality < 70) {
    improvements.push({ key: 'title', label: 'Generate better title', action: 'generateTitle', apiCall: () => apiClient.post('/ai/products/generate-title', { productId }) })
  }
  if (score.descriptionQuality < 70) {
    improvements.push({ key: 'description', label: 'Improve description', action: 'generateDescription', apiCall: () => apiClient.post('/ai/products/generate-description', { productId }) })
  }
  if (score.seoQuality < 70) {
    improvements.push({ key: 'seo', label: 'Optimize SEO', action: 'generateSeo', apiCall: () => apiClient.post('/ai/products/generate-seo', { productId }) })
  }
  if (score.imageQuality < 60) {
    improvements.push({ key: 'images', label: 'Suggest images', action: 'suggestImages', apiCall: () => apiClient.post('/ai/products/suggest-images', { productId }) })
  }
  if (score.specificationQuality < 70) {
    improvements.push({ key: 'specs', label: 'Add specifications', action: 'suggestSpecs', apiCall: () => apiClient.post('/ai/products/suggest-specs', { productId }) })
  }

  if (improvements.length === 0 && recommendations.length === 0) return null

  const handleApply = async (item: typeof improvements[0]) => {
    setApplying(item.key)
    try {
      await item.apiCall()
      toast({ title: 'AI Complete', description: `${item.label} — suggestion generated`, variant: 'default' })
    } catch {
      toast({ title: 'Error', description: `Failed to ${item.label.toLowerCase()}`, variant: 'destructive' })
    } finally {
      setApplying(null)
    }
  }

  if (compact) {
    if (improvements.length === 0) return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-400">
        <CheckCircle className="h-3 w-3" /> All areas optimized
      </div>
    )
    return (
      <div className="text-xs text-text-tertiary">
        <span className="text-amber-400 font-medium">{improvements.length}</span> improvements available
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <Sparkles className="h-4 w-4 text-accent" />
        <span className="text-sm font-medium text-text-primary">AI Suggested Improvements</span>
        {improvements.length > 0 && (
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-medium">{improvements.length}</span>
        )}
      </div>
      <div className="p-3 space-y-1.5">
        {improvements.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-emerald-400 py-2">
            <CheckCircle className="h-4 w-4" /> Product quality is well-optimized
          </div>
        ) : (
          improvements.map(item => (
            <div key={item.key} className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3 w-3 text-accent shrink-0" />
                <span className="text-sm text-text-primary">{item.label}</span>
              </div>
              <button onClick={() => handleApply(item)} disabled={applying === item.key}
                className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 font-medium disabled:opacity-50">
                {applying === item.key ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowRight className="h-3 w-3" />}
                {applying === item.key ? 'Applying...' : 'Apply'}
              </button>
            </div>
          ))
        )}
        {recommendations.length > 0 && improvements.length === 0 && (
          <ul className="space-y-1 text-sm text-text-secondary">
            {recommendations.map((r, i) => (
              <li key={i} className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />{r}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}