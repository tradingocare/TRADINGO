'use client'
import { Sparkles, Sun, TrendingUp, Users, Shield, AlertTriangle, BarChart3, Globe, LineChart, Bell, FileText, Lightbulb, Loader2 } from 'lucide-react'
import { AiAdminCopilot } from '@/components/admin/ai-admin-copilot'
import {
  useAiMorningBrief, useAiRevenueForecast, useAiUserGrowthPrediction,
  useAiFraudIntelligence, useAiChurnPrediction, useAiCategoryIntelligence,
  useAiGeoIntelligence, useAiMarketTrends, useAiAlerts,
  useAiExecutiveCopilot, useAiWeeklyMonthlyReport, useAiDecisionSupport,
} from '@/hooks/use-ai-admin'

const FEATURES = [
  { icon: Sun, label: 'Morning Brief', desc: 'Daily executive summary of platform performance, key wins, and risks', color: 'text-orange-300' },
  { icon: TrendingUp, label: 'Revenue Forecast', desc: '7/30/90 day revenue prediction with confidence intervals', color: 'text-green-300' },
  { icon: Users, label: 'User Growth', desc: 'Buyer/seller/RM acquisition forecasts for next 1-3 months', color: 'text-blue-300' },
  { icon: Shield, label: 'Fraud Intelligence', desc: 'Cross-domain fraud analysis across wallet, referral, finance, disputes', color: 'text-red-300' },
  { icon: AlertTriangle, label: 'Churn Prediction', desc: 'Buyer & seller churn risk scoring with retention recommendations', color: 'text-yellow-300' },
  { icon: BarChart3, label: 'Category Intel', desc: 'Fastest/slowest/most profitable/emerging categories', color: 'text-purple-300' },
  { icon: Globe, label: 'Geo Intelligence', desc: 'Top cities/states and emerging market opportunities', color: 'text-cyan-300' },
  { icon: LineChart, label: 'Market Trends', desc: 'Demand, pricing, and seasonality analysis', color: 'text-pink-300' },
  { icon: Bell, label: 'AI Alerts', desc: 'Prioritized revenue, fraud, server, engagement, collections alerts', color: 'text-red-400' },
  { icon: Sparkles, label: 'Executive Copilot', desc: 'Platform health, revenue snapshot, growth, risk, recommendations', color: 'text-orange-300' },
  { icon: FileText, label: 'Reports', desc: 'Weekly & monthly auto-generated executive reports', color: 'text-indigo-300' },
  { icon: Lightbulb, label: 'Decision Support', desc: 'Campaigns, offers, advertising, market expansion suggestions', color: 'text-yellow-200' },
]

export default function AiConsolePage() {
  const morningBrief = useAiMorningBrief()
  const revenueForecast = useAiRevenueForecast()
  const userGrowth = useAiUserGrowthPrediction()
  const fraudIntel = useAiFraudIntelligence()
  const churnPred = useAiChurnPrediction()
  const categoryIntel = useAiCategoryIntelligence()
  const geoIntel = useAiGeoIntelligence()
  const marketTrends = useAiMarketTrends()
  const alerts = useAiAlerts()
  const execCopilot = useAiExecutiveCopilot()
  const report = useAiWeeklyMonthlyReport()
  const decisionSupport = useAiDecisionSupport()

  const isGenerating = morningBrief.isPending || revenueForecast.isPending || userGrowth.isPending
    || fraudIntel.isPending || churnPred.isPending || categoryIntel.isPending
    || geoIntel.isPending || marketTrends.isPending || alerts.isPending
    || execCopilot.isPending || report.isPending || decisionSupport.isPending

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,77,0,0.12)' }}>
          <Sparkles size={20} style={{ color: '#FF4D00' }} />
        </div>
        <div>
          <h1 className="text-xl font-black text-white">AI Admin Intelligence Console</h1>
          <p className="text-xs text-white/40">Enterprise AI-powered platform analytics, predictions, alerts, and executive copilot</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {FEATURES.map(f => {
          const Icon = f.icon
          return (
            <div key={f.label} className="rounded-2xl p-4 space-y-2 transition-all hover:-translate-y-0.5"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <Icon className={`h-5 w-5 ${f.color}`} />
              <h3 className="text-sm font-bold text-white">{f.label}</h3>
              <p className="text-[11px] text-white/40 leading-relaxed">{f.desc}</p>
            </div>
          )
        })}
      </div>

      <div className="rounded-2xl p-4"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <AiAdminCopilot
          isGenerating={isGenerating}
          contextData={{ platform: 'admin', date: new Date().toISOString().split('T')[0] }}
          onMorningBrief={(d) => morningBrief.mutateAsync(d)}
          onRevenueForecast={(d) => revenueForecast.mutateAsync(d)}
          onUserGrowthPrediction={(d) => userGrowth.mutateAsync(d)}
          onFraudIntelligence={(d) => fraudIntel.mutateAsync(d)}
          onChurnPrediction={(d) => churnPred.mutateAsync(d)}
          onCategoryIntelligence={(d) => categoryIntel.mutateAsync(d)}
          onGeoIntelligence={(d) => geoIntel.mutateAsync(d)}
          onMarketTrends={(d) => marketTrends.mutateAsync(d)}
          onAlerts={(d) => alerts.mutateAsync(d)}
          onExecutiveCopilot={(d) => execCopilot.mutateAsync(d)}
          onReport={(d) => report.mutateAsync(d)}
          onDecisionSupport={(d) => decisionSupport.mutateAsync(d)}
        />
      </div>
    </div>
  )
}
