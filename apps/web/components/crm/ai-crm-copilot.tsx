'use client'
import { useState } from 'react'
import { Sparkles, TrendingUp, Target, AlertTriangle, MessageSquare, FileText, BarChart3, Lightbulb, ArrowRight, Users } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Tabs, type Tab } from '@/components/ui/tabs'

interface CrmActionRequest {
  leadData: Record<string, unknown>
}

interface AiCrmCopilotProps {
  leadId: string
  leadData: Record<string, unknown>
  onScoring: (data: CrmActionRequest) => Promise<unknown>
  onNextBestAction: (data: CrmActionRequest) => Promise<unknown>
  onConversionProbability: (data: CrmActionRequest) => Promise<unknown>
  onInsights: (data: CrmActionRequest) => Promise<unknown>
  onSentiment: (data?: Record<string, never>) => Promise<unknown>
  onDealRisk: (data: CrmActionRequest) => Promise<unknown>
  onRecommendedActions: (data: CrmActionRequest) => Promise<unknown>
  onCommunicationTips: (data: CrmActionRequest) => Promise<unknown>
  isGenerating: boolean
}

type CopilotTab = 'insights' | 'actions' | 'risk' | 'communication'

const tabs: Tab[] = [
  { value: 'insights', label: 'Insights', icon: <BarChart3 className="h-3.5 w-3.5" /> },
  { value: 'actions', label: 'Actions', icon: <ArrowRight className="h-3.5 w-3.5" /> },
  { value: 'risk', label: 'Risk', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  { value: 'communication', label: 'Comm.', icon: <MessageSquare className="h-3.5 w-3.5" /> },
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
      <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
        <Sparkles className="h-4 w-4 text-accent-500" />
        AI CRM Copilot
      </div>

      <Tabs tabs={tabs} value={activeTab} onChange={v => setActiveTab(v as CopilotTab)} />

      {activeTab === 'insights' && (
        <div className="space-y-2">
          <p className="text-xs text-text-secondary">AI-powered lead insights and scoring.</p>
          <button onClick={() => onScoring({ leadData })}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-accent-500/10 hover:border-accent-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <LoadingSpinner size="xs" color="accent" /> : <TrendingUp className="h-3.5 w-3.5 text-accent-500" />}
            AI Lead Scoring
          </button>
          <button onClick={() => onConversionProbability({ leadData })}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-green-500/10 hover:border-green-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <LoadingSpinner size="xs" color="accent" /> : <Target className="h-3.5 w-3.5 text-green-400" />}
            Conversion Probability
          </button>
          <button onClick={() => onInsights({ leadData })}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-blue-500/10 hover:border-blue-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <LoadingSpinner size="xs" color="accent" /> : <Users className="h-3.5 w-3.5 text-blue-400" />}
            Deep Lead Insights
          </button>
          <button onClick={() => onSentiment({})}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-accent-500/10 hover:border-accent-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <LoadingSpinner size="xs" color="accent" /> : <BarChart3 className="h-3.5 w-3.5 text-accent-500" />}
            Sentiment Analysis
          </button>
        </div>
      )}

      {activeTab === 'actions' && (
        <div className="space-y-2">
          <p className="text-xs text-text-secondary">Recommended actions and next steps.</p>
          <button onClick={() => onNextBestAction({ leadData })}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-purple-500/10 hover:border-purple-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <LoadingSpinner size="xs" color="accent" /> : <ArrowRight className="h-3.5 w-3.5 text-purple-400" />}
            Next Best Action
          </button>
          <button onClick={() => onRecommendedActions({ leadData })}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-cyan-500/10 hover:border-cyan-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <LoadingSpinner size="xs" color="accent" /> : <Lightbulb className="h-3.5 w-3.5 text-cyan-400" />}
            Recommended Actions
          </button>
        </div>
      )}

      {activeTab === 'risk' && (
        <div className="space-y-2">
          <p className="text-xs text-text-secondary">Deal risk detection and alerts.</p>
          <button onClick={() => onDealRisk({ leadData })}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-red-500/10 hover:border-red-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <LoadingSpinner size="xs" color="accent" /> : <AlertTriangle className="h-3.5 w-3.5 text-red-400" />}
            Deal Risk Detection
          </button>
        </div>
      )}

      {activeTab === 'communication' && (
        <div className="space-y-2">
          <p className="text-xs text-text-secondary">Personalized communication guidance.</p>
          <button onClick={() => onCommunicationTips({ leadData })}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-indigo-500/10 hover:border-indigo-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <LoadingSpinner size="xs" color="accent" /> : <MessageSquare className="h-3.5 w-3.5 text-indigo-400" />}
            Communication Tips
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
