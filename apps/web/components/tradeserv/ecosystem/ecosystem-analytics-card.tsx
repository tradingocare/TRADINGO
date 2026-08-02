'use client';

import { BarChart3, Eye, MessageSquare, Briefcase, FileText, ArrowRight, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { GlassCard } from '@/components/tradeserv/glass-card';
import { useDashboard } from '@/hooks/use-tradeserv';

export function EcosystemAnalyticsCard() {
  const { data: dashboard, isLoading } = useDashboard();

  const stats = [
    { label: 'Services', key: 'services' as const, icon: Briefcase },
    { label: 'Portfolio', key: 'portfolio' as const, icon: Eye },
    { label: 'Bookings', key: 'bookings' as const, icon: FileText },
    { label: 'Reviews', key: 'reviews' as const, icon: MessageSquare },
    { label: 'Proposals', key: 'proposals' as const, icon: TrendingUp },
  ];

  return (
    <GlassCard className="hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.15)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Profile Performance</h3>
        <BarChart3 className="h-5 w-5 text-[#f59e0b]" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5].slice(0, 3).map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-secondary" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-5 gap-2">
            {stats.map(({ label, key, icon: Icon }) => (
              <div key={key} className="rounded-lg bg-surface p-2 text-center">
                <Icon className="mx-auto h-3.5 w-3.5 text-text-tertiary mb-1" />
                <p className="text-base font-bold text-text-primary">
                  {dashboard?.[key] ?? 0}
                </p>
                <p className="text-[9px] text-text-tertiary leading-tight">{label}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-surface p-3">
            <BarChart3 className="h-4 w-4 shrink-0 text-[#f59e0b]" />
            <span className="text-xs text-text-tertiary">
              Track your profile engagement and lead generation over time
            </span>
          </div>

          <Link
            href="/tradeserv/workspace/analytics"
            className="inline-flex items-center gap-1 text-xs font-medium text-[#f59e0b] transition-colors hover:text-[#f59e0b]/80"
          >
            View Full Analytics <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </GlassCard>
  );
}
