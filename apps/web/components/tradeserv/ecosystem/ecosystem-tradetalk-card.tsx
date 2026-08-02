'use client';

import { MessageCircle, Users, Globe, Clock, ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';
import { GlassCard } from '@/components/tradeserv/glass-card';
import { useCurrentPlan } from '@/hooks/use-membership';

export function EcosystemTradeTalkCard() {
  const { data: plan, isLoading } = useCurrentPlan();
  const isEligible = plan?.subscriptionStatus === 'ACTIVE';

  return (
    <GlassCard className="hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.15)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">TradeTalk</h3>
        <MessageCircle className="h-5 w-5 text-[#f59e0b]" />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-5 w-40 animate-pulse rounded bg-surface-secondary" />
          <div className="h-4 w-52 animate-pulse rounded bg-surface-secondary" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-lg bg-surface p-3">
            <Users className="h-4 w-4 shrink-0 text-[#f59e0b]" />
            <span className="text-xs text-text-secondary">
              Professional network for verified TradeServ professionals
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-surface p-3 text-center">
              <Globe className="mx-auto h-5 w-5 text-text-tertiary mb-1" />
              <p className="text-xs font-medium text-text-primary">Network</p>
              <p className="text-[10px] text-text-tertiary">Connect globally</p>
            </div>
            <div className="rounded-lg bg-surface p-3 text-center">
              <MessageCircle className="mx-auto h-5 w-5 text-text-tertiary mb-1" />
              <p className="text-xs font-medium text-text-primary">Discuss</p>
              <p className="text-[10px] text-text-tertiary">Share insights</p>
            </div>
          </div>

          {isEligible ? (
            <div className="flex items-center gap-2 rounded-lg bg-surface p-3">
              <Zap className="h-4 w-4 shrink-0 text-emerald-500" />
              <span className="text-xs text-text-secondary">
                You&apos;re eligible! TradeTalk is coming soon.
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg bg-surface p-3">
              <Clock className="h-4 w-4 shrink-0 text-amber-500" />
              <span className="text-xs text-text-secondary">
                Active membership required to access TradeTalk
              </span>
            </div>
          )}

          <Link
            href="/tradetalk"
            className="inline-flex items-center gap-1 text-xs font-medium text-[#f59e0b] transition-colors hover:text-[#f59e0b]/80"
          >
            Learn More <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </GlassCard>
  );
}
