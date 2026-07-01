'use client'
import { useState } from 'react'
import { Sparkles, Loader2, TrendingUp, Target, AlertTriangle, MessageSquare, FileText, BarChart3, Lightbulb, ArrowRight, Users } from 'lucide-react'

interface AiCrmCopilotProps {
  leadId: string
  leadData: Record<string, unknown>
  onScoring: (data: any) => Promise<any>
  onNextBestAction: (data: any) => Promise<any>
  onConversionProbability: (data: any) => Promise<any>
  onInsights: (data: any) => Promise<any>
  onSentiment: (data: any) => Promise<any>
  onDealRisk: (data: any) => Promise<any>
  onRecommendedActions: (data: any) => Promise<any>
  onCommunicationTips: (data: any) => Promise<any>
  isGenerating: boolean
}

type CopilotTab = 'insights' | 'actions' | 'risk' | 'communication'

const TABS: { key: CopilotTab; label: string; icon: typeof TrendingUp }[] = [
  { key: 'insights', label: 'Insights', icon: BarChart3 },
  { key: 'actions', label: 'Actions', icon: ArrowRight },
  { key: 'risk', label: 'Risk', icon: AlertTriangle },
  { key: 'communication', label: 'Comm.', icon: MessageSquare },
]

export function AiCrmCopilot({
  leadId, leadData,
  onScoring, onNextBestAction, onConversionProbability,
  onInsights, onSentiment, onDealRisk,
  onRecommendedActions, onCommunicationTips,
  isGenerating,
}: AiCrmCopilotProps) {
  const [activeTab, setActiveTab] = useState<CopilotTab>('insights')

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <Sparkles className="h-4 w-4 text-orange-400" />
        AI CRM Copilot
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

      {activeTab === 'insights' && (
        <div className="space-y-2">
          <p className="text-xs text-white/50">AI-powered lead insights and scoring.</p>
          <button onClick={() => onScoring({ leadData })}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] text-sm hover:bg-orange-500/10 hover:border-orange-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <TrendingUp className="h-3.5 w-3.5 text-orange-400" />}
            AI Lead Scoring
          </button>
          <button onClick={() => onConversionProbability({ leadData })}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] text-sm hover:bg-green-500/10 hover:border-green-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Target className="h-3.5 w-3.5 text-green-400" />}
            Conversion Probability
          </button>
          <button onClick={() => onInsights({ leadData })}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] text-sm hover:bg-blue-500/10 hover:border-blue-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Users className="h-3.5 w-3.5 text-blue-400" />}
            Deep Lead Insights
          </button>
          <button onClick={() => onSentiment({})}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] text-sm hover:bg-amber-500/10 hover:border-amber-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BarChart3 className="h-3.5 w-3.5 text-amber-400" />}
            Sentiment Analysis
          </button>
        </div>
      )}

      {activeTab === 'actions' && (
        <div className="space-y-2">
          <p className="text-xs text-white/50">Recommended actions and next steps.</p>
          <button onClick={() => onNextBestAction({ leadData })}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] text-sm hover:bg-purple-500/10 hover:border-purple-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5 text-purple-400" />}
            Next Best Action
          </button>
          <button onClick={() => onRecommendedActions({ leadData })}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] text-sm hover:bg-cyan-500/10 hover:border-cyan-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lightbulb className="h-3.5 w-3.5 text-cyan-400" />}
            Recommended Actions
          </button>
        </div>
      )}

      {activeTab === 'risk' && (
        <div className="space-y-2">
          <p className="text-xs text-white/50">Deal risk detection and alerts.</p>
          <button onClick={() => onDealRisk({ leadData })}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] text-sm hover:bg-red-500/10 hover:border-red-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <AlertTriangle className="h-3.5 w-3.5 text-red-400" />}
            Deal Risk Detection
          </button>
        </div>
      )}

      {activeTab === 'communication' && (
        <div className="space-y-2">
          <p className="text-xs text-white/50">Personalized communication guidance.</p>
          <button onClick={() => onCommunicationTips({ leadData })}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] text-sm hover:bg-indigo-500/10 hover:border-indigo-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquare className="h-3.5 w-3.5 text-indigo-400" />}
            Communication Tips
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
