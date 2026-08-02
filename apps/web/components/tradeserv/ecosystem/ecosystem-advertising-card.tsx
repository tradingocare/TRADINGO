'use client';

import { Megaphone, TrendingUp, Eye, MousePointer2, ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';
import { GlassCard } from '@/components/tradeserv/glass-card';
import { useMyAdStats } from '@/hooks/use-advertising';

export function EcosystemAdvertisingCard() {
  const { data: stats, isLoading } = useMyAdStats();

  return (
    <GlassCard className="hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.15)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Promotions</h3>
        <Megaphone className="h-5 w-5 text-[#f59e0b]" />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-5 w-20 animate-pulse rounded bg-surface-secondary" />
          <div className="h-4 w-36 animate-pulse rounded bg-surface-secondary" />
        </div>
      ) : stats ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-surface p-3">
              <div className="flex items-center gap-2 mb-1">
                <Megaphone className="h-3.5 w-3.5 text-accent" />
                <span className="text-xs text-text-tertiary">Active Ads</span>
              </div>
              <p className="text-lg font-bold text-text-primary">{stats.active}</p>
            </div>
            <div className="rounded-lg bg-surface p-3">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-xs text-text-tertiary">Impressions</span>
              </div>
              <p className="text-lg font-bold text-text-primary">{stats.totalImpressions?.toLocaleString() ?? 0}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-surface p-3">
              <div className="flex items-center gap-2 mb-1">
                <MousePointer2 className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-xs text-text-tertiary">Clicks</span>
              </div>
              <p className="text-lg font-bold text-text-primary">{stats.totalClicks?.toLocaleString() ?? 0}</p>
            </div>
            <div className="rounded-lg bg-surface p-3">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-xs text-text-tertiary">CTR</span>
              </div>
              <p className="text-lg font-bold text-text-primary">{stats.ctr?.toFixed(1) ?? '0.0'}%</p>
            </div>
          </div>

          {stats.totalSpent > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-surface p-3">
              <TrendingUp className="h-4 w-4 shrink-0 text-amber-500" />
              <span className="text-xs text-text-secondary">
                Spent: <strong className="text-text-primary">{stats.totalSpent.toLocaleString()}</strong> GOCASH
              </span>
            </div>
          )}

          <Link
            href="/seller/advertising"
            className="inline-flex items-center gap-1 text-xs font-medium text-[#f59e0b] transition-colors hover:text-[#f59e0b]/80"
          >
            Manage Ads <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-2 py-3">
            <Megaphone className="h-8 w-8 text-text-tertiary/50" />
            <p className="text-xs text-text-tertiary">No active promotions</p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-surface p-3">
            <Zap className="h-4 w-4 shrink-0 text-accent" />
            <span className="text-xs text-text-secondary">
              Boost your profile visibility with sponsored placements
            </span>
          </div>
          <Link
            href="/seller/advertising/new"
            className="inline-flex items-center gap-1 text-xs font-medium text-[#f59e0b] transition-colors hover:text-[#f59e0b]/80"
          >
            Create Campaign <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </GlassCard>
  );
}
