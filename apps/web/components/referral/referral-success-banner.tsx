'use client';

import { useState, useEffect } from 'react';
import { Gift, X, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ReferralSuccessBannerProps {
  rewardAmount?: number;
  refereeName?: string;
  onDismiss?: () => void;
  autoDismissMs?: number;
  className?: string;
}

export function ReferralSuccessBanner({
  rewardAmount,
  refereeName,
  onDismiss,
  autoDismissMs = 8000,
  className,
}: ReferralSuccessBannerProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!autoDismissMs) return;
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, autoDismissMs);
    return () => clearTimeout(timer);
  }, [autoDismissMs, onDismiss]);

  if (!visible) return null;

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  return (
    <div
      className={cn(
        'animate-in slide-in-from-top-full fade-in relative overflow-hidden rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 p-4 duration-500',
        className,
      )}
    >
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute right-2 top-2 rounded-lg p-1 text-emerald-400/60 transition-colors hover:text-emerald-400"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20">
          <Gift className="h-5 w-5 text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-emerald-400">
            Referral Reward Earned!
          </p>
          <p className="mt-0.5 text-xs text-emerald-300/80">
            {refereeName
              ? `${refereeName} signed up using your referral.`
              : 'Someone signed up using your referral.'}
            {rewardAmount != null && ` You earned ${rewardAmount} GOCASH.`}
          </p>
          <Link
            href="/buyer/referrals"
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400/80 hover:text-emerald-400 transition-colors"
          >
            View referral dashboard
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
