'use client';

import { Users, TrendingUp, MapPin, ArrowRight, Building2 } from 'lucide-react';
import Link from 'next/link';
import { GlassCard } from '@/components/tradeserv/glass-card';
import { useSellerRecommendations, useMarketplaceRankings } from '@/hooks/use-marketplace-intelligence';

interface MarketplaceCardProps {
  companyId: string;
}

export function EcosystemMarketplaceCard({ companyId }: MarketplaceCardProps) {
  const { data: recommendations, isLoading: recsLoading } = useSellerRecommendations(companyId, 5);
  const { data: rankings, isLoading: rankingsLoading } = useMarketplaceRankings();

  const isLoading = recsLoading || rankingsLoading;

  return (
    <GlassCard className="hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.15)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Marketplace Insights</h3>
        <Building2 className="h-5 w-5 text-[#f59e0b]" />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-4 w-40 animate-pulse rounded bg-surface-secondary" />
          <div className="h-4 w-52 animate-pulse rounded bg-surface-secondary" />
          <div className="h-4 w-36 animate-pulse rounded bg-surface-secondary" />
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations && recommendations.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-[#f59e0b]" />
                <p className="text-xs font-medium text-text-secondary">Opportunities Found</p>
              </div>
              <div className="space-y-2">
                {recommendations.slice(0, 4).map((rec, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-surface px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin className="h-3 w-3 shrink-0 text-text-tertiary" />
                      <span className="text-xs text-text-secondary truncate">
                        {rec.type?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-[#f59e0b] shrink-0 ml-2">
                      Score: {rec.score.toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {rankings && (
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-surface p-2 text-center">
                <p className="text-lg font-bold text-text-primary">
                  {rankings.suppliers?.length ?? 0}
                </p>
                <p className="text-[10px] text-text-tertiary">Suppliers</p>
              </div>
              <div className="rounded-lg bg-surface p-2 text-center">
                <p className="text-lg font-bold text-text-primary">
                  {rankings.buyers?.length ?? 0}
                </p>
                <p className="text-[10px] text-text-tertiary">Buyers</p>
              </div>
              <div className="rounded-lg bg-surface p-2 text-center">
                <p className="text-lg font-bold text-text-primary">
                  {rankings.categories?.length ?? 0}
                </p>
                <p className="text-[10px] text-text-tertiary">Categories</p>
              </div>
            </div>
          )}

          {(!recommendations || recommendations.length === 0) && !rankings && (
            <p className="text-xs text-text-tertiary">
              Complete your profile to receive marketplace recommendations
            </p>
          )}
        </div>
      )}
    </GlassCard>
  );
}
