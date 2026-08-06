'use client'
import { DashboardPageHeader } from '@/components/dashboard'
import { MorningBriefCard } from '@/components/founder-ai/morning-brief-card'
import { EveningSummaryCard } from '@/components/founder-ai/evening-summary-card'
import { ExecutiveDashboard } from '@/components/founder-ai/executive-dashboard'
import { DecisionCenterCard } from '@/components/founder-ai/decision-center-card'
import { RiskIntelligenceCard } from '@/components/founder-ai/risk-intelligence-card'
import { GrowthIntelligenceCard } from '@/components/founder-ai/growth-intelligence-card'
import { FounderCopilot } from '@/components/founder-ai/founder-copilot'
import { InsightPanel } from '@/components/founder-ai/insight-panel'
import { HealthScoreCard } from '@/components/founder-ai/health-score-card'
import { ExecutivePrioritiesCard } from '@/components/founder-ai/executive-priorities-card'
import { ExecutiveTimelineCard } from '@/components/founder-ai/executive-timeline-card'
import { MarketplaceIntelligenceCard } from '@/components/founder-ai/marketplace-intelligence-card'
import { TradeservIntelligenceCard } from '@/components/founder-ai/tradeserv-intelligence-card'
import { TradeTalkIntelligenceCard } from '@/components/founder-ai/tradetalk-intelligence-card'
import { MembershipIntelligenceCard } from '@/components/founder-ai/membership-intelligence-card'
import { GocashIntelligenceCard } from '@/components/founder-ai/gocash-intelligence-card'
import { TradTrustIntelligenceCard } from '@/components/founder-ai/tradtrust-intelligence-card'
import { AdvertisingIntelligenceCard } from '@/components/founder-ai/advertising-intelligence-card'
import { SecurityIntelligenceCard } from '@/components/founder-ai/security-intelligence-card'
import {
  useMorningBrief, useEveningSummary, useExecutiveDashboard,
  useDecisionCenter, useRiskIntelligence, useGrowthIntelligence,
  useFounderCopilot, useHealthScore, useExecutivePriorities,
  useExecutiveTimeline, useExecutiveReport,
  useMarketplaceIntelligence, useTradeservIntelligence,
  useTradeTalkIntelligence, useMembershipIntelligence,
  useGocashIntelligence, useTradTrustIntelligence, useAdvertisingIntelligence,
  useSecurityIntelligence,
} from '@/hooks/use-ai-founder'
import { useState } from 'react'
import { FileText } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function FounderAiPage() {
  const { data: morningBrief, isLoading: mbLoading, error: mbError } = useMorningBrief()
  const { data: eveningSummary, isLoading: esLoading, error: esError } = useEveningSummary()
  const { data: execDashboard, isLoading: edLoading, error: edError } = useExecutiveDashboard()
  const { data: riskIntel, isLoading: riLoading, error: riError } = useRiskIntelligence()
  const { data: growthIntel, isLoading: giLoading, error: giError } = useGrowthIntelligence()
  const { data: healthScore, isLoading: hsLoading, error: hsError } = useHealthScore()
  const { data: priorities, isLoading: prLoading, error: prError } = useExecutivePriorities()
  const { data: timeline, isLoading: tlLoading, error: tlError } = useExecutiveTimeline()
  const { data: mpIntel, isLoading: mpLoading, error: mpError } = useMarketplaceIntelligence()
  const { data: tsIntel, isLoading: tsLoading, error: tsError } = useTradeservIntelligence()
  const { data: ttIntel, isLoading: ttLoading, error: ttError } = useTradeTalkIntelligence()
  const { data: mbIntel, isLoading: mbIntelLoading, error: mbIntelError } = useMembershipIntelligence()
  const { data: gcIntel, isLoading: gcLoading, error: gcError } = useGocashIntelligence()
  const { data: trIntel, isLoading: trLoading, error: trError } = useTradTrustIntelligence()
  const { data: adIntel, isLoading: adLoading, error: adError } = useAdvertisingIntelligence()
  const { data: secIntel, isLoading: secLoading, error: secError } = useSecurityIntelligence()

  const decisionCenter = useDecisionCenter()
  const founderCopilot = useFounderCopilot()

  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'>('daily')
  const { data: report, isLoading: rpLoading, refetch: refetchReport } = useExecutiveReport(reportType)

  const allInsights = [
    ...(morningBrief?.insights ?? []),
    ...(eveningSummary?.insights ?? []),
    ...(execDashboard?.insights ?? []),
    ...(riskIntel?.insights ?? []),
    ...(growthIntel?.insights ?? []),
    ...(healthScore?.insights ?? []),
    ...(priorities?.insights ?? []),
    ...(timeline?.insights ?? []),
    ...(report?.insights ?? []),
    ...(mpIntel?.insights ?? []),
    ...(tsIntel?.insights ?? []),
    ...(ttIntel?.insights ?? []),
    ...(mbIntel?.insights ?? []),
    ...(gcIntel?.insights ?? []),
    ...(trIntel?.insights ?? []),
    ...(adIntel?.insights ?? []),
    ...(secIntel?.insights ?? []),
  ].filter((v, i, a) => a.findIndex(t => t.title === v.title) === i)

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <div className="pointer-events-none fixed inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(245, 158, 11, 0.08), transparent)' }} />
      <div className="relative mx-auto max-w-7xl px-4 py-8">
        <div className="space-y-6">
          <DashboardPageHeader
            title="Founder AI"
            description="Executive Intelligence Layer — unified platform intelligence, risks, and opportunities"
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <HealthScoreCard data={healthScore?.data} isLoading={hsLoading} error={hsError as Error | null} />
            <MorningBriefCard data={morningBrief?.data} isLoading={mbLoading} error={mbError as Error | null} />
          </div>

          <EveningSummaryCard data={eveningSummary?.data} isLoading={esLoading} error={esError as Error | null} />
          <ExecutiveDashboard data={execDashboard?.data} isLoading={edLoading} error={edError as Error | null} />
          <ExecutiveTimelineCard data={timeline?.data} isLoading={tlLoading} error={tlError as Error | null} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <RiskIntelligenceCard data={riskIntel?.data} isLoading={riLoading} error={riError as Error | null} />
            <GrowthIntelligenceCard data={growthIntel?.data} isLoading={giLoading} error={giError as Error | null} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <MarketplaceIntelligenceCard data={mpIntel?.data} isLoading={mpLoading} error={mpError as Error | null} />
            <TradeservIntelligenceCard data={tsIntel?.data} isLoading={tsLoading} error={tsError as Error | null} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TradeTalkIntelligenceCard data={ttIntel?.data} isLoading={ttLoading} error={ttError as Error | null} />
            <MembershipIntelligenceCard data={mbIntel?.data} isLoading={mbIntelLoading} error={mbIntelError as Error | null} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <GocashIntelligenceCard data={gcIntel?.data} isLoading={gcLoading} error={gcError as Error | null} />
            <TradTrustIntelligenceCard data={trIntel?.data} isLoading={trLoading} error={trError as Error | null} />
          </div>

          <SecurityIntelligenceCard data={secIntel?.data} isLoading={secLoading} error={secError as Error | null} />

          <AdvertisingIntelligenceCard data={adIntel?.data} isLoading={adLoading} error={adError as Error | null} />

          <ExecutivePrioritiesCard data={priorities?.data} isLoading={prLoading} error={prError as Error | null} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <DecisionCenterCard
              onAnalyze={data => decisionCenter.mutateAsync(data)}
              isGenerating={decisionCenter.isPending}
            />
            <FounderCopilot
              onAsk={data => founderCopilot.mutateAsync(data)}
              isGenerating={founderCopilot.isPending}
            />
          </div>

          <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <FileText className="h-4 w-4 text-indigo-400" />
              Executive Reports
            </div>
            <div className="flex flex-wrap gap-2">
              {(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] as const).map((t) => (
                <button key={t} onClick={() => { setReportType(t); setTimeout(() => refetchReport(), 0) }}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${reportType === t ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-surface text-white/40 hover:text-white/60 border border-border'}`}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            {rpLoading ? (
              <div className="flex items-center gap-2 text-xs text-white/40"><LoadingSpinner size="xs" /> Generating report...</div>
            ) : report?.data ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-white/60">{report.data.summary}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {report.data.sections.map((s, i) => (
                    <div key={i} className="rounded-lg border border-border bg-surface p-2.5">
                      <div className="text-[11px] font-medium text-white/70 mb-1">{s.title}</div>
                      {Object.entries(s.data).slice(0, 3).map(([key, val]) => (
                        <div key={key} className="flex items-center justify-between text-[10px] text-white/40">
                          <span>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="font-medium text-white/60">{typeof val === 'number' ? (key.toLowerCase().includes('revenue') || key.toLowerCase().includes('amount') ? `₹${val.toLocaleString()}` : val.toFixed(1)) : String(val)}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                {report.data.recommendations.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[11px] font-medium text-white/50">Recommendations</div>
                    {report.data.recommendations.map((r, i) => (
                      <div key={i} className="flex items-start gap-2 text-[11px] text-white/40">
                        <span className="text-emerald-400 mt-0.5">•</span>
                        {r}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-white/40">Select a report type to generate an executive report.</p>
            )}
          </div>

          {allInsights.length > 0 && <InsightPanel insights={allInsights} />}
        </div>
      </div>
    </div>
  )
}
