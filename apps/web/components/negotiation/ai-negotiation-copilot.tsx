'use client'
import { useState } from 'react'
import { Sparkles, Loader2, TrendingUp, Target, AlertTriangle, MessageSquare, FileText, BarChart3, Lightbulb } from 'lucide-react'

interface AiNegotiationCopilotProps {
  negotiationId: string
  negotiationData: Record<string, unknown>
  onStrategy: (data: any) => Promise<any>
  onBuyerBehavior: (data: any) => Promise<any>
  onSellerSuggestions: (data: any) => Promise<any>
  onSentiment: (data: any) => Promise<any>
  onDealProbability: (data: any) => Promise<any>
  onReplies: (data: any) => Promise<any>
  onRisk: (data: any) => Promise<any>
  onSummary: (data: any) => Promise<any>
  onMemory: (data: any) => Promise<any>
  onTimeline: (data: any) => Promise<any>
  isGenerating: boolean
  role: 'BUYER' | 'SELLER'
}

type CopilotTab = 'strategy' | 'behaviour' | 'risk' | 'communication' | 'summary'

const TABS: { key: CopilotTab; label: string; icon: typeof TrendingUp }[] = [
  { key: 'strategy', label: 'Strategy', icon: TrendingUp },
  { key: 'behaviour', label: 'Behaviour', icon: BarChart3 },
  { key: 'risk', label: 'Risk', icon: AlertTriangle },
  { key: 'communication', label: 'Comm.', icon: MessageSquare },
  { key: 'summary', label: 'Summary', icon: FileText },
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
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <Sparkles className="h-4 w-4 text-orange-400" />
        AI Negotiation Copilot
      </div>

      <div className="flex gap-1 border-b border-white/[0.06] text-xs overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1 px-2 py-1.5 border-b-2 whitespace-nowrap transition-colors ${activeTab === t.key ? 'border-orange-400 text-orange-300' : 'border-transparent text-white/40 hover:text-white/60'}`}>
              <Icon className="h-3 w-3" />
              {t.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'strategy' && (
        <div className="space-y-2">
          <p className="text-xs text-white/50">AI-powered negotiation strategy and deal insights.</p>
          <button onClick={() => onStrategy({ negotiationData, role })}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] text-sm hover:bg-orange-500/10 hover:border-orange-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <TrendingUp className="h-3.5 w-3.5 text-orange-400" />}
            Generate Strategy
          </button>
          <button onClick={() => onDealProbability({ negotiationData })}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] text-sm hover:bg-green-500/10 hover:border-green-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Target className="h-3.5 w-3.5 text-green-400" />}
            Deal Probability
          </button>
          <button onClick={() => onTimeline({})}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] text-sm hover:bg-blue-500/10 hover:border-blue-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5 text-blue-400" />}
            Timeline Analysis
          </button>
        </div>
      )}

      {activeTab === 'behaviour' && (
        <div className="space-y-2">
          <p className="text-xs text-white/50">Behaviour analysis and improvement suggestions.</p>
          {role === 'SELLER' ? (
            <>
              <button onClick={() => onBuyerBehavior({ negotiationData })}
                disabled={isGenerating}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] text-sm hover:bg-purple-500/10 hover:border-purple-500/30 disabled:opacity-50 transition-colors">
                {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BarChart3 className="h-3.5 w-3.5 text-purple-400" />}
                Buyer Behaviour Analysis
              </button>
              <button onClick={() => onSellerSuggestions({ negotiationData })}
                disabled={isGenerating}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] text-sm hover:bg-cyan-500/10 hover:border-cyan-500/30 disabled:opacity-50 transition-colors">
                {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lightbulb className="h-3.5 w-3.5 text-cyan-400" />}
                Seller Improvements
              </button>
            </>
          ) : (
            <button onClick={() => onSellerSuggestions({ negotiationData })}
              disabled={isGenerating}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] text-sm hover:bg-purple-500/10 hover:border-purple-500/30 disabled:opacity-50 transition-colors">
              {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BarChart3 className="h-3.5 w-3.5 text-purple-400" />}
              Seller Behaviour Insights
            </button>
          )}
          <button onClick={() => onSentiment({})}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] text-sm hover:bg-amber-500/10 hover:border-amber-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BarChart3 className="h-3.5 w-3.5 text-amber-400" />}
            Sentiment Analysis
          </button>
        </div>
      )}

      {activeTab === 'risk' && (
        <div className="space-y-2">
          <p className="text-xs text-white/50">Risk detection and fraud signals.</p>
          <button onClick={() => onRisk({ negotiationData })}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] text-sm hover:bg-red-500/10 hover:border-red-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <AlertTriangle className="h-3.5 w-3.5 text-red-400" />}
            Risk Detection
          </button>
          <button onClick={() => onMemory({ negotiationId })}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] text-sm hover:bg-indigo-500/10 hover:border-indigo-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lightbulb className="h-3.5 w-3.5 text-indigo-400" />}
            AI Memory Context
          </button>
        </div>
      )}

      {activeTab === 'communication' && (
        <div className="space-y-2">
          <p className="text-xs text-white/50">Generate replies and translate messages.</p>
          <div className="flex gap-1">
            {['PROFESSIONAL', 'SHORT', 'COMMERCIAL', 'ESCALATION'].map(t => (
              <button key={t} onClick={() => setReplyTone(t)}
                className={`text-[10px] px-2 py-1 rounded ${replyTone === t ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' : 'text-white/40 border border-transparent hover:text-white/60'}`}>
                {t.charAt(0) + t.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          <button onClick={() => onReplies({ role, tone: replyTone, context: { negotiationData } })}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] text-sm hover:bg-blue-500/10 hover:border-blue-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquare className="h-3.5 w-3.5 text-blue-400" />}
            Suggested Replies ({replyTone.toLowerCase()})
          </button>
          <button onClick={() => onSentiment({})}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] text-sm hover:bg-amber-500/10 hover:border-amber-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BarChart3 className="h-3.5 w-3.5 text-amber-400" />}
            Sentiment Analysis
          </button>
        </div>
      )}

      {activeTab === 'summary' && (
        <div className="space-y-2">
          <p className="text-xs text-white/50">Summarize the negotiation conversation.</p>
          <button onClick={() => onSummary({})}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] text-sm hover:bg-green-500/10 hover:border-green-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5 text-green-400" />}
            Conversation Summary
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 text-[10px] text-white/30 pt-2">
        <Lightbulb className="h-3 w-3" />
        Powered by AI Gateway
      </div>
    </div>
  )
}
