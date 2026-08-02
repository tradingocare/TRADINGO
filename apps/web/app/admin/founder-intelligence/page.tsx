'use client';

import { useState } from 'react';
import {
  useUnifiedDashboard,
  useKpis, useKpiDetail,
  useAlertDefinitions, useAlertHistory, useAlertStats, useEvaluateAlerts,
  useAcknowledgeAlert, useResolveAlert,
  useCorrelations, useConsolidatedHealth,
} from '@/hooks/use-executive-intelligence';
import {
  LayoutDashboard, BarChart3, Bell, Share2, Activity, Radio,
  TrendingUp, TrendingDown, Minus, AlertTriangle,
  Target, DollarSign, Users, ShoppingCart, FileText, Shield,
  Brain, RefreshCw, Search,
  Eye, EyeOff,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { Button } from '@/components/ui/button';

type Tab = 'overview' | 'kpis' | 'alerts' | 'correlations' | 'health' | 'signals';

const TABS: { key: Tab; label: string; icon: React.ElementType; desc: string }[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard, desc: 'Unified platform dashboard' },
  { key: 'kpis', label: 'KPI Explorer', icon: BarChart3, desc: 'All platform KPIs' },
  { key: 'alerts', label: 'Alert Center', icon: Bell, desc: 'Alert definitions and history' },
  { key: 'correlations', label: 'Correlations', icon: Share2, desc: 'KPI correlation analysis' },
  { key: 'health', label: 'Health', icon: Activity, desc: 'Consolidated health index' },
  { key: 'signals', label: 'Signals', icon: Radio, desc: 'Combined intelligence view' },
];

export default function FounderIntelligencePage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Founder Intelligence</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Unified KPI catalog, alert engine, correlation analysis, and health consolidation
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-text-tertiary">
          <Brain className="h-4 w-4 text-accent" />
          Sprint 8 Intelligence Layer
        </div>
      </div>

      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

      <div className="rounded-xl border border-border bg-surface p-6">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'kpis' && <KpiExplorerTab />}
        {activeTab === 'alerts' && <AlertCenterTab />}
        {activeTab === 'correlations' && <CorrelationsTab />}
        {activeTab === 'health' && <HealthTab />}
        {activeTab === 'signals' && <SignalsTab />}
      </div>
    </div>
  );
}

function TabBar({ tabs, active, onChange }: { tabs: typeof TABS; active: string; onChange: (k: Tab) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-surface-secondary p-1">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = tab.key === active;
        return (
          <button key={tab.key} onClick={() => onChange(tab.key)} className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all ${isActive ? 'bg-accent text-btn-primary-text shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-surface'}`}>
            <Icon className="h-4 w-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-1/3 rounded bg-border" />
          <div className="h-3 w-full rounded bg-border" />
          <div className="h-3 w-2/3 rounded bg-border" />
        </div>
      ))}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, change, changeType }: { icon: React.ElementType; label: string; value: string | number; sub?: string; change?: string; changeType?: 'up' | 'down' | 'neutral' }) {
  return (
    <div className="rounded-lg border border-border bg-surface-secondary p-4">
      <div className="flex items-center gap-2 text-text-tertiary mb-1">
        <Icon className="h-4 w-4" />
        <span className="text-xs">{label}</span>
        {change && (
          <span className={`ml-auto flex items-center gap-1 text-xs ${changeType === 'up' ? 'text-green-400' : changeType === 'down' ? 'text-red-400' : 'text-text-tertiary'}`}>
            {changeType === 'up' ? <TrendingUp className="h-3 w-3" /> : changeType === 'down' ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
            {change}
          </span>
        )}
      </div>
      <p className="text-xl font-bold text-text-primary">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      {sub && <p className="text-xs text-text-tertiary mt-0.5">{sub}</p>}
    </div>
  );
}

function OverviewTab() {
  const { data, isLoading, error } = useUnifiedDashboard();

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState title="Failed to load unified dashboard" />;
  if (!data) return <EmptyState title="No dashboard data available" />;

  const { overview, health, finance } = data;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={DollarSign} label="Total Revenue" value={`₹${(overview.totalRevenue / 100).toLocaleString()}`} />
        <StatCard icon={TrendingUp} label="Revenue Growth" value={`${overview.revenueGrowth}%`} changeType={overview.revenueGrowth >= 0 ? 'up' : 'down'} change={`${overview.revenueGrowth >= 0 ? '+' : ''}${overview.revenueGrowth}%`} />
        <StatCard icon={ShoppingCart} label="Total Orders" value={overview.totalOrders} sub={`${overview.ordersToday} today`} />
        <StatCard icon={Users} label="Users / Companies" value={overview.totalUsers} sub={`${overview.totalCompanies} companies`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FileText} label="Active RFQs" value={overview.activeRfqs} />
        <StatCard icon={Shield} label="Verification Queue" value={overview.pendingVerifications} />
        <StatCard icon={AlertTriangle} label="Open Disputes" value={overview.openDisputes} />
        <StatCard icon={Activity} label="Health Score" value={`${health.overallScore}/100`} sub={`Grade: ${health.grade}`} />
      </div>

      <div className="rounded-lg border border-border bg-surface-secondary p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Health Dimensions</h3>
        {health.dimensions.map(d => (
          <div key={d.name} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
            <div className="flex-1 text-sm text-text-secondary">{d.name}</div>
            <div className="w-32 h-2 rounded-full bg-border overflow-hidden">
              <div className={`h-full rounded-full transition-all ${d.score >= 70 ? 'bg-green-500' : d.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${d.score}%` }} />
            </div>
            <span className={`text-xs font-medium ${d.score >= 70 ? 'text-green-400' : d.score >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>{d.score}</span>
          </div>
        ))}
      </div>

      {finance && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard icon={DollarSign} label="Escrow Balance" value={`₹${(finance.escrowBalance / 100).toLocaleString()}`} />
          <StatCard icon={Target} label="Pending Settlements" value={finance.pendingSettlements} />
          <StatCard icon={TrendingUp} label="Commission Earned" value={`₹${(finance.commissionEarned / 100).toLocaleString()}`} />
        </div>
      )}
    </div>
  );
}

function KpiExplorerTab() {
  const { data, isLoading, error } = useKpis();
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [selectedKpi, setSelectedKpi] = useState<string | null>(null);
  const { data: kpiDetail } = useKpiDetail(selectedKpi);

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState title="Failed to load KPI catalog" />;
  if (!data) return <EmptyState title="No KPI data available" />;

  const domains = Object.keys(data.byDomain);
  const filtered = data.kpis.filter(k => {
    if (domainFilter && k.domain !== domainFilter) return false;
    if (search && !k.name.toLowerCase().includes(search.toLowerCase()) && !k.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <input type="text" placeholder="Search KPIs..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-secondary pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent" />
        </div>
        <select value={domainFilter} onChange={e => setDomainFilter(e.target.value)}
          className="rounded-lg border border-border bg-surface-secondary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent">
          <option value="">All Domains</option>
          {domains.map(d => <option key={d} value={d}>{d} ({data.byDomain[d]})</option>)}
        </select>
        <span className="text-xs text-text-tertiary">{filtered.length} of {data.total} KPIs</span>
      </div>

      <div className="grid gap-2">
        {filtered.map(kpi => (
          <button key={kpi.id} onClick={() => setSelectedKpi(selectedKpi === kpi.id ? null : kpi.id)}
            className={`w-full text-left rounded-lg border p-3 transition-all ${selectedKpi === kpi.id ? 'border-accent bg-accent/5' : 'border-border bg-surface-secondary hover:border-accent/30'}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-text-primary">{kpi.name}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${kpi.status === 'healthy' ? 'bg-green-500/10 text-green-400' : kpi.status === 'warning' ? 'bg-yellow-500/10 text-yellow-400' : kpi.status === 'critical' ? 'bg-red-500/10 text-red-400' : 'bg-border text-text-tertiary'}`}>{kpi.status}</span>
                  <span className={`text-xs ${kpi.trend === 'up' ? 'text-green-400' : kpi.trend === 'down' ? 'text-red-400' : 'text-text-tertiary'}`}>
                    {kpi.trend === 'up' ? '↑' : kpi.trend === 'down' ? '↓' : '→'}
                  </span>
                </div>
                <p className="text-xs text-text-tertiary mt-0.5">{kpi.id} · {kpi.domain} · {kpi.source}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-text-primary">{kpi.currentValue?.toLocaleString() ?? '—'}</p>
                <p className="text-xs text-text-tertiary">{kpi.unit}</p>
                {kpi.changePercent !== null && (
                  <p className={`text-xs ${kpi.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {kpi.changePercent >= 0 ? '+' : ''}{kpi.changePercent}%
                  </p>
                )}
              </div>
            </div>
          </button>
        ))}
        {filtered.length === 0 && <EmptyState title="No KPIs match your filters" />}
      </div>

      {selectedKpi && kpiDetail && (
        <div className="rounded-lg border border-accent/30 bg-surface-secondary p-4 space-y-2">
          <h3 className="text-sm font-semibold text-text-primary">{kpiDetail.kpi.name}</h3>
          <p className="text-xs text-text-tertiary">{kpiDetail.kpi.description}</p>
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div><span className="text-xs text-text-tertiary">Current</span><p className="text-lg font-bold text-text-primary">{kpiDetail.kpi.currentValue?.toLocaleString() ?? '—'}</p></div>
            <div><span className="text-xs text-text-tertiary">Previous</span><p className="text-lg font-bold text-text-primary">{kpiDetail.kpi.previousValue?.toLocaleString() ?? '—'}</p></div>
            <div><span className="text-xs text-text-tertiary">Change</span><p className={`text-lg font-bold ${(kpiDetail.kpi.change ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>{kpiDetail.kpi.change !== null ? `${kpiDetail.kpi.change >= 0 ? '+' : ''}${kpiDetail.kpi.change}` : '—'}</p></div>
          </div>
        </div>
      )}
    </div>
  );
}

function AlertCenterTab() {
  const { data: defs, isLoading: defsLoading, error: defsError } = useAlertDefinitions();
  const { data: history, isLoading: histLoading } = useAlertHistory();
  const { data: stats, isLoading: statsLoading } = useAlertStats();
  const evaluateMutation = useEvaluateAlerts();
  const acknowledgeMutation = useAcknowledgeAlert();
  const resolveMutation = useResolveAlert();

  if (defsLoading || statsLoading) return <LoadingSkeleton />;
  if (defsError) return <ErrorState title="Failed to load alert definitions" />;

  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid gap-3 sm:grid-cols-5">
          <StatCard icon={Bell} label="Total Alerts" value={stats.totalAlerts} />
          <StatCard icon={Activity} label="Active" value={stats.activeAlerts} />
          <StatCard icon={AlertTriangle} label="Critical" value={stats.criticalCount} changeType="down" />
          <StatCard icon={Shield} label="Warning" value={stats.warningCount} />
          <StatCard icon={Target} label="Definitions" value={stats.definitionsCount} />
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">Alert Definitions</h3>
        <Button variant="accent" size="sm" onClick={() => evaluateMutation.mutate()} disabled={evaluateMutation.isPending}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${evaluateMutation.isPending ? 'animate-spin' : ''}`} />
          Evaluate All
        </Button>
      </div>

      {defs && defs.length > 0 ? (
        <div className="space-y-2">
          {defs.map(def => (
            <div key={def.id} className="flex items-center justify-between rounded-lg border border-border bg-surface-secondary p-3">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${def.enabled ? 'bg-green-500' : 'bg-text-tertiary'}`} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary">{def.name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${def.severity === 'critical' ? 'bg-red-500/10 text-red-400' : def.severity === 'warning' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-blue-500/10 text-blue-400'}`}>{def.severity}</span>
                  </div>
                  <p className="text-xs text-text-tertiary mt-0.5">{def.kpiId} {def.condition.operator} {def.condition.value} · cooldown {def.cooldownSeconds}s</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {def.enabled ? <Eye className="h-4 w-4 text-green-400" /> : <EyeOff className="h-4 w-4 text-text-tertiary" />}
              </div>
            </div>
          ))}
        </div>
      ) : <EmptyState title="No alert definitions" description="Create alert definitions to start monitoring" />}

      <h3 className="text-sm font-semibold text-text-primary pt-2">Alert History</h3>
      {histLoading ? <LoadingSkeleton /> : history && history.length > 0 ? (
        <div className="space-y-2">
          {history.slice(0, 20).map(event => (
            <div key={event.id} className="flex items-center justify-between rounded-lg border border-border bg-surface-secondary p-3">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${event.severity === 'critical' ? 'bg-red-500' : event.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'}`} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary">{event.alertName}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${event.severity === 'critical' ? 'bg-red-500/10 text-red-400' : event.severity === 'warning' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-blue-500/10 text-blue-400'}`}>{event.severity}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${event.status === 'fired' ? 'bg-orange-500/10 text-orange-400' : event.status === 'acknowledged' ? 'bg-blue-500/10 text-blue-400' : 'bg-green-500/10 text-green-400'}`}>{event.status}</span>
                  </div>
                  <p className="text-xs text-text-tertiary mt-0.5">{event.message} · {new Date(event.firedAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {event.status === 'fired' && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => acknowledgeMutation.mutate(event.id)} disabled={acknowledgeMutation.isPending}>Ack</Button>
                    <Button variant="outline" size="sm" onClick={() => resolveMutation.mutate(event.id)} disabled={resolveMutation.isPending}>Resolve</Button>
                  </>
                )}
                {event.status === 'acknowledged' && (
                  <Button variant="outline" size="sm" onClick={() => resolveMutation.mutate(event.id)} disabled={resolveMutation.isPending}>Resolve</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : <EmptyState title="No alert history" description="Alerts will appear here when triggered" />}
    </div>
  );
}

function CorrelationsTab() {
  const { data, isLoading, error } = useCorrelations();
  const [strengthFilter, setStrengthFilter] = useState('');

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState title="Failed to load correlations" />;
  if (!data) return <EmptyState title="No correlation data available" />;

  const filtered = strengthFilter ? data.correlations.filter(c => c.strength === strengthFilter) : data.correlations;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select value={strengthFilter} onChange={e => setStrengthFilter(e.target.value)}
          className="rounded-lg border border-border bg-surface-secondary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent">
          <option value="">All Strengths</option>
          <option value="strong">Strong (r≥0.7)</option>
          <option value="moderate">Moderate (r≥0.4)</option>
          <option value="weak">Weak (r≥0.1)</option>
          <option value="none">None</option>
        </select>
        <span className="text-xs text-text-tertiary">{filtered.length} of {data.total} correlations</span>
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.slice(0, 50).map((c, i) => (
            <div key={`${c.kpi1}-${c.kpi2}`} className="flex items-center justify-between rounded-lg border border-border bg-surface-secondary p-3">
              <div className="flex items-center gap-3 flex-1">
                <span className="text-xs text-text-tertiary w-6">#{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary">{c.kpi1Name}</span>
                    <span className={`text-xs font-bold ${c.direction === 'positive' ? 'text-green-400' : c.direction === 'negative' ? 'text-red-400' : 'text-text-tertiary'}`}>
                      {c.direction === 'positive' ? '↔' : c.direction === 'negative' ? '↔' : '—'}
                    </span>
                    <span className="text-sm font-medium text-text-primary">{c.kpi2Name}</span>
                  </div>
                  <p className="text-xs text-text-tertiary mt-0.5">{c.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded text-xs font-medium ${c.strength === 'strong' ? 'bg-green-500/10 text-green-400' : c.strength === 'moderate' ? 'bg-yellow-500/10 text-yellow-400' : c.strength === 'weak' ? 'bg-blue-500/10 text-blue-400' : 'bg-border text-text-tertiary'}`}>{c.strength}</span>
                <span className="text-sm font-bold text-text-primary">{c.correlationCoefficient.toFixed(2)}</span>
                <span className="text-xs text-text-tertiary">lag: {c.lag}</span>
              </div>
            </div>
          ))}
        </div>
      ) : <EmptyState title="No correlations match your filter" />}
    </div>
  );
}

function HealthTab() {
  const { data, isLoading, error } = useConsolidatedHealth();

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState title="Failed to load consolidated health" />;
  if (!data) return <EmptyState title="No health data available" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className={`flex items-center justify-center w-24 h-24 rounded-full border-4 ${data.overallScore >= 60 ? 'border-green-500' : data.overallScore >= 30 ? 'border-yellow-500' : 'border-red-500'}`}>
          <div className="text-center">
            <p className="text-2xl font-bold text-text-primary">{data.overallScore}</p>
            <p className="text-xs text-text-tertiary">{data.grade}</p>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-text-primary">Consolidated Health Index</h3>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${data.status === 'healthy' ? 'bg-green-500/10 text-green-400' : data.status === 'degraded' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'}`}>{data.status}</span>
          </div>
          <p className="text-sm text-text-tertiary">Period: {data.period} · Weights: FounderAI {Math.round(data.weights.founderAi * 100)}% / Enterprise {Math.round(data.weights.enterprise * 100)}% / Marketplace {Math.round(data.weights.marketplace * 100)}%</p>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-text-primary">Consolidated Dimensions</h3>
        {data.dimensions.map(d => (
          <div key={d.name} className="flex items-center gap-3 rounded-lg border border-border bg-surface-secondary p-3">
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-primary">{d.name}</span>
                <span className={`text-xs font-medium ${d.consolidatedScore >= 70 ? 'text-green-400' : d.consolidatedScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>{d.consolidatedScore}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-border mt-1.5 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${d.consolidatedScore >= 70 ? 'bg-green-500' : d.consolidatedScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${d.consolidatedScore}%` }} />
              </div>
              <div className="flex gap-3 mt-1">
                {d.founderAiScore !== null && <span className="text-[10px] text-text-tertiary">FounderAI: {d.founderAiScore}</span>}
                {d.enterpriseScore !== null && <span className="text-[10px] text-text-tertiary">Enterprise: {d.enterpriseScore}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {data.recommendations.length > 0 && (
        <div className="rounded-lg border border-border bg-surface-secondary p-4 space-y-2">
          <h3 className="text-sm font-semibold text-text-primary">Recommendations</h3>
          {data.recommendations.map((r, i) => (
            <div key={i} className="flex items-start gap-2">
              <Brain className="h-4 w-4 text-accent mt-0.5 shrink-0" />
              <p className="text-sm text-text-secondary">{r}</p>
            </div>
          ))}
        </div>
      )}

      {data.sources.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.sources.map(s => (
            <div key={s.source} className="rounded-lg border border-border bg-surface-secondary p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-text-primary">{s.source}</span>
                <span className="text-lg font-bold text-text-primary">{s.overallScore ?? '—'}</span>
              </div>
              {s.dimensions.map(d => (
                <div key={d.name} className="flex items-center justify-between py-1">
                  <span className="text-xs text-text-tertiary">{d.name}</span>
                  <span className="text-xs text-text-primary">{d.score}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SignalsTab() {
  const { data: dashboard } = useUnifiedDashboard();
  const { data: health } = useConsolidatedHealth();
  const { data: stats } = useAlertStats();
  const { data: correlations } = useCorrelations({ limit: 5 });

  if (!dashboard && !health && !stats && !correlations) return <LoadingSkeleton />;

  const topAlerts = stats?.mostFrequent ?? [];
  const topCorrelations = correlations?.correlations ?? [];
  const healthScore = dashboard?.health.overallScore ?? health?.overallScore ?? null;
  const healthGrade = dashboard?.health.grade ?? health?.grade ?? 'N/A';
  const dims: { name: string; score: number }[] = (dashboard?.health.dimensions ?? health?.dimensions ?? []).map((d: any) => ({
    name: d.name,
    score: d.score ?? d.consolidatedScore ?? d.overallScore ?? 0,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface-secondary p-4">
          <div className="flex items-center gap-2 text-text-tertiary mb-2">
            <Activity className="h-4 w-4" />
            <span className="text-xs font-medium">Health Status</span>
          </div>
          {healthScore !== null ? (
            <>
              <p className="text-2xl font-bold text-text-primary">{healthScore}<span className="text-sm text-text-tertiary font-normal">/100</span></p>
              <p className="text-xs text-text-tertiary mt-1">Grade: {healthGrade}</p>
            </>
          ) : <p className="text-sm text-text-tertiary">No data</p>}
        </div>
        <div className="rounded-lg border border-border bg-surface-secondary p-4">
          <div className="flex items-center gap-2 text-text-tertiary mb-2">
            <Bell className="h-4 w-4" />
            <span className="text-xs font-medium">Alert Activity</span>
          </div>
          {stats ? (
            <>
              <p className="text-2xl font-bold text-text-primary">{stats.totalAlerts}<span className="text-sm text-text-tertiary font-normal"> total</span></p>
              <p className="text-xs text-text-tertiary mt-1">{stats.activeAlerts} active · {stats.criticalCount} critical</p>
            </>
          ) : <p className="text-sm text-text-tertiary">No data</p>}
        </div>
        <div className="rounded-lg border border-border bg-surface-secondary p-4">
          <div className="flex items-center gap-2 text-text-tertiary mb-2">
            <Share2 className="h-4 w-4" />
            <span className="text-xs font-medium">Correlations</span>
          </div>
          {correlations ? (
            <>
              <p className="text-2xl font-bold text-text-primary">{correlations.total}<span className="text-sm text-text-tertiary font-normal"> pairs</span></p>
              <p className="text-xs text-text-tertiary mt-1">Top: {topCorrelations.slice(0, 1).map(c => `${c.kpi1Name} ↔ ${c.kpi2Name}`).join(', ') || 'N/A'}</p>
            </>
          ) : <p className="text-sm text-text-tertiary">No data</p>}
        </div>
      </div>

      {dims.length > 0 && (
        <div className="rounded-lg border border-border bg-surface-secondary p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Health Dimensions</h3>
          {dims.map(d => (
            <div key={d.name} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
              <div className="flex-1 text-sm text-text-secondary">{d.name}</div>
              <div className="w-32 h-2 rounded-full bg-border overflow-hidden">
                <div className={`h-full rounded-full ${(d.score ?? 0) >= 70 ? 'bg-green-500' : (d.score ?? 0) >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${d.score ?? 0}%` }} />
              </div>
              <span className={`text-xs font-medium ${(d.score ?? 0) >= 70 ? 'text-green-400' : (d.score ?? 0) >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>{d.score ?? '—'}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {topAlerts.length > 0 && (
          <div className="rounded-lg border border-border bg-surface-secondary p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Most Frequent Alerts</h3>
            {topAlerts.map(a => (
              <div key={a.alertId} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm text-text-secondary">{a.alertName}</span>
                <span className="text-sm font-bold text-text-primary">{a.count}</span>
              </div>
            ))}
          </div>
        )}
        {topCorrelations.length > 0 && (
          <div className="rounded-lg border border-border bg-surface-secondary p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Top Correlations</h3>
            {topCorrelations.map(c => (
              <div key={`${c.kpi1}-${c.kpi2}`} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex-1">
                  <p className="text-sm text-text-secondary truncate">{c.kpi1Name} ↔ {c.kpi2Name}</p>
                </div>
                <span className={`text-xs font-medium ml-2 ${c.strength === 'strong' ? 'text-green-400' : c.strength === 'moderate' ? 'text-yellow-400' : 'text-text-tertiary'}`}>{c.correlationCoefficient.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {!dashboard && !health && !stats && !correlations && (
        <EmptyState title="No signals available" description="Connect data sources to see platform signals" />
      )}
    </div>
  );
}
