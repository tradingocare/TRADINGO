'use client';

import { Star, Shield, TrendingUp, ArrowRight, AlertTriangle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { GlassCard } from '@/components/tradeserv/glass-card';
import { useScoreBreakdown } from '@/hooks/use-tradtrust';

interface TradTrustCardProps {
  companyId: string;
}

export function EcosystemTradTrustCard({ companyId }: TradTrustCardProps) {
  const { data: breakdown, isLoading } = useScoreBreakdown(companyId);

  return (
    <GlassCard className="hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.15)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">TradTrust Score</h3>
        <Star className="h-5 w-5 text-[#f59e0b]" />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-10 w-24 animate-pulse rounded bg-surface-secondary" />
          <div className="h-4 w-48 animate-pulse rounded bg-surface-secondary" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-2 w-full animate-pulse rounded bg-surface-secondary" />
            ))}
          </div>
        </div>
      ) : breakdown ? (
        <div className="space-y-4">
          <div className="flex items-end gap-3">
            <div>
              <p className="text-3xl font-bold text-[#f59e0b]">{breakdown.unifiedScore.toFixed(1)}</p>
              <p className="text-xs text-text-tertiary">Unified Score</p>
            </div>
            <div className="mb-1 flex items-center gap-1 rounded-full bg-surface-secondary px-3 py-1">
              <Shield className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-xs font-bold text-text-primary">{breakdown.grade}</span>
            </div>
            <div className="mb-1 flex items-center gap-1 rounded-full bg-surface-secondary px-3 py-1">
              <span
                className={`text-xs font-medium ${
                  breakdown.riskLevel === 'LOW' ? 'text-emerald-500' : 'text-amber-500'
                }`}
              >
                {breakdown.riskLevel} Risk
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {breakdown.breakdown.slice(0, 5).map((factor) => (
              <div key={factor.category}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs text-text-tertiary">{factor.category}</span>
                  <span className="text-xs font-medium text-text-primary">
                    {factor.score.toFixed(0)}/{factor.maxContribution.toFixed(0)}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-secondary">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-500"
                    style={{ width: `${(factor.contribution / factor.maxContribution) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-surface p-3">
            {breakdown.riskLevel === 'LOW' ? (
              <>
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                <span className="text-xs text-text-secondary">Strong trust profile — clients can confidently engage</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                <span className="text-xs text-text-secondary">Consider improving key trust factors for better visibility</span>
              </>
            )}
          </div>

          <Link
            href="/tradeserv/workspace/tradtrust"
            className="inline-flex items-center gap-1 text-xs font-medium text-[#f59e0b] transition-colors hover:text-[#f59e0b]/80"
          >
            Improve Score <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-3xl font-bold text-text-tertiary">--</p>
          <p className="text-xs text-text-tertiary">Complete verification to generate your TradTrust score</p>
          <Link
            href="/tradeserv/workspace/verification"
            className="inline-flex items-center gap-1 text-xs font-medium text-[#f59e0b] transition-colors hover:text-[#f59e0b]/80"
          >
            Start Verification <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </GlassCard>
  );
}
