'use client';

import { useState } from 'react';
import {
  LayoutDashboard, Users, FileText, Image, Shield, TrendingUp, Bell, MessageCircle,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import {
  useDashboardCopilot, useClientAcquisition, useProposalIntelligence,
  usePortfolioIntelligence, useReputationAdvisor, useRevenuePlanner,
  useProfessionalNotifications, useTradeTalkIntegration,
} from '@/hooks/use-professional-agent';

type Tab = 'overview' | 'acquisition' | 'proposals' | 'portfolio' | 'reputation' | 'revenue';

const TABS: { key: Tab; label: string; icon: React.ElementType; desc: string }[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard, desc: 'Dashboard copilot with priorities, alerts, and metrics' },
  { key: 'acquisition', label: 'Acquisition', icon: Users, desc: 'Marketplace demand, nearby opportunities, and TradeTalk communities' },
  { key: 'proposals', label: 'Proposals', icon: FileText, desc: 'Proposal intelligence, pricing insights, and win rate' },
  { key: 'portfolio', label: 'Portfolio', icon: Image, desc: 'Portfolio quality, coverage, and improvement suggestions' },
  { key: 'reputation', label: 'Reputation', icon: Shield, desc: 'Trust score, reviews, verification, and improvement plan' },
  { key: 'revenue', label: 'Revenue', icon: TrendingUp, desc: 'Revenue planning, pipeline forecasting, and goals' },
];

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-48 rounded bg-border" />
      <div className="h-4 w-96 rounded bg-border" />
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-border" />
        ))}
      </div>
      <div className="h-64 rounded-lg bg-border" />
    </div>
  );
}

function ChangeBadge({ value, type }: { value: number; type: 'positive' | 'negative' | 'neutral' }) {
  if (type === 'neutral') return <span className="text-xs text-text-tertiary">{value}%</span>;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${type === 'positive' ? 'text-emerald-400' : 'text-status-error'}`}>
      {type === 'positive' ? '+' : ''}{value}%
    </span>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
  return (
    <div className="rounded-lg border border-border bg-surface-secondary p-4">
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <p className="mt-1 text-2xl font-semibold text-text-primary">{value}</p>
    </div>
  );
}

export default function ProfessionalAgentPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const { data: copilot, isLoading: copilotLoading, error: copilotError } = useDashboardCopilot();
  const { data: acquisition, isLoading: acquisitionLoading, error: acquisitionError } = useClientAcquisition();
  const { data: proposals, isLoading: proposalsLoading, error: proposalsError } = useProposalIntelligence();
  const { data: portfolio, isLoading: portfolioLoading, error: portfolioError } = usePortfolioIntelligence();
  const { data: reputation, isLoading: reputationLoading, error: reputationError } = useReputationAdvisor();
  const { data: revenue, isLoading: revenueLoading, error: revenueError } = useRevenuePlanner();

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab data={copilot} isLoading={copilotLoading} error={copilotError} />;
      case 'acquisition': return <AcquisitionTab data={acquisition} isLoading={acquisitionLoading} error={acquisitionError} />;
      case 'proposals': return <ProposalsTab data={proposals} isLoading={proposalsLoading} error={proposalsError} />;
      case 'portfolio': return <PortfolioTab data={portfolio} isLoading={portfolioLoading} error={portfolioError} />;
      case 'reputation': return <ReputationTab data={reputation} isLoading={reputationLoading} error={reputationError} />;
      case 'revenue': return <RevenueTab data={revenue} isLoading={revenueLoading} error={revenueError} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">TradeAI Professional Agent</h1>
          <p className="mt-1 text-sm text-text-secondary">Your AI advisor for client acquisition, proposals, portfolio, reputation, and revenue planning</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-secondary px-3 py-2 text-sm text-text-secondary">
          <div className="text-accent"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l2 7h7l-5 4 2 7-6-4-6 4 2-7-5-4h7z" /></svg></div>
          <span>Powered by <span className="font-medium text-text-primary">TradeAI</span></span>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-surface-secondary p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} title={tab.desc}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.key ? 'bg-accent text-btn-primary-text shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-surface'}`}>
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-surface p-6">
        {renderContent()}
      </div>
    </div>
  );
}

function OverviewTab({ data, isLoading, error }: { data: any; isLoading: boolean; error: any }) {
  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState title="Error" message="Failed to load dashboard insights" />;
  if (!data) return <EmptyState title="No dashboard data available" />;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Services" value={data.metrics?.services ?? 0} icon={LayoutDashboard} />
        <StatCard label="Active Services" value={data.metrics?.activeServices ?? 0} icon={LayoutDashboard} />
        <StatCard label="Portfolio Items" value={data.metrics?.portfolioItems ?? 0} icon={Image} />
        <StatCard label="Reviews" value={data.metrics?.reviews ?? 0} icon={Shield} />
        <StatCard label="Inquiries" value={data.metrics?.inquiries ?? 0} icon={Users} />
        <StatCard label="Proposals" value={data.metrics?.proposals ?? 0} icon={FileText} />
        <StatCard label="Trust Score" value={data.metrics?.trustScore ?? 0} icon={Shield} />
        <StatCard label="Win Rate" value={`${data.metrics?.winRate ?? 0}%`} icon={TrendingUp} />
      </div>

      {data.priorities?.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-text-primary">Priorities</h3>
          <div className="space-y-2">
            {data.priorities.map((p: any, i: number) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border border-border bg-surface-secondary p-3">
                <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${p.impact === 'high' ? 'bg-status-error' : p.impact === 'medium' ? 'bg-status-warning' : 'bg-text-tertiary'}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary">{p.title}</p>
                  <p className="text-xs text-text-secondary">{p.description}</p>
                </div>
                {p.actionUrl && (
                  <a href={p.actionUrl} className="shrink-0 text-xs font-medium text-accent hover:underline">{p.actionLabel || 'View'}</a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {data.urgentAlerts?.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-status-error">Urgent Alerts</h3>
          <div className="space-y-2">
            {data.urgentAlerts.map((a: any, i: number) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border border-status-error/20 bg-status-error/5 p-3">
                <div className="mt-0.5 h-2 w-2 rounded-full bg-status-error shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary">{a.title}</p>
                  <p className="text-xs text-text-secondary">{a.description}</p>
                </div>
                {a.actionUrl && (
                  <a href={a.actionUrl} className="shrink-0 text-xs font-medium text-accent hover:underline">{a.actionLabel || 'Take Action'}</a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {data.growthOpportunities?.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-emerald-400">Growth Opportunities</h3>
          <div className="space-y-2">
            {data.growthOpportunities.map((o: any, i: number) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border border-border bg-surface-secondary p-3">
                <div className="mt-0.5 h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary">{o.title}</p>
                  <p className="text-xs text-text-secondary">{o.description}</p>
                </div>
                {o.actionUrl && (
                  <a href={o.actionUrl} className="shrink-0 text-xs font-medium text-accent hover:underline">{o.actionLabel || 'Explore'}</a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-3 text-sm font-semibold text-text-primary">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          {data.quickActions?.map((a: any, i: number) => (
            <a key={i} href={a.href} className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-secondary px-4 py-2 text-sm font-medium text-text-primary hover:bg-accent/10 hover:text-accent transition-colors">
              {a.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function AcquisitionTab({ data, isLoading, error }: { data: any; isLoading: boolean; error: any }) {
  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState title="Error" message="Failed to load acquisition insights" />;
  if (!data) return <EmptyState title="No acquisition data available" icon={Users} />;

  return (
    <div className="space-y-6">
      {data.marketplaceDemand?.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-text-primary">Marketplace Demand</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {data.marketplaceDemand.map((o: any, i: number) => (
              <div key={i} className="rounded-lg border border-border bg-surface-secondary p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-text-primary">{o.title}</h4>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${o.demandLevel === 'high' ? 'bg-emerald-400/10 text-emerald-400' : o.demandLevel === 'medium' ? 'bg-amber-400/10 text-amber-400' : 'bg-text-tertiary/10 text-text-tertiary'}`}>
                    {o.demandLevel} demand
                  </span>
                </div>
                <p className="mt-1 text-xs text-text-secondary">{o.description}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-text-tertiary">
                  <span>Competition: {o.competitionLevel}</span>
                  <span>Score: {o.potentialScore}/100</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.nearbyOpportunities?.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-text-primary">Nearby Opportunities</h3>
          <div className="space-y-2">
            {data.nearbyOpportunities.map((o: any, i: number) => (
              <div key={i} className="rounded-lg border border-border bg-surface-secondary p-3">
                <p className="text-sm font-medium text-text-primary">{o.title}</p>
                <p className="text-xs text-text-secondary">{o.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.tradeTalkCommunities?.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-text-primary">TradeTalk Communities</h3>
          <div className="space-y-2">
            {data.tradeTalkCommunities.map((c: any, i: number) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-surface-secondary p-3">
                <div>
                  <p className="text-sm font-medium text-text-primary">{c.name}</p>
                  <p className="text-xs text-text-secondary">{c.memberCount} members</p>
                </div>
                <span className={`text-xs font-medium ${c.relevance === 'high' ? 'text-emerald-400' : 'text-text-tertiary'}`}>{c.relevance} relevance</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.recommendations?.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-text-primary">Recommendations</h3>
          <div className="space-y-1">
            {data.recommendations.map((r: string, i: number) => (
              <p key={i} className="text-xs text-text-secondary">• {r}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProposalsTab({ data, isLoading, error }: { data: any; isLoading: boolean; error: any }) {
  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState title="Error" message="Failed to load proposal intelligence" />;
  if (!data) return <EmptyState title="No proposal data available" icon={FileText} />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Proposals" value={data.totalProposals ?? 0} icon={FileText} />
        <StatCard label="Win Rate" value={`${data.winRate ?? 0}%`} icon={TrendingUp} />
        <StatCard label="Avg Value" value={`₹${(data.averageProposalScore ?? 0).toLocaleString()}`} icon={TrendingUp} />
      </div>

      {data.pricingInsights?.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-text-primary">Pricing Insights</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {data.pricingInsights.map((p: any, i: number) => (
              <div key={i} className="rounded-lg border border-border bg-surface-secondary p-3">
                <p className="text-xs text-text-secondary">{p.label}</p>
                <p className="mt-1 text-lg font-semibold text-text-primary">{p.value}</p>
                <span className={`text-xs font-medium ${p.type === 'competitive' ? 'text-emerald-400' : p.type === 'premium' ? 'text-amber-400' : 'text-text-tertiary'}`}>{p.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.riskIndicators?.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-status-error">Risk Indicators</h3>
          <div className="space-y-2">
            {data.riskIndicators.map((r: any, i: number) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border border-status-error/20 bg-status-error/5 p-3">
                <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${r.severity === 'high' ? 'bg-status-error' : r.severity === 'medium' ? 'bg-status-warning' : 'bg-text-tertiary'}`} />
                <div>
                  <p className="text-sm font-medium text-text-primary">{r.factor}</p>
                  <p className="text-xs text-text-secondary">{r.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.followUpSuggestions?.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-text-primary">Follow-ups Needed</h3>
          <div className="space-y-2">
            {data.followUpSuggestions.map((f: any, i: number) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-surface-secondary p-3">
                <div>
                  <p className="text-sm font-medium text-text-primary">{f.clientName}</p>
                  <p className="text-xs text-text-secondary">{f.daysSinceSent} days since sent — {f.suggestedAction}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.improvements?.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-text-primary">Improvements</h3>
          <div className="space-y-1">
            {data.improvements.map((r: string, i: number) => (
              <p key={i} className="text-xs text-text-secondary">• {r}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PortfolioTab({ data, isLoading, error }: { data: any; isLoading: boolean; error: any }) {
  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState title="Error" message="Failed to load portfolio intelligence" />;
  if (!data) return <EmptyState title="No portfolio data available" icon={Image} />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Quality Score" value={`${data.portfolioQualityScore ?? 0}/100`} icon={Image} />
        <StatCard label="Items" value={data.itemCount ?? 0} icon={Image} />
        <StatCard label="Media Quality" value={data.mediaQuality ?? 'N/A'} icon={Image} />
      </div>

      <div className="h-2 rounded-full bg-border overflow-hidden">
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${data.portfolioQualityScore || 0}%` }} />
      </div>

      {data.coverageAreas?.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-text-primary">Coverage Areas</h3>
          <div className="flex flex-wrap gap-2">
            {data.coverageAreas.map((a: string, i: number) => (
              <span key={i} className="rounded-full border border-border bg-surface-secondary px-3 py-1 text-xs text-text-secondary">{a}</span>
            ))}
          </div>
        </div>
      )}

      {data.missingIndustries?.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-amber-400">Missing Industries</h3>
          <div className="flex flex-wrap gap-2">
            {data.missingIndustries.map((m: string, i: number) => (
              <span key={i} className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs text-amber-400">{m}</span>
            ))}
          </div>
        </div>
      )}

      {data.suggestions?.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-text-primary">Suggestions</h3>
          <div className="space-y-1">
            {data.suggestions.map((s: string, i: number) => (
              <p key={i} className="text-xs text-text-secondary">• {s}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ReputationTab({ data, isLoading, error }: { data: any; isLoading: boolean; error: any }) {
  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState title="Error" message="Failed to load reputation data" />;
  if (!data) return <EmptyState title="No reputation data available" icon={Shield} />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Trust Score" value={`${data.trustScore ?? 0}`} icon={Shield} />
        <StatCard label="Grade" value={data.trustGrade ?? 'N/A'} icon={Shield} />
        <StatCard label="Avg Rating" value={(data.averageRating ?? 0).toFixed(1)} icon={Shield} />
        <StatCard label="Reviews" value={data.reviewCount ?? 0} icon={Shield} />
        <StatCard label="Response Rate" value={`${data.responseRate ?? 0}%`} icon={Shield} />
        <StatCard label="Profile" value={`${data.profileCompleteness ?? 0}%`} icon={Shield} />
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-secondary p-3">
        <span className="text-sm text-text-secondary">Verification:</span>
        <span className={`text-sm font-medium ${data.verificationLevel === 'LEVEL_7' || data.verificationLevel === 'LEVEL_8' ? 'text-emerald-400' : data.verificationLevel === 'UNVERIFIED' ? 'text-status-error' : 'text-amber-400'}`}>
          {data.verificationLevel?.replace(/_/g, ' ') || 'UNVERIFIED'}
        </span>
        <span className="text-sm text-text-secondary">Risk:</span>
        <span className={`text-sm font-medium ${data.riskLevel === 'Low' ? 'text-emerald-400' : data.riskLevel === 'Moderate' ? 'text-amber-400' : 'text-status-error'}`}>
          {data.riskLevel || 'Unknown'}
        </span>
      </div>

      {data.breakdown?.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-text-primary">Score Breakdown</h3>
          <div className="space-y-2">
            {data.breakdown.map((b: any, i: number) => (
              <div key={i} className="rounded-lg border border-border bg-surface-secondary p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-text-primary">{b.category}</span>
                  <span className="text-sm font-medium text-text-primary">{b.score}/100</span>
                </div>
                <div className="h-1.5 rounded-full bg-border overflow-hidden">
                  <div className={`h-full rounded-full ${b.score >= 70 ? 'bg-emerald-400' : b.score >= 40 ? 'bg-amber-400' : 'bg-status-error'}`} style={{ width: `${b.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.improvementPlan?.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-text-primary">Improvement Plan</h3>
          <div className="space-y-2">
            {data.improvementPlan.map((p: any, i: number) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border border-border bg-surface-secondary p-3">
                <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${p.impact === 'high' ? 'bg-emerald-400' : p.impact === 'medium' ? 'bg-amber-400' : 'bg-text-tertiary'}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary">{p.area}: {p.action}</p>
                  <p className="text-xs text-text-secondary">{p.expectedOutcome}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RevenueTab({ data, isLoading, error }: { data: any; isLoading: boolean; error: any }) {
  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState title="Error" message="Failed to load revenue data" />;
  if (!data) return <EmptyState title="No revenue data available" icon={TrendingUp} />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Current Revenue" value={`₹${(data.currentRevenue ?? 0).toLocaleString()}`} icon={TrendingUp} />
        <StatCard label="Target" value={`₹${(data.revenueTarget ?? 0).toLocaleString()}`} icon={TrendingUp} />
        <StatCard label="Pipeline" value={`₹${(data.pipelineValue ?? 0).toLocaleString()}`} icon={TrendingUp} />
        <StatCard label="Forecast" value={`₹${(data.forecastedRevenue ?? 0).toLocaleString()}`} icon={TrendingUp} />
      </div>

      {data.monthlyTrend?.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-text-primary">Monthly Trend</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-text-secondary">
                  <th className="pb-2 font-medium">Month</th>
                  <th className="pb-2 font-medium">Revenue</th>
                  <th className="pb-2 font-medium">Bookings</th>
                </tr>
              </thead>
              <tbody>
                {data.monthlyTrend.map((m: any, i: number) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-2 text-text-primary">{m.month}</td>
                    <td className="py-2 text-text-primary">₹{m.revenue.toLocaleString()}</td>
                    <td className="py-2 text-text-primary">{m.bookings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data.conversionOpportunities?.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-text-primary">Conversion Opportunities</h3>
          <div className="space-y-2">
            {data.conversionOpportunities.map((o: any, i: number) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-surface-secondary p-3">
                <div>
                  <p className="text-sm font-medium text-text-primary">{o.clientName}</p>
                  <p className="text-xs text-text-secondary">Stage: {o.stage} · Probability: {o.probability}%</p>
                </div>
                <span className="text-sm font-medium text-text-primary">₹{o.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.goals?.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-text-primary">Goals</h3>
          <div className="space-y-2">
            {data.goals.map((g: any, i: number) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-surface-secondary p-3">
                <div>
                  <p className="text-sm font-medium text-text-primary">{g.category}</p>
                  <p className="text-xs text-text-secondary">Current: {g.current} · Target: {g.target}</p>
                </div>
                <span className={`text-xs font-medium ${g.priority === 'high' ? 'text-status-error' : g.priority === 'medium' ? 'text-amber-400' : 'text-text-tertiary'}`}>{g.priority}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.recommendations?.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-text-primary">Recommendations</h3>
          <div className="space-y-1">
            {data.recommendations.map((r: string, i: number) => (
              <p key={i} className="text-xs text-text-secondary">• {r}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
