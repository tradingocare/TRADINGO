'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Zap, Gift, Target, Award, TrendingUp } from 'lucide-react';
import type { AiIntelligence } from '@/lib/api/ecosystem';

interface RewardSummaryProps {
  intelligence: AiIntelligence | undefined;
  loading?: boolean;
}

export function RewardSummary({ intelligence, loading }: RewardSummaryProps) {
  if (loading || !intelligence) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-sm"><TrendingUp className="mr-2 inline h-4 w-4 text-accent-500" />Reward Summary</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-surface-secondary" />)}
        </CardContent>
      </Card>
    );
  }

  const topReasons = intelligence.xpBreakdown.sort((a, b) => (b._sum?.amount ?? 0) - (a._sum?.amount ?? 0)).slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <TrendingUp className="h-4 w-4 text-accent-500" />
          Reward Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="mb-2 text-xs font-medium text-text-secondary">Top XP Sources (30 days)</p>
          <div className="space-y-1.5">
            {topReasons.map((item) => {
              const pct = intelligence.totalXp > 0 ? Math.round((((item._sum?.amount ?? 0) / intelligence.totalXp) * 100)) : 0;
              return (
                <div key={item.reason} className="flex items-center justify-between text-xs">
                  <span className="text-text-secondary capitalize">{item.reason.replace(/_/g, ' ').toLowerCase()}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-text-secondary">{item._count}x</span>
                    <span className="w-10 text-right font-medium text-accent-500">+{item._sum?.amount ?? 0}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {intelligence.recommendations.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-text-secondary">Recommendations</p>
            <div className="space-y-1.5">
              {intelligence.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg bg-accent-500/5 px-2.5 py-2">
                  <Zap className="mt-0.5 h-3 w-3 shrink-0 text-accent-500" />
                  <p className="text-xs text-text-secondary">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
