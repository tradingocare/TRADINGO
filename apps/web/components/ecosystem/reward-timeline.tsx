'use client';

import { cn } from '@/lib/utils';
import { Zap, Gift, Award, Star, TrendingUp, CheckCircle, Flame } from 'lucide-react';
import type { XpTransaction } from '@/lib/api/ecosystem';

const reasonIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  LOGIN: Zap, SEARCH: Zap, RFQ_CREATED: TrendingUp, QUOTE_SUBMITTED: TrendingUp,
  QUOTE_ACCEPTED: Award, ORDER_COMPLETED: Award, ORDER_DELIVERED: Award,
  PAYMENT_MADE: Gift, REFERRAL_SUBMITTED: Gift, REFERRAL_CONVERTED: Gift,
  REVIEW_GIVEN: Star, REVIEW_RECEIVED: Star, AI_USAGE: Zap,
  CAMPAIGN_PARTICIPATION: Gift, NEGOTIATION_COMPLETED: Award,
  DELIVERY_CONFIRMED: CheckCircle, MEMBERSHIP_PURCHASED: Award,
  PROFILE_COMPLETED: CheckCircle, KYC_COMPLETED: CheckCircle,
  PRODUCT_UPLOADED: TrendingUp, BADGE_EARNED: Award,
  ACHIEVEMENT_UNLOCKED: Award, LEVEL_UP: TrendingUp,
  DAILY_CHECKIN: Zap, STREAK_BONUS: Flame,
  MISSION_COMPLETED: Award, LEADERBOARD_RANK: Award,
};

function formatReason(reason: string): string {
  return reason.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

interface RewardTimelineProps {
  entries: XpTransaction[];
  className?: string;
}

export function RewardTimeline({ entries, className }: RewardTimelineProps) {
  if (!entries?.length) {
    return (
      <div className={cn('flex flex-col items-center py-6 text-center', className)}>
        <Zap className="mb-2 h-6 w-6 text-text-tertiary" />
        <p className="text-xs text-text-tertiary">No recent XP activity</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-0', className)}>
      {entries.map((entry, i) => {
        const Icon = reasonIcons[entry.reason] || Zap;
        return (
          <div key={entry.id} className="relative flex gap-3 pb-4 last:pb-0">
            {i < entries.length - 1 && (
              <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border" />
            )}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-500/10">
              <Icon className="h-4 w-4 text-accent-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-text-primary">{formatReason(entry.reason)}</p>
                <span className="text-xs font-semibold text-accent-500">+{entry.amount} XP</span>
              </div>
              <p className="text-[10px] text-text-tertiary">{new Date(entry.createdAt).toLocaleDateString()} {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
