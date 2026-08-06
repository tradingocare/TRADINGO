'use client';

import { useState } from 'react';
import {
  useProductAdvisor, useSalesAdvisor, useAdvertisingAdvisor,
  useTrustAdvisor, useGrowthPlanner, useAgentNotifications,
} from '@/hooks/use-seller-agent';
import {
  Package, TrendingUp, Megaphone, Shield, Target, Bell,
  ArrowUp, ArrowDown, Minus, AlertTriangle, Sparkles, Star,
  ArrowRight, CheckCircle, XCircle, AlertCircle,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import Link from 'next/link';

type Tab = 'product' | 'sales' | 'advertising' | 'trust' | 'growth' | 'notifications';

const TABS: { key: Tab; label: string; icon: React.ElementType; desc: string }[] = [
  { key: 'product', label: 'Product Advisor', icon: Package, desc: 'Quality, completeness, improvements' },
  { key: 'sales', label: 'Sales Advisor', icon: TrendingUp, desc: 'Revenue, conversion, trends' },
  { key: 'advertising', label: 'Advertising Advisor', icon: Megaphone, desc: 'Promotion opportunities' },
  { key: 'trust', label: 'Trust Advisor', icon: Shield, desc: 'TradTrust score & breakdown' },
  { key: 'growth', label: 'Growth Planner', icon: Target, desc: 'Goals & marketplace opps' },
  { key: 'notifications', label: 'AI Notifications', icon: Bell, desc: 'Digest & alerts' },
];

export default function SellerAgentPage() {
  const [activeTab, setActiveTab] = useState<Tab>('product');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">AI Seller Agent</h1>
          <p className="mt-1 text-sm text-text-secondary">Intelligent business assistant for your seller operations</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-text-tertiary">
          <Sparkles className="h-4 w-4 text-accent" />
          Powered by TradeAI
        </div>
      </div>

      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

      <div className="rounded-xl border border-border bg-surface p-6">
        {activeTab === 'product' && <ProductAdvisorTab />}
        {activeTab === 'sales' && <SalesAdvisorTab />}
        {activeTab === 'advertising' && <AdvertisingAdvisorTab />}
        {activeTab === 'trust' && <TrustAdvisorTab />}
        {activeTab === 'growth' && <GrowthPlannerTab />}
        {activeTab === 'notifications' && <NotificationsTab />}
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

function ChangeBadge({ value, type }: { value: number; type: string }) {
  if (value === 0) return <Minus className="h-3.5 w-3.5 text-text-tertiary" />;
  const isPositive = type === 'positive';
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${isPositive ? 'text-emerald-400' : 'text-status-error'}`}>
      {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {Math.abs(value)}%
    </span>
  );
}

function ProductAdvisorTab() {
  const { data, isLoading, error } = useProductAdvisor();

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState title="Error" message="Failed to load product advisor" />;
  if (!data) return <EmptyState title="No product data available" />;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Avg Quality Score" value={`${data.averageQualityScore}/100`} icon={Star} />
        <StatCard label="Trend" value={data.trend} icon={TrendingUp} trend={data.trend} />
        <StatCard label="Low Scoring" value={data.lowScoringProductCount} icon={XCircle} />
        <StatCard label="Duplicates" value={data.duplicateRiskCount} icon={AlertCircle} />
      </div>

      {data.missingFields.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-3">Missing Fields</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {data.missingFields.map((f, i) => (
              <div key={i} className="rounded-lg border border-border bg-surface-secondary p-3 flex items-center justify-between">
                <span className="text-sm text-text-secondary">{f.label}</span>
                <span className="text-sm font-semibold text-status-error">{f.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.topPicks.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-3">Top Picks</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {data.topPicks.map((p, i) => (
              <Link key={i} href={`/seller/products/${p.productId}/edit`} className="rounded-lg border border-border bg-surface-secondary p-4 hover:border-accent/30 transition-all group">
                <p className="text-sm font-medium text-text-primary truncate">{p.productName}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-text-tertiary">Commerce Score</span>
                  <span className="text-sm font-semibold text-emerald-400">{p.commerceScore}</span>
                  <ArrowRight className="h-3 w-3 text-text-tertiary ml-auto group-hover:text-accent transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {data.improvements.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-3">Improvements Needed</h3>
          <div className="space-y-2">
            {data.improvements.map((imp, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-surface-secondary p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary truncate">{imp.issue}</p>
                  <span className={`inline-block mt-0.5 text-[10px] font-medium uppercase px-1.5 py-0.5 rounded ${imp.impact === 'high' ? 'bg-status-error/15 text-status-error' : 'bg-status-warning/15 text-status-warning'}`}>{imp.impact}</span>
                </div>
                {imp.actionLabel && (
                  <button className="shrink-0 ml-3 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/20 transition-colors">{imp.actionLabel}</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SalesAdvisorTab() {
  const { data, isLoading, error } = useSalesAdvisor();

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState title="Error" message="Failed to load sales advisor" />;
  if (!data) return <EmptyState title="No sales data available" />;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard metric={data.revenue} />
        <MetricCard metric={data.conversionRate} />
        <MetricCard metric={data.winRate} />
        <StatCard label="Open Deals" value={data.openDeals} icon={Target} />
      </div>

      {data.topProducts.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-3">Top Products</h3>
          <div className="space-y-2">
            {data.topProducts.map((p, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-surface-secondary p-3">
                <span className="text-sm text-text-primary">{p.productName}</span>
                <div className="flex items-center gap-4 text-xs text-text-tertiary">
                  <span>{p.orderCount} orders</span>
                  <span className="font-medium text-text-primary">₹{p.revenue.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.recommendations.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-3">Recommendations</h3>
          <div className="space-y-2">
            {data.recommendations.map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                <Sparkles className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                <span>{r}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AdvertisingAdvisorTab() {
  const { data, isLoading, error } = useAdvertisingAdvisor();

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState title="Error" message="Failed to load advertising advisor" />;
  if (!data) return <EmptyState title="No advertising data available" />;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Active Campaigns" value={data.activeCampaignCount} icon={Megaphone} />
        <StatCard label="Total Ad Spend" value={`₹${data.totalAdSpend.toLocaleString()}`} icon={Package} />
        <StatCard label="Promotable Products" value={data.topProductsToPromote.length} icon={Star} />
      </div>

      {data.topProductsToPromote.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-3">Top Products to Promote</h3>
          <div className="space-y-2">
            {data.topProductsToPromote.map((p, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-surface-secondary p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary truncate">{p.productName}</p>
                  <span className="text-xs text-text-tertiary">Quality: {p.qualityScore} | CPC: ₹{p.estimatedCpc}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className={`rounded px-2 py-0.5 font-medium ${p.competitionLevel === 'low' ? 'bg-emerald-500/15 text-emerald-400' : p.competitionLevel === 'medium' ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/15 text-red-400'}`}>{p.competitionLevel}</span>
                  <span className="text-text-primary font-medium">₹{p.suggestedDailyBudget}/day</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.recommendations.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-text-primary mb-3">Recommendations</h3>
          {data.recommendations.map((r, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-text-secondary">
              <Sparkles className="h-4 w-4 text-accent mt-0.5 shrink-0" />
              <span>{r}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TrustAdvisorTab() {
  const { data, isLoading, error } = useTrustAdvisor();

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState title="Error" message="Failed to load trust advisor" />;
  if (!data) return <EmptyState title="No trust data available" />;

  const riskColor = data.riskLevel === 'Low' ? 'text-emerald-400' : data.riskLevel === 'Medium' ? 'text-amber-400' : 'text-status-error';

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="TradTrust Score" value={data.unifiedScore} icon={Shield} />
        <StatCard label="Grade" value={data.grade} icon={Star} />
        <StatCard label="Risk Level" value={data.riskLevel} icon={AlertTriangle} valueClass={riskColor} />
      </div>

      {data.breakdown.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-3">Score Breakdown</h3>
          <div className="space-y-3">
            {data.breakdown.map((f, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="w-40 text-sm text-text-secondary">{f.category}</span>
                <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
                  <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${f.score}%` }} />
                </div>
                <span className="w-16 text-right text-sm text-text-primary font-medium">{f.score}/100</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.improvements.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-3">Improvements</h3>
          <div className="space-y-2">
            {data.improvements.map((imp, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                <AlertCircle className="h-4 w-4 text-status-warning mt-0.5 shrink-0" />
                <span>{imp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function GrowthPlannerTab() {
  const { data, isLoading, error } = useGrowthPlanner();

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState title="Error" message="Failed to load growth planner" />;
  if (!data) return <EmptyState title="No growth data available" />;

  return (
    <div className="space-y-8">
      {data.suggestedGoals.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-3">Suggested Goals</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.suggestedGoals.map((g, i) => (
              <div key={i} className="rounded-lg border border-border bg-surface-secondary p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-text-primary">{g.category}</span>
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${g.priority === 'high' ? 'bg-status-error/15 text-status-error' : 'bg-status-warning/15 text-status-warning'}`}>{g.priority}</span>
                </div>
                <p className="mt-2 text-lg font-bold text-accent">{g.target}</p>
                <p className="mt-1 text-xs text-text-tertiary">{g.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.milestones.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-3">Progress Milestones</h3>
          <div className="space-y-3">
            {data.milestones.map((m, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="w-32 text-sm text-text-secondary">{m.label}</span>
                <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
                  <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${Math.min(m.progress, 100)}%` }} />
                </div>
                <span className="w-24 text-right text-sm text-text-primary">{m.progress}/{m.target}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.marketplaceOpportunities.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-3">Marketplace Opportunities</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {data.marketplaceOpportunities.map((op, i) => (
              <div key={i} className="rounded-lg border border-border bg-surface-secondary p-4">
                <p className="text-sm font-medium text-text-primary">{op.category}</p>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-emerald-400">{op.demandLevel} demand</span>
                  <span className="rounded bg-surface px-2 py-0.5 text-text-secondary">{op.competitionLevel} competition</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-accent">Score: {op.potentialScore}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationsTab() {
  const { data, isLoading, error } = useAgentNotifications();

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState title="Error" message="Failed to load AI notifications" />;
  if (!data) return <EmptyState title="No notifications available" />;

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-border bg-surface-secondary p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-accent mt-0.5" />
          <p className="text-sm text-text-primary">{data.dailyDigest}</p>
        </div>
      </div>

      {data.criticalAlerts.length > 0 && (
        <NotificationGroup title="Critical Alerts" icon={<AlertTriangle className="h-4 w-4 text-status-error" />}>
          {data.criticalAlerts.map((n, i) => (
            <NotificationCard key={i} item={n} />
          ))}
        </NotificationGroup>
      )}

      {data.milestones.length > 0 && (
        <NotificationGroup title="Milestones" icon={<CheckCircle className="h-4 w-4 text-emerald-400" />}>
          {data.milestones.map((n, i) => (
            <NotificationCard key={i} item={n} />
          ))}
        </NotificationGroup>
      )}

      {data.insights.length > 0 && (
        <NotificationGroup title="Insights" icon={<Sparkles className="h-4 w-4 text-accent" />}>
          {data.insights.map((n, i) => (
            <NotificationCard key={i} item={n} />
          ))}
        </NotificationGroup>
      )}

      {data.reminders.length > 0 && (
        <NotificationGroup title="Reminders" icon={<Bell className="h-4 w-4 text-amber-400" />}>
          {data.reminders.map((n, i) => (
            <NotificationCard key={i} item={n} />
          ))}
        </NotificationGroup>
      )}
    </div>
  );
}

function NotificationGroup({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-text-secondary uppercase tracking-wider">
        {icon}
        <span>{title}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function NotificationCard({ item }: { item: { title: string; body: string; priority: string; link?: string; createdAt: Date } }) {
  const priorityColors: Record<string, string> = {
    critical: 'border-status-error/30 bg-status-error/5',
    high: 'border-status-warning/30 bg-status-warning/5',
    medium: 'border-border',
    low: 'border-border bg-surface-secondary/50',
  };

  return (
    <div className={`rounded-lg border p-3 ${priorityColors[item.priority] || priorityColors.medium}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-text-primary">{item.title}</p>
          <p className="text-xs text-text-secondary mt-0.5">{item.body}</p>
        </div>
        {item.link && (
          <Link href={item.link} className="shrink-0 text-accent hover:text-accent/80">
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, valueClass, trend }: { label: string; value: string | number; icon: React.ElementType; valueClass?: string; trend?: string }) {
  const trendColor = trend === 'improving' ? 'text-emerald-400' : trend === 'declining' ? 'text-status-error' : 'text-text-primary';
  return (
    <div className="rounded-lg border border-border bg-surface-secondary p-4">
      <div className="flex items-center gap-2 text-xs text-text-tertiary mb-2">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <p className={`text-lg font-bold ${trend ? trendColor : valueClass || 'text-text-primary'}`}>{value}</p>
    </div>
  );
}

function MetricCard({ metric }: { metric: { label: string; value: number; change: number; changeType: string } }) {
  return (
    <div className="rounded-lg border border-border bg-surface-secondary p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-tertiary">{metric.label}</span>
        <ChangeBadge value={metric.change} type={metric.changeType} />
      </div>
      <p className="mt-1 text-lg font-bold text-text-primary">{metric.value.toLocaleString()}</p>
    </div>
  );
}
