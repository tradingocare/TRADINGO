'use client'
import { useState } from 'react'
import { Sparkles, Loader2, AlertTriangle } from 'lucide-react'
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
    <div className={`rounded-lg border p-3 ${empty ? 'border-red-500/30 bg-red-500/10' : low ? 'border-orange-500/20 bg-orange-500/10' : 'border-emerald-500/20 bg-emerald-500/10'}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-white/70">AI Credits</span>
        <span className={`text-xs font-semibold ${empty ? 'text-red-400' : low ? 'text-orange-400' : 'text-emerald-400'}`}>
          {balance.remaining} / {balance.total}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all ${empty ? 'bg-red-500' : low ? 'bg-orange-500' : 'bg-emerald-500'}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      {low && (
        <div className="flex items-center gap-1 mt-2 text-[10px] text-orange-300">
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
      <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
        <Sparkles className="h-4 w-4 text-orange-500" />
        AI Copilot
      </div>
      <p className="text-xs text-white/50">Generate content, SEO, specifications, and translations for this product.</p>
      <CreditBanner />
      <div className="space-y-2">
        <button onClick={onGenerateDescription} disabled={isGenerating}
          className="w-full flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-white/70 transition-colors hover:border-orange-500/30 hover:bg-orange-500/5 hover:text-white disabled:opacity-50">
          {isGenerating && generatingAction === 'description' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-orange-500" />}
          Generate Description
        </button>
        <button onClick={onGenerateSeo} disabled={isGenerating}
          className="w-full flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-white/70 transition-colors hover:border-orange-500/30 hover:bg-orange-500/5 hover:text-white disabled:opacity-50">
          {isGenerating && generatingAction === 'seo' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-orange-500" />}
          Generate SEO & Keywords
        </button>
        <button onClick={onSuggestSpecs} disabled={isGenerating}
          className="w-full flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-white/70 transition-colors hover:border-orange-500/30 hover:bg-orange-500/5 hover:text-white disabled:opacity-50">
          {isGenerating && generatingAction === 'specs' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-orange-500" />}
          Suggest Specifications
        </button>
        <button onClick={onSuggestImages} disabled={isGenerating}
          className="w-full flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-white/70 transition-colors hover:border-orange-500/30 hover:bg-orange-500/5 hover:text-white disabled:opacity-50">
          {isGenerating && generatingAction === 'images' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-orange-500" />}
          Suggest Image Types
        </button>
        <div className="flex gap-2">
          <select value={translateLocale} onChange={e => setTranslateLocale(e.target.value)}
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-sm text-white/70 outline-none focus:border-orange-400">
            <option value="">Translate to...</option>
            {LOCALES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
          <button onClick={() => translateLocale && onTranslate(translateLocale)} disabled={isGenerating || !translateLocale}
            className="flex items-center gap-1 rounded-lg bg-orange-500 px-3 py-2 text-sm text-white transition-colors hover:bg-orange-600 disabled:opacity-50">
            {isGenerating && generatingAction === 'translate' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Go
          </button>
        </div>
      </div>
    </div>
  )
}
