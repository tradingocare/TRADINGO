'use client'
import { useState } from 'react'
import { Sparkles, Send, Bot } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { FounderCopilotResponse } from '@/lib/api/ai-founder'

interface FounderCopilotProps {
  onAsk: (data: { query: string; context?: Record<string, unknown> }) => Promise<any>
  isGenerating: boolean
}

export function FounderCopilot({ onAsk, isGenerating }: FounderCopilotProps) {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<FounderCopilotResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!query.trim()) return
    setLoading(true)
    try {
      const res = await onAsk({ query: query.trim() })
      if (res?.data) setResult(res.data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-4 space-y-3">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <Bot className="h-4 w-4 text-purple-400" />
          Founder Copilot
        </CardTitle>
      </CardHeader>

      <div className="flex gap-2">
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="Ask anything about your platform..."
          className="flex-1 bg-surface border border-border rounded px-3 py-1.5 text-xs text-text-primary placeholder-text-tertiary focus:outline-none focus:border-purple-500/40"
        />
        <button onClick={handleSubmit} disabled={loading || isGenerating || !query.trim()}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-purple-500/20 text-purple-300 rounded hover:bg-purple-500/30 disabled:opacity-40 transition-colors">
          {loading || isGenerating ? <LoadingSpinner size="xs" color="accent" /> : <Send className="h-3 w-3" />}
          Ask
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-text-tertiary">
          <LoadingSpinner size="xs" color="accent" />
          Analyzing...
        </div>
      )}

      {result && (
        <div className="space-y-2">
          <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-purple-300 mb-1">
              <Sparkles className="h-3 w-3" />
              Answer
              <span className="text-[10px] text-text-tertiary ml-auto">Confidence: {result.confidence}%</span>
            </div>
            <p className="text-xs text-text-secondary whitespace-pre-wrap">{result.answer}</p>
            <div className="text-[10px] text-text-tertiary mt-1">Source: {result.source}</div>
          </div>
          {result.insights.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] font-medium text-text-tertiary">Related Insights</div>
              {result.insights.map((insight, i) => (
                <div key={i} className="text-[11px] text-text-tertiary bg-surface rounded p-2">
                  <span className="text-text-secondary">{insight.title}:</span> {insight.recommendedAction}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!result && !loading && (
        <p className="text-[11px] text-text-tertiary">Ask any question about platform performance, trends, risks, or opportunities.</p>
      )}
    </Card>
  )
}
