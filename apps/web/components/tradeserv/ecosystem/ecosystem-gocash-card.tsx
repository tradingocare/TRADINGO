'use client';

import { Wallet, TrendingUp, Award, Target, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { GlassCard } from '@/components/tradeserv/glass-card';
import { useSellerWalletSummary } from '@/hooks/use-wallet';
import { useUserMissions } from '@/hooks/use-ecosystem';

export function EcosystemGocashCard() {
  const { data: wallet, isLoading: walletLoading } = useSellerWalletSummary();
  const { data: missions, isLoading: missionsLoading } = useUserMissions();

  const isLoading = walletLoading || missionsLoading;
  const activeMissions = missions?.filter((m) => m.status === 'IN_PROGRESS') ?? [];

  return (
    <GlassCard className="hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.15)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">GOCASH Rewards</h3>
        <Wallet className="h-5 w-5 text-[#f59e0b]" />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-10 w-28 animate-pulse rounded bg-surface-secondary" />
          <div className="h-4 w-36 animate-pulse rounded bg-surface-secondary" />
          <div className="h-4 w-44 animate-pulse rounded bg-surface-secondary" />
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-3xl font-bold text-text-primary">
              {wallet ? wallet.balance.toLocaleString() : 0}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-xs text-text-tertiary">
                Available: {wallet?.available.toLocaleString() ?? 0} · Pending: {wallet?.pending.toLocaleString() ?? 0}
              </span>
            </div>
          </div>

          {wallet && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-500" />
                <span className="text-xs text-text-secondary">
                  Earned: <strong className="text-text-primary">{wallet.lifetimeEarned.toLocaleString()}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-accent" />
                <span className="text-xs text-text-secondary">
                  Redeemed: <strong className="text-text-primary">{wallet.lifetimeRedeemed.toLocaleString()}</strong>
                </span>
              </div>
            </div>
          )}

          {activeMissions.length > 0 && (
            <div className="space-y-2 rounded-lg bg-surface p-3">
              <p className="text-xs font-medium text-text-secondary">Active Missions ({activeMissions.length})</p>
              {activeMissions.slice(0, 3).map((m) => (
                <div key={m.id} className="flex items-center justify-between">
                  <span className="text-xs text-text-tertiary truncate max-w-[180px]">
                    {m.mission.name}
                  </span>
                  <span className="text-xs font-medium text-text-primary">
                    {m.progress}/{m.targetCount}
                  </span>
                </div>
              ))}
            </div>
          )}

          <Link
            href="/buyer/gocash"
            className="inline-flex items-center gap-1 text-xs font-medium text-[#f59e0b] transition-colors hover:text-[#f59e0b]/80"
          >
            View Wallet <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </GlassCard>
  );
}
