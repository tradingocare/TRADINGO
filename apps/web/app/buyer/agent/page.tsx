'use client';

import { useState } from 'react';
import {
  useSmartProcurement, useBuyerRfqAssistant, useSupplierIntelligence,
  useBuyerNegotiationAdvisor, useCostOptimization, useBuyerAgentNotifications,
} from '@/hooks/use-buyer-agent';
import {
  TrendingUp, FileText, Store, Handshake, DollarSign, Bell,
  AlertTriangle, Sparkles, Star, Shield, ArrowRight,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import Link from 'next/link';

type Tab = 'procurement' | 'rfq' | 'suppliers' | 'negotiation' | 'cost' | 'notifications';

const TABS: { key: Tab; label: string; icon: React.ElementType; desc: string }[] = [
  { key: 'procurement', label: 'Procurement Advisor', icon: TrendingUp, desc: 'Spending, recommendations, risks' },
  { key: 'rfq', label: 'RFQ Assistant', icon: FileText, desc: 'RFQ quality & suggestions' },
  { key: 'suppliers', label: 'Supplier Intelligence', icon: Store, desc: 'Trust scores & recommendations' },
  { key: 'negotiation', label: 'Negotiation Advisor', icon: Handshake, desc: 'Strategy & counter offers' },
  { key: 'cost', label: 'Cost Optimization', icon: DollarSign, desc: 'Savings opportunities' },
  { key: 'notifications', label: 'AI Notifications', icon: Bell, desc: 'Digest & alerts' },
];

export default function BuyerAgentPage() {
  const [activeTab, setActiveTab] = useState<Tab>('procurement');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">AI Buyer Agent</h1>
          <p className="mt-1 text-sm text-text-secondary">Intelligent procurement assistant for smarter buying decisions</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-text-tertiary">
          <Sparkles className="h-4 w-4 text-accent" />
          Powered by TradeAI
        </div>
      </div>

      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

      <div className="rounded-xl border border-border bg-surface p-6">
        {activeTab === 'procurement' && <ProcurementAdvisorTab />}
        {activeTab === 'rfq' && <RfqAssistantTab />}
        {activeTab === 'suppliers' && <SupplierIntelligenceTab />}
        {activeTab === 'negotiation' && <NegotiationAdvisorTab />}
        {activeTab === 'cost' && <CostOptimizationTab />}
        {activeTab === 'notifications' && <BuyerNotificationsTab />}
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

function ProcurementAdvisorTab() {
  const { data, isLoading, error } = useSmartProcurement();

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState title="Error" message="Failed to load procurement advisor" />;
  if (!data) return <EmptyState title="No procurement data available" />;

  return (
    <div className="space-y-8">
      {data.categorySpendDistribution.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-3">Spend Distribution</h3>
          <div className="space-y-3">
            {data.categorySpendDistribution.map((c, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="w-32 text-sm text-text-secondary">{c.category}</span>
                <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${c.percentage}%` }} />
                </div>
                <span className="w-24 text-right text-sm text-text-primary">{c.percentage}%</span>
                <span className="w-24 text-right text-sm text-text-primary font-medium">₹{c.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.buyingRecommendations.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-3">Recommendations</h3>
          <div className="space-y-2">
            {data.buyingRecommendations.map((r, i) => (
              <div key={i} className="flex items-start justify-between rounded-lg border border-border bg-surface-secondary p-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-accent shrink-0" />
                    <span className="text-sm font-medium text-text-primary">{r.recommendation}</span>
                  </div>
                  <p className="mt-1 text-xs text-text-tertiary ml-6">{r.reason}</p>
                </div>
                {r.actionUrl && (
                  <Link href={r.actionUrl} className="shrink-0 ml-3 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/20 transition-colors">
                    Go
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {data.riskWarnings.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-3">Risk Warnings</h3>
          {data.riskWarnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-status-warning">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{w.description}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RfqAssistantTab() {
  const { data, isLoading, error } = useBuyerRfqAssistant();

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState title="Error" message="Failed to load RFQ assistant" />;
  if (!data) return <EmptyState title="No RFQ data available" />;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-surface-secondary p-4">
          <p className="text-xs text-text-tertiary">RFQ Completeness</p>
          <p className="mt-1 text-2xl font-bold text-accent">{data.completenessScore}/100</p>
          <div className="mt-2 h-1.5 rounded-full bg-border overflow-hidden">
            <div className="h-full rounded-full bg-accent" style={{ width: `${data.completenessScore}%` }} />
          </div>
        </div>
        {data.estimatedPricing && (
          <div className="rounded-lg border border-border bg-surface-secondary p-4">
            <p className="text-xs text-text-tertiary">Est. Budget Range</p>
            <p className="mt-1 text-lg font-bold text-text-primary">
              ₹{data.estimatedPricing.min.toLocaleString()} – ₹{data.estimatedPricing.max.toLocaleString()}
            </p>
            <p className="text-xs text-text-tertiary mt-1">Currency: {data.estimatedPricing.currency}</p>
          </div>
        )}
      </div>

      {data.categoryRecommendation && (
        <div className="flex items-start gap-3 rounded-lg border border-border bg-surface-secondary p-3">
          <Sparkles className="h-5 w-5 text-accent mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-text-primary font-medium">{data.categoryRecommendation}</p>
            <p className="text-xs text-text-tertiary mt-0.5">{data.deliveryRecommendation}</p>
          </div>
        </div>
      )}

      {data.suggestions.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-3">Suggestions</h3>
          <div className="space-y-2">
            {data.suggestions.map((s, i) => (
              <div key={i} className="flex items-start justify-between rounded-lg border border-border bg-surface-secondary p-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary">{s.field}</span>
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${s.impact === 'high' ? 'bg-status-error/15 text-status-error' : 'bg-status-warning/15 text-status-warning'}`}>{s.impact}</span>
                  </div>
                  <p className="text-xs text-text-tertiary mt-0.5">{s.issue}</p>
                  <p className="text-xs text-accent mt-0.5">{s.suggestion}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SupplierIntelligenceTab() {
  const { data, isLoading, error } = useSupplierIntelligence();

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState title="Error" message="Failed to load supplier intelligence" />;
  if (!data) return <EmptyState title="No supplier data available" />;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">{data.totalCount} suppliers evaluated</p>
        {data.filters.length > 0 && (
          <div className="flex gap-2">
            {data.filters.map((f, i) => (
              <span key={i} className="rounded bg-surface-secondary px-2.5 py-1 text-xs text-text-tertiary border border-border">{f.field}</span>
            ))}
          </div>
        )}
      </div>

      {data.topRecommendation && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <Star className="h-4 w-4" />
            <span className="text-sm font-medium">Top Recommendation</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-semibold text-text-primary">{data.topRecommendation.companyName}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-emerald-400">{data.topRecommendation.grade} · Score: {data.topRecommendation.unifiedScore}</span>
                <span className="text-xs text-text-tertiary">Risk: {data.topRecommendation.riskLevel}</span>
                <span className="text-xs text-text-tertiary">Resp: {data.topRecommendation.responseTime}</span>
              </div>
            </div>
            <Link href={`/companies/${data.topRecommendation.slug}`} className="rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/20 transition-colors">
              View Profile
            </Link>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-medium text-text-primary mb-3">Top Suppliers</h3>
        <div className="space-y-2">
          {data.suppliers.map((s, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-surface-secondary p-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent shrink-0">
                  {i + 1}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{s.companyName}</p>
                  <div className="flex items-center gap-2 text-xs text-text-tertiary">
                    <span className="text-emerald-400">{s.grade}</span>
                    <span>Score: {s.unifiedScore}</span>
                    {s.pastOrderCount > 0 && <span className="text-accent">{s.pastOrderCount} prev orders</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Shield className={`h-4 w-4 ${s.riskLevel === 'Low' ? 'text-emerald-400' : s.riskLevel === 'Medium' ? 'text-amber-400' : 'text-status-error'}`} />
                <Link href={`/companies/${s.slug}`} className="text-xs text-accent hover:text-accent/80">
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NegotiationAdvisorTab() {
  const { data, isLoading, error } = useBuyerNegotiationAdvisor();

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState title="Error" message="Failed to load negotiation advisor" />;
  if (!data) return <EmptyState title="No negotiation data available" />;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-surface-secondary p-4">
          <p className="text-xs text-text-tertiary">Win Probability</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">{data.winProbability}%</p>
        </div>
        <div className="rounded-lg border border-border bg-surface-secondary p-4">
          <p className="text-xs text-text-tertiary">Strategy</p>
          <p className="mt-1 text-sm text-text-primary">{data.strategy}</p>
        </div>
      </div>

      {data.discountOpportunities.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-3">Discount Opportunities</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.discountOpportunities.map((d, i) => (
              <div key={i} className="rounded-lg border border-border bg-surface-secondary p-3">
                <p className="text-sm font-medium text-text-primary">{d.type}</p>
                <p className="text-lg font-bold text-emerald-400 mt-1">{d.potential}</p>
                <p className="text-xs text-text-tertiary mt-1">{d.reasoning}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.counterOffers.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-3">Suggested Counter Offers</h3>
          <div className="space-y-2">
            {data.counterOffers.map((c, i) => (
              <div key={i} className="rounded-lg border border-border bg-surface-secondary p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text-primary">{c.field}</span>
                  <span className="text-xs text-text-tertiary">{c.currentValue} → <span className="text-emerald-400 font-medium">{c.suggestedValue}</span></span>
                </div>
                <p className="text-xs text-text-tertiary mt-1">{c.reasoning}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.riskIndicators.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-3">Risk Indicators</h3>
          {data.riskIndicators.map((r, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-text-secondary">
              <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${r.level === 'high' ? 'text-status-error' : r.level === 'medium' ? 'text-amber-400' : 'text-text-tertiary'}`} />
              <span>{r.description}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CostOptimizationTab() {
  const { data, isLoading, error } = useCostOptimization();

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState title="Error" message="Failed to load cost optimization" />;
  if (!data) return <EmptyState title="No cost data available" />;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-surface-secondary p-4">
          <p className="text-xs text-text-tertiary">Potential Savings</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">₹{data.totalPotentialSavings.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface-secondary p-4">
          <p className="text-xs text-text-tertiary">Market Trend</p>
          <p className={`mt-1 text-lg font-semibold capitalize ${data.marketTrend === 'rising' ? 'text-status-error' : data.marketTrend === 'falling' ? 'text-emerald-400' : 'text-text-primary'}`}>{data.marketTrend}</p>
        </div>
      </div>

      {data.items.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-3">Optimization Opportunities</h3>
          <div className="space-y-2">
            {data.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-surface-secondary p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{item.productName}</p>
                  <div className="flex items-center gap-2 text-xs text-text-tertiary mt-0.5">
                    <span>₹{item.currentPrice.toLocaleString()} → </span>
                    <span className="text-emerald-400 font-medium">₹{item.suggestedPrice.toLocaleString()}</span>
                    <span className="text-status-error">-{item.savingsPercent}%</span>
                  </div>
                </div>
                <span className={`shrink-0 rounded px-2 py-1 text-xs font-medium ${item.confidence === 'high' ? 'bg-emerald-500/15 text-emerald-400' : item.confidence === 'medium' ? 'bg-amber-500/15 text-amber-400' : 'bg-surface text-text-tertiary'}`}>{item.confidence}</span>
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

function BuyerNotificationsTab() {
  const { data, isLoading, error } = useBuyerAgentNotifications();

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
        <NotifGroup title="Critical" icon={<AlertTriangle className="h-4 w-4 text-status-error" />}>
          {data.criticalAlerts.map((n, i) => <NotifCard key={i} item={n} />)}
        </NotifGroup>
      )}

      {data.opportunities.length > 0 && (
        <NotifGroup title="Opportunities" icon={<Sparkles className="h-4 w-4 text-emerald-400" />}>
          {data.opportunities.map((n, i) => <NotifCard key={i} item={n} />)}
        </NotifGroup>
      )}

      {data.reminders.length > 0 && (
        <NotifGroup title="Reminders" icon={<Bell className="h-4 w-4 text-amber-400" />}>
          {data.reminders.map((n, i) => <NotifCard key={i} item={n} />)}
        </NotifGroup>
      )}

      {data.milestones.length > 0 && (
        <NotifGroup title="Milestones" icon={<Star className="h-4 w-4 text-accent" />}>
          {data.milestones.map((n, i) => <NotifCard key={i} item={n} />)}
        </NotifGroup>
      )}
    </div>
  );
}

function NotifGroup({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
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

function NotifCard({ item }: { item: { title: string; body: string; link?: string } }) {
  const content = (
    <div className="rounded-lg border border-border bg-surface-secondary p-3">
      <p className="text-sm font-medium text-text-primary">{item.title}</p>
      <p className="text-xs text-text-secondary mt-0.5">{item.body}</p>
    </div>
  );
  return item.link ? <Link href={item.link}>{content}</Link> : content;
}


