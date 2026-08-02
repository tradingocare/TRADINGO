'use client';
import { useState } from 'react';
import { useExecutiveCopilot, useExecutiveKpi, useExecutiveRisks, useExecutiveOpportunities, useExecutiveAnalytics } from '@/hooks/use-executive-agent';

type TabKey = 'overview' | 'strategy' | 'risks' | 'growth' | 'ai' | 'agents' | 'marketplace' | 'reports';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'strategy', label: 'Strategy' },
  { key: 'risks', label: 'Risks' },
  { key: 'growth', label: 'Growth' },
  { key: 'ai', label: 'AI' },
  { key: 'agents', label: 'Agents' },
  { key: 'marketplace', label: 'Marketplace' },
  { key: 'reports', label: 'Reports' },
];

export default function FounderExecutivePage() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const { data: copilot, isLoading: copilotLoading } = useExecutiveCopilot();
  const { data: kpi, isLoading: kpiLoading } = useExecutiveKpi();
  const { data: risks } = useExecutiveRisks('30d');
  const { data: opportunities } = useExecutiveOpportunities();
  const { data: analytics } = useExecutiveAnalytics();

  const loading = copilotLoading || kpiLoading;

  return (
    <div className="min-h-screen bg-bg-base p-6">
      <div className="mb-6">
        <h1 className="page-title">Founder Executive Agent</h1>
        <p className="page-subtitle">Strategic Executive Intelligence — Super Admin Only</p>
      </div>

      <div className="mb-6 flex gap-1 border-b border-border overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={'shrink-0 px-4 py-2 text-sm font-medium transition-colors ' + (activeTab === t.key ? 'border-b-2 border-accent text-text-primary' : 'text-text-tertiary hover:text-text-secondary')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="size-8 animate-spin rounded-full border-2 border-border border-t-accent" /></div>
      ) : (
        <>
          {activeTab === 'overview' && <OverviewTab copilot={copilot} kpi={kpi} />}
          {activeTab === 'strategy' && <StrategyTab copilot={copilot} />}
          {activeTab === 'risks' && <RisksTab risks={risks} />}
          {activeTab === 'growth' && <GrowthTab opportunities={opportunities} />}
          {activeTab === 'ai' && <AiTab copilot={copilot} analytics={analytics} />}
          {activeTab === 'agents' && <AgentsTab copilot={copilot} analytics={analytics} />}
          {activeTab === 'marketplace' && <MarketplaceTab copilot={copilot} kpi={kpi} />}
          {activeTab === 'reports' && <ReportsTab analytics={analytics} />}
        </>
      )}
    </div>
  );
}

function OverviewTab({ copilot, kpi }: { copilot: any; kpi: any }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Orders" value={kpi?.orders ?? '-'} sub={'Today: ' + (copilot?.revenueSnapshot?.orders?.value ?? 0)} />
        <StatCard label="Total Users" value={kpi?.users ?? '-'} sub={'Growth: ' + (kpi?.growth?.userGrowth ?? 0) + '%'} />
        <StatCard label="Total Companies" value={kpi?.companies ?? '-'} sub={(kpi?.growth?.companyGrowth ?? 0) + '% growth'} />
        <StatCard label="Trust Score" value={kpi?.trustScore ?? '-'} sub={'Avg across ' + (kpi?.companies ?? 0) + ' companies'} />
      </div>

      {copilot?.revenueSnapshot && (
        <div className="surface-card-lg p-6">
          <h3 className="mb-4 font-semibold text-text-primary">Revenue Snapshot</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-border/50 bg-bg-elevated p-4">
              <div className="text-xs text-text-tertiary">GMV</div>
              <div className="mt-1 text-xl font-bold text-text-primary">${copilot.revenueSnapshot.gmv.value}</div>
              <div className={'text-xs ' + (copilot.revenueSnapshot.gmv.changeType === 'positive' ? 'text-status-success' : 'text-status-error')}>
                {copilot.revenueSnapshot.gvm?.change > 0 ? '+' : ''}{copilot.revenueSnapshot.gmv.change}%
              </div>
            </div>
            <div className="rounded-lg border border-border/50 bg-bg-elevated p-4">
              <div className="text-xs text-text-tertiary">Revenue</div>
              <div className="mt-1 text-xl font-bold text-text-primary">${copilot.revenueSnapshot.revenue.value}</div>
              <div className={'text-xs ' + (copilot.revenueSnapshot.revenue.changeType === 'positive' ? 'text-status-success' : 'text-status-error')}>
                {copilot.revenueSnapshot.revenue.change > 0 ? '+' : ''}{copilot.revenueSnapshot.revenue.change}%
              </div>
            </div>
            <div className="rounded-lg border border-border/50 bg-bg-elevated p-4">
              <div className="text-xs text-text-tertiary">Orders</div>
              <div className="mt-1 text-xl font-bold text-text-primary">{copilot.revenueSnapshot.orders.value}</div>
              <div className={'text-xs ' + (copilot.revenueSnapshot.orders.changeType === 'positive' ? 'text-status-success' : 'text-status-error')}>
                {copilot.revenueSnapshot.orders.change > 0 ? '+' : ''}{copilot.revenueSnapshot.orders.change}%
              </div>
            </div>
          </div>
        </div>
      )}

      {copilot?.marketplaceHealth && (
        <div className="surface-card-lg p-6">
          <h3 className="mb-4 font-semibold text-text-primary">Marketplace Health</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <MetricRow label="RFQs" value={copilot.marketplaceHealth.totalRFQs} />
            <MetricRow label="Avg Trust Score" value={copilot.marketplaceHealth.avgTrustScore} suffix="/100" />
            <MetricRow label="Verification Rate" value={Math.round(copilot.marketplaceHealth.verificationRate * 10)} suffix="%" />
            <MetricRow label="Quality Index" value={copilot.marketplaceHealth.sellerQualityIndex} suffix="/100" />
          </div>
        </div>
      )}
    </div>
  );
}

function StrategyTab({ copilot }: { copilot: any }) {
  return (
    <div className="space-y-6">
      <div className="surface-card-lg p-6">
        <h3 className="mb-4 font-semibold text-text-primary">Today&apos;s Executive Brief</h3>
        <div className="rounded-lg border border-border/50 bg-bg-elevated p-4">
          <p className="text-text-secondary">{copilot?.todayBrief ?? 'No brief available'}</p>
        </div>
      </div>

      <div className="surface-card-lg p-6">
        <h3 className="mb-4 font-semibold text-text-primary">Strategic Priorities</h3>
        {copilot?.strategicPriorities?.length > 0 ? (
          <div className="space-y-3">
            {copilot.strategicPriorities.map((p: any) => (
              <div key={p.rank} className="rounded-lg border border-border/50 bg-bg-elevated p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">{p.rank}</span>
                    <span className="font-medium text-text-primary">{p.title}</span>
                  </div>
                  <span className={'rounded px-2 py-0.5 text-xs ' + (p.riskLevel === 'high' ? 'bg-status-error/20 text-status-error' : p.riskLevel === 'medium' ? 'bg-status-warning/20 text-status-warning' : 'bg-status-success/20 text-status-success')}>
                    {p.riskLevel.toUpperCase()}
                  </span>
                </div>
                <p className="mt-2 text-sm text-text-tertiary">{p.description}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-text-tertiary">
                  <span>Impact: {p.impactArea}</span>
                  <span>Revenue: {p.revenueImpact}</span>
                  <span>ROI: {p.roi}</span>
                  <span>Timeframe: {p.timeframe}</span>
                </div>
                <p className="mt-2 text-sm text-accent">→ {p.recommendedAction}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-text-tertiary">No priorities identified</p>
        )}
      </div>

      {copilot?.quickDecisions?.length > 0 && (
        <div className="surface-card-lg p-6">
          <h3 className="mb-4 font-semibold text-text-primary">Quick Decisions</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {copilot.quickDecisions.map((qd: any) => (
              <div key={qd.id} className="rounded-lg border border-border/50 bg-bg-elevated p-4">
                <div className="text-sm font-medium text-text-primary">{qd.question}</div>
                <p className="mt-1 text-xs text-text-tertiary">{qd.context}</p>
                <div className="mt-2 space-y-1">
                  {qd.options.map((opt: any, i: number) => (
                    <div key={i} className={'rounded px-2 py-1 text-xs ' + (opt.recommended ? 'bg-accent/20 text-accent' : 'bg-bg-base text-text-tertiary')}>
                      {opt.label} — {opt.impact}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RisksTab({ risks }: { risks: any }) {
  return (
    <div className="space-y-6">
      <div className="surface-card-lg p-6">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-text-primary">
          Risk Engine
          {risks?.criticalCount > 0 && <span className="rounded bg-status-error/20 px-2 py-0.5 text-xs text-status-error">{risks.criticalCount} critical</span>}
        </h3>
        <div className="mb-4 flex items-center gap-2 text-sm text-text-tertiary">
          <span>Overall Health: </span>
          <span className="font-medium text-text-primary">{risks?.overallHealth ?? 'N/A'}</span>
          <span className="ml-2">Total: {risks?.totalRisks ?? 0} risks</span>
        </div>

        {risks?.risks?.length > 0 ? (
          <div className="space-y-3">
            {risks.risks.map((r: any, i: number) => (
              <div key={i} className="rounded-lg border border-border/50 bg-bg-elevated p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className={'rounded px-2 py-0.5 text-xs font-medium ' + (r.severity === 'critical' ? 'bg-status-error/20 text-status-error' : r.severity === 'high' ? 'bg-status-warning/20 text-status-warning' : 'bg-status-success/20 text-text-tertiary')}>
                      {r.severity.toUpperCase()}
                    </span>
                    <span className="ml-2 text-sm text-text-tertiary">{r.category}</span>
                  </div>
                  <span className={'text-xs ' + (r.trend === 'increasing' ? 'text-status-error' : 'text-text-tertiary')}>
                    {r.trend === 'increasing' ? '↑ Increasing' : '→ Stable'}
                  </span>
                </div>
                <h4 className="mt-2 font-medium text-text-primary">{r.title}</h4>
                <p className="text-sm text-text-tertiary">{r.description}</p>
                <div className="mt-2 flex flex-wrap gap-4 text-xs text-text-tertiary">
                  <span>Current: {r.currentValue}</span>
                  <span>Threshold: {r.threshold}</span>
                  <span>Affected: {r.affectedEntities} entities</span>
                </div>
                <p className="mt-2 text-sm text-accent">→ {r.recommendedAction}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-text-tertiary">No risks detected — platform operating normally</p>
        )}
      </div>
    </div>
  );
}

function GrowthTab({ opportunities }: { opportunities: any }) {
  return (
    <div className="space-y-6">
      <div className="surface-card-lg p-6">
        <h3 className="mb-4 font-semibold text-text-primary">Opportunity Engine</h3>
        {opportunities?.totalPotentialRevenue && (
          <p className="mb-4 text-sm text-text-tertiary">
            Total potential revenue: <span className="font-medium text-text-primary">${opportunities.totalPotentialRevenue}</span> across {opportunities.totalOpportunities} opportunities
          </p>
        )}

        {opportunities?.opportunities?.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {opportunities.opportunities.map((o: any, i: number) => (
              <div key={i} className="rounded-lg border border-border/50 bg-bg-elevated p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="rounded bg-accent/20 px-2 py-0.5 text-xs text-accent">{o.category}</span>
                  <span className={'rounded px-2 py-0.5 text-xs ' + (o.effort === 'low' ? 'bg-status-success/20 text-status-success' : o.effort === 'medium' ? 'bg-status-warning/20 text-status-warning' : 'bg-status-error/20 text-status-error')}>
                    {o.effort.toUpperCase()} effort
                  </span>
                </div>
                <h4 className="font-medium text-text-primary">{o.title}</h4>
                <p className="mt-1 text-sm text-text-tertiary">{o.description}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-text-tertiary">
                  {o.metrics?.map((m: any, j: number) => (
                    <span key={j} className="rounded bg-bg-base px-2 py-0.5">{m.label}: {m.value}</span>
                  ))}
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-text-tertiary">Confidence: {Math.round(o.confidence * 100)}%</span>
                  <span className="text-text-tertiary">{o.timeframe}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-text-tertiary">No opportunities identified</p>
        )}
      </div>
    </div>
  );
}

function AiTab({ copilot, analytics }: { copilot: any; analytics: any }) {
  return (
    <div className="space-y-6">
      {copilot?.aiPlatformHealth && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total AI Requests" value={copilot.aiPlatformHealth.totalRequests} />
          <StatCard label="Success Rate" value={copilot.aiPlatformHealth.successRate + '%'} />
          <StatCard label="Avg Latency" value={copilot.aiPlatformHealth.avgLatencyMs + 'ms'} />
          <StatCard label="Active Providers" value={copilot.aiPlatformHealth.activeProviders} />
        </div>
      )}

      {copilot?.aiPlatformHealth?.agentStatus?.length > 0 && (
        <div className="surface-card-lg p-6">
          <h3 className="mb-4 font-semibold text-text-primary">Agent Status</h3>
          <div className="space-y-2">
            {copilot.aiPlatformHealth.agentStatus.map((a: any) => (
              <div key={a.agentId} className="flex items-center justify-between rounded-lg border border-border/50 bg-bg-elevated px-4 py-2">
                <div>
                  <span className="text-sm font-medium capitalize text-text-primary">{a.name}</span>
                  <span className="ml-2 text-xs text-text-tertiary">({a.agentId})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={'size-2 rounded-full ' + (a.status === 'healthy' ? 'bg-status-success' : a.status === 'degraded' ? 'bg-status-warning' : 'bg-status-error')} />
                  <span className={'text-xs ' + (a.status === 'healthy' ? 'text-status-success' : a.status === 'degraded' ? 'text-status-warning' : 'text-status-error')}>
                    {a.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {analytics?.executiveActions?.length > 0 && (
        <div className="surface-card-lg p-6">
          <h3 className="mb-4 font-semibold text-text-primary">Executive Actions</h3>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-text-tertiary">
                <th className="pb-2 font-medium">Action</th>
                <th className="pb-2 font-medium">Count</th>
                <th className="pb-2 font-medium">Success Rate</th>
                <th className="pb-2 font-medium">Last Executed</th>
              </tr>
            </thead>
            <tbody>
              {analytics.executiveActions.map((a: any, i: number) => (
                <tr key={i} className="border-b border-border/50 text-text-secondary">
                  <td className="py-2">{a.action}</td>
                  <td className="py-2">{a.count}</td>
                  <td className="py-2">{Math.round(a.successRate * 100)}%</td>
                  <td className="py-2 text-xs">{new Date(a.lastExecuted).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AgentsTab({ copilot, analytics }: { copilot: any; analytics: any }) {
  return (
    <div className="space-y-6">
      <div className="surface-card-lg p-6">
        <h3 className="mb-4 font-semibold text-text-primary">TradeAI Agent Ecosystem</h3>
        {analytics?.agentImpact?.length > 0 ? (
          <div className="space-y-3">
            {analytics.agentImpact.map((a: any) => (
              <div key={a.agentId} className="rounded-lg border border-border/50 bg-bg-elevated p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium capitalize text-text-primary">{a.name}</span>
                    <span className="ml-2 text-xs text-text-tertiary">({a.agentId})</span>
                  </div>
                  <span className={'rounded px-2 py-0.5 text-xs ' + (a.successRate >= 0.9 ? 'bg-status-success/20 text-status-success' : 'bg-status-warning/20 text-status-warning')}>
                    {Math.round(a.successRate * 100)}% success
                  </span>
                </div>
                <div className="mt-2 flex gap-4 text-xs text-text-tertiary">
                  <span>Actions: {a.actionsExecuted}</span>
                  <span>Value: {a.businessValue}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-text-tertiary">No agent impact data available</p>
        )}
      </div>
    </div>
  );
}

function MarketplaceTab({ copilot, kpi }: { copilot: any; kpi: any }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="RFQs" value={kpi?.rfqs ?? '-'} />
        <StatCard label="Trust Score" value={kpi?.trustScore ?? '-'} sub="/100" />
      </div>

      {copilot?.marketplaceHealth && (
        <div className="surface-card-lg p-6">
          <h3 className="mb-4 font-semibold text-text-primary">Marketplace Health Details</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <MetricRow label="Total Sellers" value={copilot.marketplaceHealth.totalSellers} />
            <MetricRow label="Total Buyers" value={copilot.marketplaceHealth.totalBuyers} />
            <MetricRow label="Active Products" value={copilot.marketplaceHealth.activeProducts} />
            <MetricRow label="Conversion Rate" value={Math.round(copilot.marketplaceHealth.conversionRate * 100)} suffix="%" />
          </div>
        </div>
      )}

      {copilot?.quickDecisions && copilot.quickDecisions.length > 0 && (
        <div className="surface-card-lg p-6">
          <h3 className="mb-4 font-semibold text-text-primary">Actions Required</h3>
          {copilot.quickDecisions.map((qd: any) => (
            <div key={qd.id} className="mb-3 rounded-lg border border-border/50 bg-bg-elevated p-4">
              <p className="text-sm font-medium text-text-primary">{qd.question}</p>
              <p className="mt-1 text-xs text-text-tertiary">{qd.context}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReportsTab({ analytics }: { analytics: any }) {
  return (
    <div className="space-y-6">
      <div className="surface-card-lg p-6">
        <h3 className="mb-4 font-semibold text-text-primary">Business Growth</h3>
        {analytics?.businessGrowth?.length > 0 ? (
          <div className="space-y-3">
            {analytics.businessGrowth.map((b: any, i: number) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-border/50 bg-bg-elevated px-4 py-3">
                <span className="text-sm text-text-primary">{b.metric}</span>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-text-secondary">{b.current}</span>
                  <span className={'text-xs ' + (b.change > 0 ? 'text-status-success' : b.change < 0 ? 'text-status-error' : 'text-text-tertiary')}>
                    {b.change > 0 ? '+' : ''}{b.change}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-text-tertiary">No growth data</p>
        )}
      </div>

      {analytics?.recommendationsAccepted && (
        <div className="surface-card-lg p-6">
          <h3 className="mb-4 font-semibold text-text-primary">Recommendations Impact</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <MetricRow label="Total" value={analytics.recommendationsAccepted.total} />
            <MetricRow label="Accepted" value={analytics.recommendationsAccepted.accepted} />
            <MetricRow label="Acceptance Rate" value={Math.round(analytics.recommendationsAccepted.acceptanceRate * 100)} suffix="%" />
            <MetricRow label="Revenue Impact" value={analytics.recommendationsAccepted.revenueImpact} />
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="surface-card-lg p-4">
      <div className="text-xs text-text-tertiary">{label}</div>
      <div className="mt-1 text-2xl font-bold text-text-primary">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-text-tertiary">{sub}</div>}
    </div>
  );
}

function MetricRow({ label, value, suffix }: { label: string; value: string | number; suffix?: string }) {
  return (
    <div className="rounded-lg border border-border/50 bg-bg-elevated px-3 py-2">
      <div className="text-xs text-text-tertiary">{label}</div>
      <div className="text-lg font-semibold text-text-primary">{value}{suffix ?? ''}</div>
    </div>
  );
}
