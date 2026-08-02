'use client';

import { MapPin, Globe, TrendingUp, ArrowRight, Navigation } from 'lucide-react';
import Link from 'next/link';
import { GlassCard } from '@/components/tradeserv/glass-card';
import { useGeoIntelligence } from '@/hooks/use-marketplace-intelligence';

export function EcosystemNearFarBestCard() {
  const { data: geo, isLoading } = useGeoIntelligence();

  return (
    <GlassCard className="hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.15)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Near→Far→Best</h3>
        <Navigation className="h-5 w-5 text-[#f59e0b]" />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-20 w-full animate-pulse rounded bg-surface-secondary" />
        </div>
      ) : geo ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-surface p-3">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="h-3.5 w-3.5 text-accent" />
                <span className="text-xs text-text-tertiary">States</span>
              </div>
              <p className="text-lg font-bold text-text-primary">{geo.supplierDensity?.length ?? 0}</p>
              <p className="text-[10px] text-text-tertiary">
                {geo.supplierDensity?.reduce((a, b) => a + b.count, 0) ?? 0} total suppliers
              </p>
            </div>
            <div className="rounded-lg bg-surface p-3">
              <div className="flex items-center gap-2 mb-1">
                <Globe className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-xs text-text-tertiary">Buyers</span>
              </div>
              <p className="text-lg font-bold text-text-primary">{geo.buyerDensity?.length ?? 0}</p>
              <p className="text-[10px] text-text-tertiary">
                {geo.buyerDensity?.reduce((a, b) => a + b.count, 0) ?? 0} total buyers
              </p>
            </div>
          </div>

          {geo.categoryDensity && geo.categoryDensity.length > 0 && (
            <div>
              <p className="text-xs font-medium text-text-secondary mb-2">Top Categories</p>
              <div className="space-y-1.5">
                {geo.categoryDensity.slice(0, 3).map((cat) => (
                  <div key={cat.category} className="flex items-center justify-between">
                    <span className="text-xs text-text-tertiary truncate max-w-[160px]">{cat.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-primary">{cat.count}</span>
                      <span className="text-xs text-text-tertiary">({cat.percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 rounded-lg bg-surface p-3">
            <TrendingUp className="h-4 w-4 shrink-0 text-amber-500" />
            <span className="text-xs text-text-secondary">
              {geo.demandHeatmap?.length ?? 0} demand hotspots identified across your regions
            </span>
          </div>

          <Link
            href="/tradeserv/workspace/analytics"
            className="inline-flex items-center gap-1 text-xs font-medium text-[#f59e0b] transition-colors hover:text-[#f59e0b]/80"
          >
            Explore Markets <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      ) : (
        <p className="text-xs text-text-tertiary">Location intelligence loading once your profile is set up</p>
      )}
    </GlassCard>
  );
}
