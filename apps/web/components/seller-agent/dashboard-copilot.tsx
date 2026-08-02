'use client';

import { useState } from 'react';
import { useDashboardCopilot } from '@/hooks/use-seller-agent';
import {
  Sparkles, AlertTriangle, TrendingUp, ArrowRight, Zap, Package,
  BarChart3, FileText, PlusCircle, Target, Shield, X,
} from 'lucide-react';
import Link from 'next/link';

const IMPACT_COLORS: Record<string, string> = {
  high: 'text-status-error border-status-error/30 bg-status-error/5',
  medium: 'text-status-warning border-status-warning/30 bg-status-warning/5',
  low: 'text-status-info border-status-info/30 bg-status-info/5',
};

const PRIORITY_BADGE: Record<string, string> = {
  high: 'bg-status-error/15 text-status-error',
  medium: 'bg-status-warning/15 text-status-warning',
  low: 'bg-text-tertiary/10 text-text-tertiary',
};

const QUICK_ACTION_ICONS: Record<string, React.ElementType> = {
  PlusCircle, BarChart3, FileText, Package, Target, Shield,
};

export function DashboardCopilot() {
  const [isOpen, setIsOpen] = useState(true);
  const { data, isLoading, error } = useDashboardCopilot();

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-btn-primary-text shadow-lg hover:bg-accent/90 transition-all">
        <Sparkles className="h-5 w-5" />
        <span className="text-sm font-medium">AI Copilot</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[420px] max-h-[80vh] flex flex-col rounded-xl border border-border bg-surface shadow-2xl">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          <h2 className="text-base font-semibold text-text-primary">AI Copilot</h2>
        </div>
        <button onClick={() => setIsOpen(false)} className="rounded-lg p-1.5 text-text-tertiary hover:bg-surface-secondary hover:text-text-primary transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="h-4 w-3/4 rounded bg-border" />
                <div className="h-3 w-full rounded bg-border" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-8 text-text-tertiary">
            <AlertTriangle className="h-8 w-8 text-status-error" />
            <p className="text-sm">Failed to load AI insights</p>
          </div>
        ) : data ? (
          <>
            <MetricsRow metrics={data.metrics} />

            {data.urgentAlerts.length > 0 && (
              <Section title="Urgent Alerts" icon={<AlertTriangle className="h-4 w-4 text-status-error" />}>
                {data.urgentAlerts.map((alert, i) => (
                  <PriorityCard key={i} item={alert} />
                ))}
              </Section>
            )}

            {data.priorities.length > 0 && (
              <Section title="Today's Priorities" icon={<Target className="h-4 w-4 text-accent" />}>
                {data.priorities.map((p, i) => (
                  <PriorityCard key={i} item={p} />
                ))}
              </Section>
            )}

            {data.growthOpportunities.length > 0 && (
              <Section title="Growth Opportunities" icon={<TrendingUp className="h-4 w-4 text-emerald-400" />}>
                {data.growthOpportunities.map((op, i) => (
                  <PriorityCard key={i} item={op} />
                ))}
              </Section>
            )}

            <Section title="Quick Actions" icon={<Zap className="h-4 w-4 text-amber-400" />}>
              <div className="grid grid-cols-2 gap-2">
                {data.quickActions.map((action, i) => {
                  const Icon = QUICK_ACTION_ICONS[action.icon] || Package;
                  return (
                    <Link key={i} href={action.href} className="flex items-center gap-2 rounded-lg border border-border bg-surface-secondary p-3 text-sm text-text-primary hover:border-accent/30 hover:bg-accent/5 transition-all">
                      <Icon className="h-4 w-4 text-accent" />
                      <span>{action.label}</span>
                    </Link>
                  );
                })}
              </div>
            </Section>
          </>
        ) : null}
      </div>
    </div>
  );
}

function MetricsRow({ metrics }: { metrics: Record<string, number | string> }) {
  const items = [
    { label: 'Products', value: metrics.totalProducts, icon: Package },
    { label: 'Views', value: metrics.profileViews, icon: BarChart3 },
    { label: 'RFQs', value: metrics.rfqs, icon: FileText },
    { label: 'Trust', value: metrics.trustScore, icon: Shield },
  ];
  return (
    <div className="grid grid-cols-4 gap-2">
      {items.map((item, i) => (
        <div key={i} className="flex flex-col items-center gap-1 rounded-lg border border-border bg-surface-secondary p-2.5">
          <item.icon className="h-3.5 w-3.5 text-accent" />
          <span className="text-xs text-text-tertiary">{item.label}</span>
          <span className="text-sm font-semibold text-text-primary">{String(item.value)}</span>
        </div>
      ))}
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-1.5 text-xs font-medium text-text-secondary uppercase tracking-wider">
        {icon}
        <span>{title}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function PriorityCard({ item }: { item: { title: string; description: string; impact: string; actionUrl?: string; actionLabel?: string; metric?: { label: string; value: string | number } } }) {
  return (
    <div className={`rounded-lg border p-3 ${IMPACT_COLORS[item.impact] || IMPACT_COLORS.low}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-primary truncate">{item.title}</span>
            <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${PRIORITY_BADGE[item.impact] || PRIORITY_BADGE.low}`}>
              {item.impact}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-text-secondary line-clamp-2">{item.description}</p>
        </div>
        {item.metric && (
          <div className="shrink-0 rounded-md bg-bg-base/50 px-2.5 py-1 text-center">
            <span className="text-xs text-text-tertiary">{item.metric.label}</span>
            <p className="text-sm font-bold text-text-primary">{String(item.metric.value)}</p>
          </div>
        )}
      </div>
      {item.actionUrl && item.actionLabel && (
        <Link href={item.actionUrl} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent/80 transition-colors">
          {item.actionLabel}
          <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}
