'use client';

import { useState } from 'react';
import {
  useAdminSystemHealth, useAdminUserActivity, useAdminFraudIntelligence,
  useAdminRevenueAnalytics, useAdminModerationQueue, useAdminPlatformGrowth,
  useAdminPerformanceMetrics, useAdminDailyBrief,
} from '@/hooks/use-admin-agent';
import {
  Activity, Users, AlertTriangle, DollarSign, Shield, TrendingUp,
  Server, Clock, Sparkles, Package, ShoppingCart, FileText,
  Zap, ArrowRight, CheckCircle, XCircle,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import Link from 'next/link';

type Tab = 'system' | 'users' | 'fraud' | 'revenue' | 'moderation' | 'growth';

const TABS: { key: Tab; label: string; icon: React.ElementType; desc: string }[] = [
  { key: 'system', label: 'System Health', icon: Activity, desc: 'Services, queues, SLA' },
  { key: 'users', label: 'User Activity', icon: Users, desc: 'Registrations, churn, top users' },
  { key: 'fraud', label: 'Fraud Intelligence', icon: Shield, desc: 'Risks, anomalies, alerts' },
  { key: 'revenue', label: 'Revenue Analytics', icon: DollarSign, desc: 'GMV, growth, breakdown' },
  { key: 'moderation', label: 'Moderation Queue', icon: AlertTriangle, desc: 'Reviews, flags, reports' },
  { key: 'growth', label: 'Platform Growth', icon: TrendingUp, desc: 'Sellers, buyers, volume' },
];

export default function AdminAgentPage() {
  const [activeTab, setActiveTab] = useState<Tab>('system');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">AI Admin Agent</h1>
          <p className="mt-1 text-sm text-text-secondary">Platform intelligence, monitoring, and operations</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-text-tertiary">
          <Sparkles className="h-4 w-4 text-accent" />
          Powered by TradeAI
        </div>
      </div>

      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

      <div className="rounded-xl border border-border bg-surface p-6">
        {activeTab === 'system' && <SystemHealthTab />}
        {activeTab === 'users' && <UserActivityTab />}
        {activeTab === 'fraud' && <FraudIntelligenceTab />}
        {activeTab === 'revenue' && <RevenueAnalyticsTab />}
        {activeTab === 'moderation' && <ModerationQueueTab />}
        {activeTab === 'growth' && <PlatformGrowthTab />}
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

function StatCard({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-secondary p-4">
      <div className="flex items-center gap-2 text-text-tertiary mb-1">
        <Icon className="h-4 w-4" />
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-xl font-bold text-text-primary">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      {sub && <p className="text-xs text-text-tertiary mt-0.5">{sub}</p>}
    </div>
  );
}

function SystemHealthTab() {
  const { data, isLoading, error } = useAdminSystemHealth();

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState title="Error" message="Failed to load system health" />;
  if (!data) return <EmptyState title="No system health data" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${data.overall === 'healthy' ? 'bg-emerald-500/15 text-emerald-400' : data.overall === 'degraded' ? 'bg-amber-500/15 text-amber-400' : 'bg-status-error/15 text-status-error'}`}>
          {data.overall === 'healthy' ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
          {data.overall.toUpperCase()}
        </span>
        <span className="text-xs text-text-tertiary">Platform Status</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Server} label="Queue Depth" value={data.queueDepth} />
        <StatCard icon={Activity} label="Active Workers" value={data.activeWorkers} />
        <StatCard icon={AlertTriangle} label="Open Circuit Breakers" value={data.openCircuitBreakers} />
        <StatCard icon={Clock} label="SLA Breaches (24h)" value={data.slaBreaches24h} />
      </div>

      <div>
        <h3 className="text-sm font-medium text-text-primary mb-3">Services</h3>
        <div className="space-y-2">
          {data.services.map((s, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-surface-secondary p-3">
              <div className="flex items-center gap-3">
                <span className={`h-2.5 w-2.5 rounded-full ${s.status === 'healthy' ? 'bg-emerald-400' : s.status === 'degraded' ? 'bg-amber-400' : 'bg-status-error'}`} />
                <span className="text-sm font-medium text-text-primary">{s.service}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-text-tertiary">
                <span>{(s.uptime).toFixed(1)}% uptime</span>
                <span>{s.errorRate}% err</span>
                <span>{s.avgResponseMs}ms</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UserActivityTab() {
  const { data, isLoading, error } = useAdminUserActivity();

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState title="Error" message="Failed to load user activity" />;
  if (!data) return <EmptyState title="No user activity data" />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Users" value={data.totalUsers} />
        <StatCard icon={Users} label="New Today" value={data.newToday} />
        <StatCard icon={Activity} label="Active Today" value={data.activeToday} />
        <StatCard icon={AlertTriangle} label="Churn Risk" value={data.churnRisk} />
      </div>

      {data.byRole.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-3">Users by Role</h3>
          <div className="space-y-2">
            {data.byRole.map((r, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-24 text-sm text-text-secondary">{r.role}</span>
                <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, (r.count / Math.max(...data.byRole.map(x => x.count))) * 100)}%` }} />
                </div>
                <span className="text-sm text-text-primary font-medium">{r.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-medium text-text-primary mb-3">Top Users</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text-tertiary text-xs uppercase">
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Role</th>
                <th className="px-3 py-2 text-right">Activity Score</th>
              </tr>
            </thead>
            <tbody>
              {data.topUsers.map((u, i) => (
                <tr key={i} className="border-b border-border/50 text-text-primary">
                  <td className="px-3 py-2">{u.name}</td>
                  <td className="px-3 py-2 text-text-tertiary">{u.email}</td>
                  <td className="px-3 py-2">
                    <span className="rounded bg-surface-secondary px-2 py-0.5 text-xs">{u.role}</span>
                  </td>
                  <td className="px-3 py-2 text-right">{u.activityScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FraudIntelligenceTab() {
  const { data, isLoading, error } = useAdminFraudIntelligence();

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState title="Error" message="Failed to load fraud intelligence" />;
  if (!data) return <EmptyState title="No fraud intelligence data" />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={AlertTriangle} label="Flagged Entities" value={data.flaggedEntities} />
        <StatCard icon={Shield} label="Wallet Anomalies" value={data.walletAnomalies} />
        <StatCard icon={Users} label="High Velocity Users" value={data.highVelocityUsers} />
        <StatCard icon={Shield} label="Verification Issues" value={data.verificationIssues} />
      </div>

      {data.riskDistribution.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-3">Risk Distribution</h3>
          <div className="space-y-2">
            {data.riskDistribution.map((r, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className={`w-16 rounded px-2 py-0.5 text-xs font-medium ${r.level === 'high' ? 'bg-status-error/15 text-status-error' : r.level === 'medium' ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400'}`}>{r.level}</span>
                <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
                  <div className={`h-full rounded-full ${r.level === 'high' ? 'bg-status-error' : r.level === 'medium' ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${(r.count / Math.max(...data.riskDistribution.map(x => x.count))) * 100}%` }} />
                </div>
                <span className="text-sm text-text-primary">{r.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.recentAlerts.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-3">Recent Alerts</h3>
          <div className="space-y-2">
            {data.recentAlerts.map((a, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg border border-border bg-surface-secondary p-3">
                <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${a.priority === 'critical' || a.priority === 'high' ? 'text-status-error' : 'text-amber-400'}`} />
                <div>
                  <p className="text-sm font-medium text-text-primary">{a.title}</p>
                  <p className="text-xs text-text-tertiary">{a.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RevenueAnalyticsTab() {
  const { data, isLoading, error } = useAdminRevenueAnalytics();

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState title="Error" message="Failed to load revenue analytics" />;
  if (!data) return <EmptyState title="No revenue analytics data" />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={DollarSign} label="GMV" value={`₹${(data.gmv / 100000).toFixed(1)}L`} />
        <StatCard icon={TrendingUp} label="Revenue (This Month)" value={`₹${(data.revenue / 100000).toFixed(1)}L`} sub={data.growth >= 0 ? `+${data.growth}% growth` : `${data.growth}% decline`} />
        <StatCard icon={ShoppingCart} label="Membership Revenue" value={`₹${(data.membership.totalRevenue / 100000).toFixed(1)}L`} sub={`${data.membership.subscribers} subscribers`} />
        <StatCard icon={Zap} label="AI Credits Revenue" value={`₹${(data.aiCredits.totalRevenue / 100000).toFixed(1)}L`} sub={`${data.aiCredits.totalUsed} credits used`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface-secondary p-4">
          <p className="text-xs text-text-tertiary mb-3">Seller Growth</p>
          <p className="text-lg font-bold text-text-primary">{data.sellerGrowth.total} total</p>
          <p className="text-xs text-text-tertiary">{data.sellerGrowth.newThisMonth} new this month</p>
        </div>
        <div className="rounded-lg border border-border bg-surface-secondary p-4">
          <p className="text-xs text-text-tertiary mb-3">Buyer Growth</p>
          <p className="text-lg font-bold text-text-primary">{data.buyerGrowth.total} total</p>
          <p className="text-xs text-text-tertiary">{data.buyerGrowth.newThisMonth} new this month</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface-secondary p-4">
          <p className="text-xs text-text-tertiary mb-3">Advertising</p>
          <p className="text-lg font-bold text-text-primary">₹{(data.advertising.totalSpend / 1000).toFixed(1)}K</p>
          <p className="text-xs text-text-tertiary">{data.advertising.activeCampaigns} active campaigns</p>
        </div>
        {data.categoryGrowth.length > 0 && (
          <div className="rounded-lg border border-border bg-surface-secondary p-4">
            <p className="text-xs text-text-tertiary mb-3">Category Growth</p>
            <div className="space-y-2">
              {data.categoryGrowth.slice(0, 5).map((c, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-text-secondary">{c.category}</span>
                  <span className={c.growth >= 0 ? 'text-emerald-400' : 'text-status-error'}>{c.growth >= 0 ? '+' : ''}{c.growth}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ModerationQueueTab() {
  const { data, isLoading, error } = useAdminModerationQueue();

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState title="Error" message="Failed to load moderation queue" />;
  if (!data) return <EmptyState title="No moderation data" />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={Shield} label="Pending Reviews" value={data.pendingReviews} />
        <StatCard icon={AlertTriangle} label="Flagged Content" value={data.flaggedContent} />
        <StatCard icon={FileText} label="Reports" value={data.reports} />
        <StatCard icon={Users} label="Community Reports" value={data.communityReports} />
        <StatCard icon={Package} label="Product Reports" value={data.productReports} />
      </div>

      {data.topFlags.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-3">Top Flag Types</h3>
          <div className="space-y-2">
            {data.topFlags.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-40 text-sm text-text-secondary">{f.type}</span>
                <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
                  <div className="h-full rounded-full bg-amber-400" style={{ width: `${(f.count / Math.max(...data.topFlags.map(x => x.count))) * 100}%` }} />
                </div>
                <span className="text-sm text-text-primary font-medium">{f.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Link href="/admin/verification" className="rounded-lg bg-accent/10 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/20 transition-colors">
          Review Verification Queue
        </Link>
        <Link href="/admin/disputes" className="rounded-lg bg-surface-secondary px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary border border-border transition-colors">
          View Disputes
        </Link>
      </div>
    </div>
  );
}

function PlatformGrowthTab() {
  const { data, isLoading, error } = useAdminPlatformGrowth();

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState title="Error" message="Failed to load platform growth data" />;
  if (!data) return <EmptyState title="No platform growth data" />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Sellers" value={data.sellers.total} sub={`${data.sellers.newThisMonth} new · ${data.sellers.active} active`} />
        <StatCard icon={Users} label="Buyers" value={data.buyers.total} sub={`${data.buyers.newThisMonth} new · ${data.buyers.active} active`} />
        <StatCard icon={Package} label="Products" value={data.products.total} sub={`${data.products.active} active · ${data.products.newThisMonth} new`} />
        <StatCard icon={ShoppingCart} label="Trade Volume" value={`₹${(data.tradeVolume.totalValue / 100000).toFixed(1)}L`} sub={`${data.tradeVolume.totalOrders} orders`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface-secondary p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-text-primary mb-3">
            <TrendingUp className="h-4 w-4 text-accent" />
            Seller Growth
          </div>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <p className="text-xs text-text-tertiary">Total</p>
              <p className="text-xl font-bold text-text-primary">{data.sellers.total}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-text-tertiary" />
            <div className="text-center">
              <p className="text-xs text-text-tertiary">New This Month</p>
              <p className="text-xl font-bold text-accent">{data.sellers.newThisMonth}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-text-tertiary" />
            <div className="text-center">
              <p className="text-xs text-text-tertiary">Active</p>
              <p className="text-xl font-bold text-emerald-400">{data.sellers.active}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-surface-secondary p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-text-primary mb-3">
            <TrendingUp className="h-4 w-4 text-accent" />
            Buyer Growth
          </div>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <p className="text-xs text-text-tertiary">Total</p>
              <p className="text-xl font-bold text-text-primary">{data.buyers.total}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-text-tertiary" />
            <div className="text-center">
              <p className="text-xs text-text-tertiary">New This Month</p>
              <p className="text-xl font-bold text-accent">{data.buyers.newThisMonth}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-text-tertiary" />
            <div className="text-center">
              <p className="text-xs text-text-tertiary">Active</p>
              <p className="text-xl font-bold text-emerald-400">{data.buyers.active}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface-secondary p-4">
        <p className="text-xs text-text-tertiary mb-3">RFQ Activity</p>
        <div className="flex items-center gap-6">
          <div>
            <p className="text-xs text-text-tertiary">Total RFQs</p>
            <p className="text-xl font-bold text-text-primary">{data.rfqs.total}</p>
          </div>
          <div>
            <p className="text-xs text-text-tertiary">This Month</p>
            <p className="text-xl font-bold text-accent">{data.rfqs.thisMonth}</p>
          </div>
          <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
            <div className="h-full rounded-full bg-accent" style={{ width: `${data.rfqs.total > 0 ? (data.rfqs.thisMonth / data.rfqs.total) * 100 : 0}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
