'use client';

import { Award, Star, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { DashboardPageHeader, StatusBadge } from '@/components/dashboard';
import { useMyProfile } from '@/hooks/use-tradeserv';

export default function TradTrustPage() {
  const { data: profile, isLoading } = useMyProfile();
  const trustScore = profile?.trustScore ?? null;
  const hasScore = trustScore != null && trustScore > 0;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="TradTrust"
        description="Your trust score and reputation on TradeServ"
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-border bg-surface p-6 backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-3">
            <Award className="h-6 w-6 text-[#f59e0b]" />
            <div>
              <p className="text-lg font-bold text-text-primary">TradTrust Score</p>
              <p className="text-sm text-text-tertiary">
                {hasScore ? 'Your reputation score' : 'Score appears after verification'}
              </p>
            </div>
            <StatusBadge status={hasScore ? 'active' : 'pending'} />
          </div>
          <div className="flex items-center justify-center rounded-xl bg-surface py-8">
            {isLoading ? (
              <div className="h-16 w-16 animate-pulse rounded-full bg-surface-secondary" />
            ) : hasScore ? (
              <div className="text-center">
                <Star className="mx-auto h-10 w-10 text-[#f59e0b]" />
                <p className="mt-2 text-5xl font-bold text-[#f59e0b]">{trustScore}</p>
                <div className="mt-2 flex items-center justify-center gap-1 text-sm text-emerald-500">
                  <TrendingUp className="h-4 w-4" /> Verified
                </div>
              </div>
            ) : (
              <div className="text-center">
                <Star className="mx-auto h-12 w-12 text-text-tertiary" />
                <p className="mt-3 text-4xl font-bold text-text-tertiary">--</p>
                <p className="mt-1 text-sm text-text-tertiary">Score will appear after verification</p>
              </div>
            )}
          </div>
        </div>
        <div className="rounded-3xl border border-border bg-surface p-6 backdrop-blur-xl">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-primary">
            <TrendingUp className="h-4 w-4 text-[#f59e0b]" />
            Tips to Improve Your Score
          </h3>
          <ul className="space-y-3">
            {[
              'Complete your professional profile with all details',
              'Get verified',
              'Collect client reviews after each engagement',
              'Maintain a high response rate to inquiries',
              'Keep your service listings up to date',
            ].map((tip) => (
              <li key={tip} className="flex items-start gap-2 text-sm text-text-tertiary">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#f59e0b]" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
