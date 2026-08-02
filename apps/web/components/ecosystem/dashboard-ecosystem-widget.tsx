'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Zap, Target, TrendingUp, Sparkles, Calendar, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import type { EcosystemDashboard } from '@/lib/api/ecosystem';

interface DashboardEcosystemWidgetProps {
  dashboard: EcosystemDashboard | undefined;
  loading?: boolean;
  role?: 'buyer' | 'seller';
}

export function DashboardEcosystemWidget({ dashboard, loading, role = 'buyer' }: DashboardEcosystemWidgetProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-accent-500" />
            Ecosystem Today
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
        </CardContent>
      </Card>
    );
  }

  if (!dashboard) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-accent-500" />
          Ecosystem Today
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-text-secondary">
            <Zap className="h-3 w-3 text-accent-500" />
            Today's XP
          </span>
          <span className="font-medium text-accent-500">+{dashboard.todayXp}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-text-secondary">
            <TrendingUp className="h-3 w-3 text-status-success" />
            Today's Rewards
          </span>
          <span className="font-medium text-status-success">{dashboard.todayRewards}</span>
        </div>
        {dashboard.todayMission && (
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-text-secondary">
              <Target className="h-3 w-3 text-accent" />
              Mission
            </span>
            <span className="max-w-[160px] truncate font-medium text-text-primary" title={dashboard.todayMission}>
              {dashboard.todayMission}
            </span>
          </div>
        )}
        <div className="flex items-start gap-2 rounded-lg bg-accent-500/5 px-2.5 py-2">
          <Calendar className="mt-0.5 h-3 w-3 shrink-0 text-accent-500" />
          <div>
            <p className="text-xs font-medium text-text-primary">{dashboard.recommendedAction}</p>
            <p className="mt-0.5 text-[11px] text-text-tertiary">{dashboard.businessImpact}</p>
          </div>
        </div>
        <Link href={role === 'seller' ? '/seller/ecosystem' : '/buyer/ecosystem'} className="block text-center text-xs text-accent-500 hover:text-accent-500/80">
          View full ecosystem →
        </Link>
      </CardContent>
    </Card>
  );
}
