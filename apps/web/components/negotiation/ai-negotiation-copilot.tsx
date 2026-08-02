'use client'
import { useState } from 'react'
import { Sparkles, TrendingUp, Target, AlertTriangle, MessageSquare, FileText, BarChart3, Lightbulb } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Tabs, type Tab } from '@/components/ui/tabs'

interface AiNegotiationCopilotProps {
  negotiationId: string
  negotiationData: Record<string, unknown>
  onStrategy: (data: { negotiationData: Record<string, unknown>; role: 'BUYER' | 'SELLER' }) => Promise<unknown>
  onBuyerBehavior: (data: { negotiationData: Record<string, unknown> }) => Promise<unknown>
  onSellerSuggestions: (data: { negotiationData: Record<string, unknown> }) => Promise<unknown>
  onSentiment: (data?: Record<string, never>) => Promise<unknown>
  onDealProbability: (data: { negotiationData: Record<string, unknown> }) => Promise<unknown>
  onReplies: (data: { role: 'BUYER' | 'SELLER'; tone: string; context: { negotiationData: Record<string, unknown> } }) => Promise<unknown>
  onRisk: (data: { negotiationData: Record<string, unknown> }) => Promise<unknown>
  onSummary: (data?: Record<string, never>) => Promise<unknown>
  onMemory: (data: { negotiationId: string }) => Promise<unknown>
  onTimeline: (data?: Record<string, never>) => Promise<unknown>
  isGenerating: boolean
  role: 'BUYER' | 'SELLER'
}

type CopilotTab = 'strategy' | 'behaviour' | 'risk' | 'communication' | 'summary'

const tabs: Tab[] = [
  { value: 'strategy', label: 'Strategy', icon: <TrendingUp className="h-3.5 w-3.5" /> },
  { value: 'behaviour', label: 'Behaviour', icon: <BarChart3 className="h-3.5 w-3.5" /> },
  { value: 'risk', label: 'Risk', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  { value: 'communication', label: 'Comm.', icon: <MessageSquare className="h-3.5 w-3.5" /> },
  { value: 'summary', label: 'Summary', icon: <FileText className="h-3.5 w-3.5" /> },
]

export function AiNegotiationCopilot({
  negotiationId, negotiationData, role,
  onStrategy, onBuyerBehavior, onSellerSuggestions,
  onSentiment, onDealProbability, onReplies,
  onRisk, onSummary, onMemory, onTimeline,
  isGenerating,
}: AiNegotiationCopilotProps) {
  const [activeTab, setActiveTab] = useState<CopilotTab>('strategy')
  const [replyTone, setReplyTone] = useState<string>('PROFESSIONAL')

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
        <Sparkles className="h-4 w-4 text-accent-500" />
        AI Negotiation Copilot
      </div>

      <Tabs tabs={tabs} value={activeTab} onChange={v => setActiveTab(v as CopilotTab)} />

      {activeTab === 'strategy' && (
        <div className="space-y-2">
          <p className="text-xs text-text-secondary">AI-powered negotiation strategy and deal insights.</p>
          <button onClick={() => onStrategy({ negotiationData, role })}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-accent-500/10 hover:border-accent-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <LoadingSpinner size="xs" color="accent" /> : <TrendingUp className="h-3.5 w-3.5 text-accent-500" />}
            Generate Strategy
          </button>
          <button onClick={() => onDealProbability({ negotiationData })}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-green-500/10 hover:border-green-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <LoadingSpinner size="xs" color="accent" /> : <Target className="h-3.5 w-3.5 text-green-400" />}
            Deal Probability
          </button>
          <button onClick={() => onTimeline({})}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-blue-500/10 hover:border-blue-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <LoadingSpinner size="xs" color="accent" /> : <FileText className="h-3.5 w-3.5 text-blue-400" />}
            Timeline Analysis
          </button>
        </div>
      )}

      {activeTab === 'behaviour' && (
        <div className="space-y-2">
          <p className="text-xs text-text-secondary">Behaviour analysis and improvement suggestions.</p>
          {role === 'SELLER' ? (
            <>
              <button onClick={() => onBuyerBehavior({ negotiationData })}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-purple-500/10 hover:border-purple-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <LoadingSpinner size="xs" color="accent" /> : <BarChart3 className="h-3.5 w-3.5 text-purple-400" />}
            Buyer Behaviour Analysis
              </button>
              <button onClick={() => onSellerSuggestions({ negotiationData })}
                disabled={isGenerating}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-cyan-500/10 hover:border-cyan-500/30 disabled:opacity-50 transition-colors">
                {isGenerating ? <LoadingSpinner size="xs" color="accent" /> : <Lightbulb className="h-3.5 w-3.5 text-cyan-400" />}
                Seller Improvements
              </button>
            </>
          ) : (
            <button onClick={() => onSellerSuggestions({ negotiationData })}
              disabled={isGenerating}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-purple-500/10 hover:border-purple-500/30 disabled:opacity-50 transition-colors">
              {isGenerating ? <LoadingSpinner size="xs" color="accent" /> : <BarChart3 className="h-3.5 w-3.5 text-purple-400" />}
              Seller Behaviour Insights
            </button>
          )}
          <button onClick={() => onSentiment({})}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-accent-500/10 hover:border-accent-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <LoadingSpinner size="xs" color="accent" /> : <BarChart3 className="h-3.5 w-3.5 text-accent-500" />}
            Sentiment Analysis
          </button>
        </div>
      )}

      {activeTab === 'risk' && (
        <div className="space-y-2">
          <p className="text-xs text-text-secondary">Risk detection and fraud signals.</p>
          <button onClick={() => onRisk({ negotiationData })}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-red-500/10 hover:border-red-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <LoadingSpinner size="xs" color="accent" /> : <AlertTriangle className="h-3.5 w-3.5 text-red-400" />}
            Risk Detection
          </button>
          <button onClick={() => onMemory({ negotiationId })}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-indigo-500/10 hover:border-indigo-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <LoadingSpinner size="xs" color="accent" /> : <Lightbulb className="h-3.5 w-3.5 text-indigo-400" />}
            AI Memory Context
          </button>
        </div>
      )}

      {activeTab === 'communication' && (
        <div className="space-y-2">
          <p className="text-xs text-text-secondary">Generate replies and translate messages.</p>
          <div className="flex gap-1">
            {['PROFESSIONAL', 'SHORT', 'COMMERCIAL', 'ESCALATION'].map(t => (
              <button key={t} onClick={() => setReplyTone(t)}
                className={`text-[10px] px-2 py-1 rounded ${replyTone === t ? 'bg-accent-500/20 text-accent-500 border border-accent-500/30' : 'text-text-tertiary border border-transparent hover:text-text-secondary'}`}>
                {t.charAt(0) + t.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          <button onClick={() => onReplies({ role, tone: replyTone, context: { negotiationData } })}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-blue-500/10 hover:border-blue-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <LoadingSpinner size="xs" color="accent" /> : <MessageSquare className="h-3.5 w-3.5 text-blue-400" />}
            Suggested Replies ({replyTone.toLowerCase()})
          </button>
          <button onClick={() => onSentiment({})}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-accent-500/10 hover:border-accent-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <LoadingSpinner size="xs" color="accent" /> : <BarChart3 className="h-3.5 w-3.5 text-accent-500" />}
            Sentiment Analysis
          </button>
        </div>
      )}

      {activeTab === 'summary' && (
        <div className="space-y-2">
          <p className="text-xs text-text-secondary">Summarize the negotiation conversation.</p>
          <button onClick={() => onSummary({})}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-green-500/10 hover:border-green-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <LoadingSpinner size="xs" color="accent" /> : <FileText className="h-3.5 w-3.5 text-green-400" />}
            Conversation Summary
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 text-[10px] text-text-tertiary pt-2">
        <Lightbulb className="h-3 w-3" />
        Powered by AI Gateway
      </div>
    </div>
  )
}
