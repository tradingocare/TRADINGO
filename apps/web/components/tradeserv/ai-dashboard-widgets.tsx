'use client';

import { Loader2, Award, TrendingUp, AlertTriangle, CheckCircle2, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAiDashboardWidgets, useAiMarketplaceSuggestions, useAiGrowthSuggestions, useAiTradTrustSuggestions } from '@/hooks/use-tradeserv-ai';

export function AiDashboardWidgets() {
  const { data: widgets, isLoading: wLoading } = useAiDashboardWidgets();
  const { data: marketplace, isLoading: mLoading } = useAiMarketplaceSuggestions();
  const { data: growth, isLoading: gLoading } = useAiGrowthSuggestions();
  const { data: trust, isLoading: tLoading } = useAiTradTrustSuggestions();

  if (wLoading || mLoading || gLoading || tLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-text-tertiary" />
      </div>
    );
  }

  const wData = widgets?.data;
  const marketplaceData = marketplace?.data as string[] | undefined;
  const growthData = growth?.data as Array<{ area: string; suggestion: string; impact: string }> | undefined;
  const trustData = trust?.data as { score: number | null; grade?: string; suggestions: Array<{ factor: string; score: number; tip: string }> } | undefined;

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-text-primary">AI Intelligence</h3>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {wData && (
          <>
            <StatCard
              icon={Award}
              label="Profile Completion"
              value={`${wData.profileCompletion ?? 0}%`}
              color={wData.profileCompletion >= 80 ? 'emerald' : wData.profileCompletion >= 40 ? 'amber' : 'red'}
            />
            <StatCard
              icon={TrendingUp}
              label="Trust Grade"
              value={wData.trustGrade ?? 'N/A'}
              color={wData.trustGrade === 'A+' || wData.trustGrade === 'A' ? 'emerald' : wData.trustGrade ? 'amber' : 'red'}
            />
            <StatCard
              icon={CheckCircle2}
              label="Services"
              value={String(wData.servicesCount ?? 0)}
              color={wData.servicesCount > 0 ? 'emerald' : 'amber'}
            />
            <StatCard
              icon={CheckCircle2}
              label="Portfolio Items"
              value={String(wData.portfolioCount ?? 0)}
              color={wData.portfolioCount > 0 ? 'emerald' : 'amber'}
            />
          </>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {marketplaceData && marketplaceData.length > 0 && (
          <div className="rounded-xl border border-border bg-surface-secondary p-4">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-primary">
              <Lightbulb className="h-4 w-4 text-accent-500" />
              Quick Wins
            </h4>
            <ul className="space-y-2">
              {(marketplaceData as string[]).map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {growthData && growthData.length > 0 && (
          <div className="rounded-xl border border-border bg-surface-secondary p-4">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-primary">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Growth Opportunities
            </h4>
            <div className="space-y-2">
              {growthData.map((item, i) => (
                <div key={i} className="rounded-lg border border-border bg-surface p-2.5">
                  <p className="text-xs font-medium text-text-primary">{item.area}</p>
                  <p className="mt-0.5 text-[11px] text-text-secondary">{item.suggestion}</p>
                  <p className="mt-0.5 text-[10px] text-emerald-500">{item.impact}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {trustData?.suggestions && trustData.suggestions.length > 0 && (
        <div className="rounded-xl border border-border bg-surface-secondary p-4">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-primary">
            <Award className="h-4 w-4 text-accent-500" />
            Trust Score Improvement
          </h4>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {trustData.suggestions.map((item, i) => (
              <div key={i} className="rounded-lg border border-border bg-surface p-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-text-primary capitalize">{item.factor.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="text-xs font-semibold text-accent-500">{item.score}/100</span>
                </div>
                <p className="mt-1 text-[11px] text-text-secondary">{item.tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: 'emerald' | 'amber' | 'red';
}) {
  const colors = {
    emerald: 'text-emerald-500 bg-emerald-500/10',
    amber: 'text-amber-500 bg-amber-500/10',
    red: 'text-red-500 bg-red-500/10',
  };

  return (
    <div className="rounded-xl border border-border bg-surface-secondary p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-tertiary">{label}</span>
        <div className={cn('rounded-lg p-1.5', colors[color])}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <p className="mt-2 text-xl font-bold text-text-primary">{value}</p>
    </div>
  );
}
