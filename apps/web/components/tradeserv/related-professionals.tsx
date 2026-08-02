'use client';

import { ArrowRight, Users } from 'lucide-react';
import Link from 'next/link';
import { GlassCard } from '@/components/tradeserv/glass-card';
import { useFeaturedProfessionals } from '@/hooks/use-tradeserv';

interface RelatedProfessionalsProps {
  currentSlug: string;
  category?: string;
}

export function RelatedProfessionals({ currentSlug, category }: RelatedProfessionalsProps) {
  const { data: featured, isLoading } = useFeaturedProfessionals(4);

  const related = (featured ?? []).filter(
    (p: any) => p.slug !== currentSlug
  ).slice(0, 3);

  if (isLoading) {
    return (
      <GlassCard>
        <div className="space-y-3">
          <div className="h-5 w-40 animate-pulse rounded bg-surface-secondary" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-surface-secondary" />
            ))}
          </div>
        </div>
      </GlassCard>
    );
  }

  if (!related.length) return null;

  return (
    <GlassCard>
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-4 w-4 text-[#f59e0b]" />
        <h3 className="text-sm font-semibold text-text-primary">Related Professionals</h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {related.map((p: any) => (
          <Link
            key={p.slug ?? p.id}
            href={`/tradeserv/p/${p.slug}`}
            className="group rounded-xl border border-border bg-surface p-3 transition-all hover:border-accent/30"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-xs font-bold text-accent mb-2">
              {(p.name ?? '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </div>
            <p className="text-xs font-medium text-text-primary group-hover:text-accent transition-colors">
              {p.name}
            </p>
            <p className="text-[10px] text-text-tertiary mt-0.5 truncate">
              {p.description || p.professionalType || ''}
            </p>
            {p.trustScore != null && p.trustScore > 0 && (
              <p className="text-[10px] text-emerald-500 mt-1 font-medium">
                Score: {p.trustScore}
              </p>
            )}
          </Link>
        ))}
      </div>
      <Link
        href="/tradeserv/search"
        className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[#f59e0b] transition-colors hover:text-[#f59e0b]/80"
      >
        View All Professionals <ArrowRight className="h-3 w-3" />
      </Link>
    </GlassCard>
  );
}
