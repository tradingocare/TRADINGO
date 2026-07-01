'use client'
import { useState } from 'react'
import { Sparkles, Loader2, Sun, TrendingUp, Users, Shield, AlertTriangle, BarChart3, Globe, LineChart, Bell, LayoutDashboard, FileText, Lightbulb } from 'lucide-react'

type CopilotTab = 'brief' | 'insights' | 'alerts' | 'reports'

interface AiAdminCopilotProps {
  isGenerating: boolean
  onMorningBrief: (data: any) => Promise<any>
  onRevenueForecast: (data: any) => Promise<any>
  onUserGrowthPrediction: (data: any) => Promise<any>
  onFraudIntelligence: (data: any) => Promise<any>
  onChurnPrediction: (data: any) => Promise<any>
  onCategoryIntelligence: (data: any) => Promise<any>
  onGeoIntelligence: (data: any) => Promise<any>
  onMarketTrends: (data: any) => Promise<any>
  onAlerts: (data: any) => Promise<any>
  onExecutiveCopilot: (data: any) => Promise<any>
  onReport: (data: any) => Promise<any>
  onDecisionSupport: (data: any) => Promise<any>
  contextData?: Record<string, unknown>
}

const TABS: { key: CopilotTab; label: string; icon: typeof Sun }[] = [
  { key: 'brief', label: 'Brief', icon: Sun },
  { key: 'insights', label: 'Insights', icon: BarChart3 },
  { key: 'alerts', label: 'Alerts', icon: Bell },
  { key: 'reports', label: 'Reports', icon: FileText },
]

export function AiAdminCopilot({
  isGenerating, contextData = {},
  onMorningBrief, onRevenueForecast, onUserGrowthPrediction,
  onFraudIntelligence, onChurnPrediction, onCategoryIntelligence,
  onGeoIntelligence, onMarketTrends, onAlerts,
  onExecutiveCopilot, onReport, onDecisionSupport,
}: AiAdminCopilotProps) {
  const [activeTab, setActiveTab] = useState<CopilotTab>('brief')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState<string | null>(null)

  const handleAction = async (action: string, fn: (data: any) => Promise<any>, data: any) => {
    setLoading(action)
    try {
      const res = await fn(data)
      setResult(res?.data || res)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <Sparkles className="h-4 w-4 text-orange-400" />
        AI Admin Intelligence
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

      {activeTab === 'brief' && (
        <div className="space-y-2">
          <p className="text-[11px] text-white/40">Daily executive brief, revenue forecast, and user growth predictions</p>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => handleAction('brief', onMorningBrief, { ...contextData })}
              disabled={loading === 'brief'}
              className="flex items-center gap-1 px-2 py-1 text-[11px] bg-orange-500/10 text-orange-300 rounded hover:bg-orange-500/20 disabled:opacity-40 transition-colors">
              {loading === 'brief' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sun className="h-3 w-3" />}
              Morning Brief
            </button>
            <button onClick={() => handleAction('revenue', onRevenueForecast, { ...contextData })}
              disabled={loading === 'revenue'}
              className="flex items-center gap-1 px-2 py-1 text-[11px] bg-orange-500/10 text-orange-300 rounded hover:bg-orange-500/20 disabled:opacity-40 transition-colors">
              {loading === 'revenue' ? <Loader2 className="h-3 w-3 animate-spin" /> : <TrendingUp className="h-3 w-3" />}
              Revenue Forecast
            </button>
            <button onClick={() => handleAction('growth', onUserGrowthPrediction, { ...contextData })}
              disabled={loading === 'growth'}
              className="flex items-center gap-1 px-2 py-1 text-[11px] bg-orange-500/10 text-orange-300 rounded hover:bg-orange-500/20 disabled:opacity-40 transition-colors">
              {loading === 'growth' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Users className="h-3 w-3" />}
              User Growth
            </button>
            <button onClick={() => handleAction('copilot', onExecutiveCopilot, { ...contextData })}
              disabled={loading === 'copilot'}
              className="flex items-center gap-1 px-2 py-1 text-[11px] bg-orange-500/10 text-orange-300 rounded hover:bg-orange-500/20 disabled:opacity-40 transition-colors">
              {loading === 'copilot' ? <Loader2 className="h-3 w-3 animate-spin" /> : <LayoutDashboard className="h-3 w-3" />}
              Executive Copilot
            </button>
          </div>
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="space-y-2">
          <p className="text-[11px] text-white/40">Fraud intelligence, churn prediction, category/geo/market insights, and decision support</p>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => handleAction('fraud', onFraudIntelligence, { ...contextData })}
              disabled={loading === 'fraud'}
              className="flex items-center gap-1 px-2 py-1 text-[11px] bg-orange-500/10 text-orange-300 rounded hover:bg-orange-500/20 disabled:opacity-40 transition-colors">
              {loading === 'fraud' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Shield className="h-3 w-3" />}
              Fraud Intel
            </button>
            <button onClick={() => handleAction('churn', onChurnPrediction, { ...contextData })}
              disabled={loading === 'churn'}
              className="flex items-center gap-1 px-2 py-1 text-[11px] bg-orange-500/10 text-orange-300 rounded hover:bg-orange-500/20 disabled:opacity-40 transition-colors">
              {loading === 'churn' ? <Loader2 className="h-3 w-3 animate-spin" /> : <AlertTriangle className="h-3 w-3" />}
              Churn Prediction
            </button>
            <button onClick={() => handleAction('category', onCategoryIntelligence, { ...contextData })}
              disabled={loading === 'category'}
              className="flex items-center gap-1 px-2 py-1 text-[11px] bg-orange-500/10 text-orange-300 rounded hover:bg-orange-500/20 disabled:opacity-40 transition-colors">
              {loading === 'category' ? <Loader2 className="h-3 w-3 animate-spin" /> : <BarChart3 className="h-3 w-3" />}
              Category Intel
            </button>
            <button onClick={() => handleAction('geo', onGeoIntelligence, { ...contextData })}
              disabled={loading === 'geo'}
              className="flex items-center gap-1 px-2 py-1 text-[11px] bg-orange-500/10 text-orange-300 rounded hover:bg-orange-500/20 disabled:opacity-40 transition-colors">
              {loading === 'geo' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Globe className="h-3 w-3" />}
              Geo Intel
            </button>
            <button onClick={() => handleAction('trends', onMarketTrends, { ...contextData })}
              disabled={loading === 'trends'}
              className="flex items-center gap-1 px-2 py-1 text-[11px] bg-orange-500/10 text-orange-300 rounded hover:bg-orange-500/20 disabled:opacity-40 transition-colors">
              {loading === 'trends' ? <Loader2 className="h-3 w-3 animate-spin" /> : <LineChart className="h-3 w-3" />}
              Market Trends
            </button>
            <button onClick={() => handleAction('decisions', onDecisionSupport, { ...contextData })}
              disabled={loading === 'decisions'}
              className="flex items-center gap-1 px-2 py-1 text-[11px] bg-orange-500/10 text-orange-300 rounded hover:bg-orange-500/20 disabled:opacity-40 transition-colors">
              {loading === 'decisions' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Lightbulb className="h-3 w-3" />}
              Decision Support
            </button>
          </div>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-2">
          <p className="text-[11px] text-white/40">AI-powered platform alerts: revenue risk, fraud, server, engagement, collections</p>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => handleAction('alerts', onAlerts, { ...contextData })}
              disabled={loading === 'alerts'}
              className="flex items-center gap-1 px-2 py-1 text-[11px] bg-red-500/10 text-red-300 rounded hover:bg-red-500/20 disabled:opacity-40 transition-colors">
              {loading === 'alerts' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Bell className="h-3 w-3" />}
              Generate Alerts
            </button>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-2">
          <p className="text-[11px] text-white/40">Auto-generated weekly & monthly executive reports</p>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => handleAction('weekly', onReport, { reportType: 'weekly', ...contextData })}
              disabled={loading === 'weekly'}
              className="flex items-center gap-1 px-2 py-1 text-[11px] bg-orange-500/10 text-orange-300 rounded hover:bg-orange-500/20 disabled:opacity-40 transition-colors">
              {loading === 'weekly' ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
              Weekly Report
            </button>
            <button onClick={() => handleAction('monthly', onReport, { reportType: 'monthly', ...contextData })}
              disabled={loading === 'monthly'}
              className="flex items-center gap-1 px-2 py-1 text-[11px] bg-orange-500/10 text-orange-300 rounded hover:bg-orange-500/20 disabled:opacity-40 transition-colors">
              {loading === 'monthly' ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
              Monthly Report
            </button>
          </div>
        </div>
      )}

      {isGenerating && result === null && (
        <div className="flex items-center gap-2 text-xs text-white/40 py-2">
          <Loader2 className="h-3 w-3 animate-spin" />
          Analyzing platform data...
        </div>
      )}

      {result && (
        <div className="border border-white/[0.06] rounded bg-white/[0.02] p-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-white/30 font-mono">
              {result.provider}/{result.model} {result.cached && '(cached)'} · {result.latencyMs}ms · ${result.cost}
            </span>
          </div>
          <pre className="text-[11px] text-white/70 max-h-48 overflow-y-auto whitespace-pre-wrap font-mono">
            {typeof result.content === 'string' ? result.content : JSON.stringify(result.content, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
