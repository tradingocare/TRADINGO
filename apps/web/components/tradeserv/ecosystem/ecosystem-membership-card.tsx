'use client';

import { Award, Zap, CreditCard, TrendingUp, ArrowRight, Shield } from 'lucide-react';
import Link from 'next/link';
import { GlassCard } from '@/components/tradeserv/glass-card';
import { useCurrentPlan } from '@/hooks/use-membership';
import { useMyCreditBalance } from '@/hooks/use-ai-credits';
import { useXpBalance } from '@/hooks/use-ecosystem';

export function EcosystemMembershipCard() {
  const { data: plan, isLoading: planLoading } = useCurrentPlan();
  const { data: credits, isLoading: creditsLoading } = useMyCreditBalance();
  const { data: xp, isLoading: xpLoading } = useXpBalance();

  const isLoading = planLoading || creditsLoading || xpLoading;

  const planName = plan?.subscriptionPlan || 'Trial';
  const planStatus = plan?.subscriptionStatus || 'TRIAL';
  const expiryDate = plan?.subscriptionExpiresAt
    ? new Date(plan.subscriptionExpiresAt).toLocaleDateString()
    : null;

  const creditTotal = credits?.total ?? 0;
  const creditUsed = credits?.used ?? 0;
  const creditRemaining = credits?.remaining ?? 0;
  const creditPercent = creditTotal > 0 ? Math.round((creditUsed / creditTotal) * 100) : 0;

  const xpTotal = xp?.totalXP ?? 0;
  const xpLevel = xp?.currentLevel?.name ?? 'Bronze';

  return (
    <GlassCard className="hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.15)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Membership & Credits</h3>
        <Award className="h-5 w-5 text-[#f59e0b]" />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-5 w-32 animate-pulse rounded bg-surface-secondary" />
          <div className="h-4 w-48 animate-pulse rounded bg-surface-secondary" />
          <div className="h-2 w-full animate-pulse rounded bg-surface-secondary" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-text-primary">{planName}</p>
              <p className="text-xs text-text-tertiary">
                Status: {planStatus.toLowerCase()}
                {expiryDate && ` · Renewal: ${expiryDate}`}
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-surface-secondary px-3 py-1">
              <TrendingUp className="h-3.5 w-3.5 text-[#f59e0b]" />
              <span className="text-xs font-medium text-text-primary">Lv.{xpLevel}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-text-secondary">
                <strong className="text-text-primary">{xpTotal.toLocaleString()}</strong> XP
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-accent" />
              <span className="text-xs text-text-secondary">
                <strong className="text-text-primary">{creditRemaining}</strong> / {creditTotal} AI Credits
              </span>
            </div>
          </div>

          {creditTotal > 0 && (
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-secondary">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  creditPercent > 80 ? 'bg-red-500' : creditPercent > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${creditPercent}%` }}
              />
            </div>
          )}

          <div className="flex items-center gap-2 rounded-lg bg-surface p-3">
            <Shield className="h-4 w-4 shrink-0 text-emerald-500" />
            <span className="text-xs text-text-secondary">
              TradeTalk eligibility:{' '}
              <span className={planStatus === 'ACTIVE' ? 'text-emerald-500' : 'text-amber-500'}>
                {planStatus === 'ACTIVE' ? 'Eligible' : 'Upgrade required'}
              </span>
            </span>
          </div>

          <Link
            href="/tradeserv/workspace/membership"
            className="inline-flex items-center gap-1 text-xs font-medium text-[#f59e0b] transition-colors hover:text-[#f59e0b]/80"
          >
            View Membership <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </GlassCard>
  );
}
