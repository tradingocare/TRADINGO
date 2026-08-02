'use client'
import { useState } from 'react'
import { Sparkles, AlertTriangle } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Select } from '@/components/ui/select'
import { useMyCreditBalance } from '@/hooks/use-ai-credits'

interface CopilotPanelProps {
  productId: string
  onGenerateDescription: () => Promise<any>
  onGenerateSeo: () => Promise<any>
  onSuggestSpecs: () => Promise<any>
  onSuggestImages: () => Promise<any>
  onTranslate: (locale: string) => Promise<any>
  isGenerating: boolean
  generatingAction: string | null
}

const LOCALES = [
  { value: 'hi', label: 'Hindi' },
  { value: 'ar', label: 'Arabic' },
  { value: 'fr', label: 'French' },
  { value: 'es', label: 'Spanish' },
  { value: 'de', label: 'German' },
  { value: 'zh', label: 'Chinese' },
]

function CreditBanner() {
  const { data: balance, isLoading } = useMyCreditBalance()

  if (isLoading || !balance) return null

  const pct = balance.total > 0 ? Math.round((balance.used / balance.total) * 100) : 0
  const low = balance.remaining <= Math.round(balance.total * 0.2)
  const empty = balance.remaining <= 0

  return (
    <div className={`rounded-lg border p-3 ${empty ? 'border-red-500/30 bg-red-500/10' : low ? 'border-accent-500/20 bg-accent-500/10' : 'border-emerald-500/20 bg-emerald-500/10'}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-text-primary">AI Credits</span>
        <span className={`text-xs font-semibold ${empty ? 'text-red-400' : low ? 'text-accent-500' : 'text-emerald-400'}`}>
          {balance.remaining} / {balance.total}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-tertiary">
        <div
          className={`h-full rounded-full transition-all ${empty ? 'bg-red-500' : low ? 'bg-accent-500' : 'bg-emerald-500'}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      {low && (
        <div className="flex items-center gap-1 mt-2 text-[10px] text-accent-500">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          {empty ? 'No credits remaining. Upgrade your plan.' : 'Low on credits.'}
        </div>
      )}
    </div>
  )
}

export function CopilotPanel({ onGenerateDescription, onGenerateSeo, onSuggestSpecs, onSuggestImages, onTranslate, isGenerating, generatingAction }: CopilotPanelProps) {
  const [translateLocale, setTranslateLocale] = useState('')

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
        <Sparkles className="h-4 w-4 text-accent-500" />
        AI Copilot
      </div>
      <p className="text-xs text-text-secondary">Generate content, SEO, specifications, and translations for this product.</p>
      <CreditBanner />
      <div className="space-y-2">
        <button onClick={onGenerateDescription} disabled={isGenerating}
          className="w-full flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-text-primary transition-colors hover:border-accent-500/30 hover:bg-accent-500/5 hover:text-primary disabled:opacity-50">
          {isGenerating && generatingAction === 'description' ? <LoadingSpinner size="xs" color="accent" /> : <Sparkles className="h-3.5 w-3.5 text-accent-500" />}
          Generate Description
        </button>
        <button onClick={onGenerateSeo} disabled={isGenerating}
          className="w-full flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-text-primary transition-colors hover:border-accent-500/30 hover:bg-accent-500/5 hover:text-primary disabled:opacity-50">
          {isGenerating && generatingAction === 'seo' ? <LoadingSpinner size="xs" color="accent" /> : <Sparkles className="h-3.5 w-3.5 text-accent-500" />}
          Generate SEO & Keywords
        </button>
        <button onClick={onSuggestSpecs} disabled={isGenerating}
          className="w-full flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-text-primary transition-colors hover:border-accent-500/30 hover:bg-accent-500/5 hover:text-primary disabled:opacity-50">
          {isGenerating && generatingAction === 'specs' ? <LoadingSpinner size="xs" color="accent" /> : <Sparkles className="h-3.5 w-3.5 text-accent-500" />}
          Suggest Specifications
        </button>
        <button onClick={onSuggestImages} disabled={isGenerating}
          className="w-full flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-text-primary transition-colors hover:border-accent-500/30 hover:bg-accent-500/5 hover:text-primary disabled:opacity-50">
          {isGenerating && generatingAction === 'images' ? <LoadingSpinner size="xs" color="accent" /> : <Sparkles className="h-3.5 w-3.5 text-accent-500" />}
          Suggest Image Types
        </button>
        <div className="flex gap-2">
          <Select value={translateLocale} onChange={e => setTranslateLocale(e.target.value)}>
            <option value="">Translate to...</option>
            {LOCALES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </Select>
          <button onClick={() => translateLocale && onTranslate(translateLocale)} disabled={isGenerating || !translateLocale}
            className="flex items-center gap-1 rounded-lg bg-accent-500 px-3 py-2 text-sm text-black transition-colors hover:bg-accent-500/80 disabled:opacity-50">
            {isGenerating && generatingAction === 'translate' ? <LoadingSpinner size="xs" color="accent" /> : <Sparkles className="h-3.5 w-3.5" />}
            Go
          </button>
        </div>
      </div>
    </div>
  )
}
