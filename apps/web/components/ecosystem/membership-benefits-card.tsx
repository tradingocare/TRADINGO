'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Crown, CheckCircle2, Clock, AlertCircle, Zap, Shield, Star, Gift, TrendingUp, Sparkles } from 'lucide-react';
import Link from 'next/link';
import type { CurrentSubscription } from '@/lib/api/membership';

const PLAN_LABELS: Record<string, string> = {
  TRADE_START: 'Trade Start',
  TRADE_SMART: 'Trade Smart',
  TRADE_PLUS: 'Trade Plus',
  TRADE_PRO: 'Trade Pro',
  TRADE_PREMIUM: 'Trade Premium',
  TRADE_ELITE: 'Trade Elite',
  TRADBUY: 'TradBuy',
};

const PLAN_COLORS: Record<string, string> = {
  TRADE_START: 'text-text-secondary',
  TRADE_SMART: 'text-accent',
  TRADE_PLUS: 'text-accent',
  TRADE_PRO: 'text-accent',
  TRADE_PREMIUM: 'text-accent',
  TRADE_ELITE: 'text-accent',
  TRADBUY: 'text-status-success',
};

const PLAN_BENEFITS: Record<string, { xpBonus: string; aiCredits: string; bonusMissions: string; advertisingCredits: string; prioritySupport: boolean; marketplaceVisibility: string; tradeservVisibility: string; referralBonus: string }> = {
  TRADE_START: { xpBonus: '1x', aiCredits: '20/mo', bonusMissions: '1/mo', advertisingCredits: '—', prioritySupport: false, marketplaceVisibility: 'Basic', tradeservVisibility: '—', referralBonus: '5%' },
  TRADE_SMART: { xpBonus: '1.5x', aiCredits: '100/mo', bonusMissions: '3/mo', advertisingCredits: '₹500', prioritySupport: false, marketplaceVisibility: 'Enhanced', tradeservVisibility: '—', referralBonus: '10%' },
  TRADE_PLUS: { xpBonus: '2x', aiCredits: '250/mo', bonusMissions: '5/mo', advertisingCredits: '₹1,000', prioritySupport: true, marketplaceVisibility: 'Featured', tradeservVisibility: 'Basic', referralBonus: '10%' },
  TRADE_PRO: { xpBonus: '2x', aiCredits: '500/mo', bonusMissions: '8/mo', advertisingCredits: '₹2,500', prioritySupport: true, marketplaceVisibility: 'Premium', tradeservVisibility: 'Enhanced', referralBonus: '15%' },
  TRADE_PREMIUM: { xpBonus: '3x', aiCredits: '1,000/mo', bonusMissions: '12/mo', advertisingCredits: '₹5,000', prioritySupport: true, marketplaceVisibility: 'Premium+', tradeservVisibility: 'Featured', referralBonus: '20%' },
  TRADE_ELITE: { xpBonus: '3x', aiCredits: '2,500/mo', bonusMissions: '20/mo', advertisingCredits: '₹10,000', prioritySupport: true, marketplaceVisibility: 'Elite', tradeservVisibility: 'Elite', referralBonus: '25%' },
  TRADBUY: { xpBonus: '1x', aiCredits: '50/mo', bonusMissions: '2/mo', advertisingCredits: '—', prioritySupport: false, marketplaceVisibility: 'Basic', tradeservVisibility: '—', referralBonus: '5%' },
};

interface MembershipBenefitsCardProps {
  subscription?: CurrentSubscription | null;
  loading?: boolean;
}

export function MembershipBenefitsCard({ subscription, loading }: MembershipBenefitsCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Crown className="h-4 w-4 text-accent-500" />
            Membership
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-3 w-40" />
        </CardContent>
      </Card>
    );
  }

  if (!subscription?.subscriptionPlan) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Crown className="h-4 w-4 text-accent-500" />
            Membership
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>No active plan</span>
          </div>
          <p className="mt-2 text-xs text-text-tertiary">Upgrade to unlock bonus XP and rewards.</p>
          <Link href="/plans" className="mt-3 block">
            <Button variant="outline" size="sm" className="w-full text-xs">View Plans</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const plan = subscription.subscriptionPlan;
  const label = PLAN_LABELS[plan] ?? plan;
  const color = PLAN_COLORS[plan] ?? 'text-text-primary';
  const benefits = PLAN_BENEFITS[plan] ?? PLAN_BENEFITS['TRADE_START'];
  const expires = subscription.subscriptionExpiresAt
    ? new Date(subscription.subscriptionExpiresAt).toLocaleDateString()
    : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Crown className="h-4 w-4 text-accent-500" />
          Membership
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-secondary">Plan</span>
          <Badge variant="outline" className={`${color} border-current/20 text-xs`}>{label}</Badge>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-secondary">XP Bonus</span>
          <span className={`flex items-center gap-1 font-medium ${color}`}><Zap className="h-3 w-3" />{benefits.xpBonus} Multiplier</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-secondary">AI Credits</span>
          <span className="flex items-center gap-1 text-cyan-400"><Sparkles className="h-3 w-3" />{benefits.aiCredits}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-secondary">Bonus Missions</span>
          <span className="flex items-center gap-1 text-green-400"><Gift className="h-3 w-3" />{benefits.bonusMissions}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-secondary">Advertising Credits</span>
          <span className={`flex items-center gap-1 ${benefits.advertisingCredits === '—' ? 'text-text-tertiary' : 'text-purple-400'}`}><TrendingUp className="h-3 w-3" />{benefits.advertisingCredits}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-secondary">Priority Support</span>
          <span className={`flex items-center gap-1 ${benefits.prioritySupport ? 'text-green-400' : 'text-text-tertiary'}`}><Shield className="h-3 w-3" />{benefits.prioritySupport ? 'Yes' : '—'}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-secondary">Marketplace Visibility</span>
          <span className="flex items-center gap-1 text-accent-500"><Star className="h-3 w-3" />{benefits.marketplaceVisibility}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-secondary">TradeServ Visibility</span>
          <span className={`flex items-center gap-1 ${benefits.tradeservVisibility === '—' ? 'text-text-tertiary' : 'text-blue-400'}`}><Star className="h-3 w-3" />{benefits.tradeservVisibility}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-secondary">Referral Bonus</span>
          <span className="flex items-center gap-1 text-green-400"><Gift className="h-3 w-3" />{benefits.referralBonus} per referral</span>
        </div>
        {expires && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-secondary">Renewal</span>
            <span className="flex items-center gap-1 text-text-secondary">
              <Clock className="h-3 w-3" />
              {expires}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-secondary">Status</span>
          <span className="flex items-center gap-1 text-status-success">
            <CheckCircle2 className="h-3 w-3" />
            {subscription.subscriptionStatus === 'ACTIVE' ? 'Active' : subscription.subscriptionStatus}
          </span>
        </div>
        <Link href="/pricing">
          <Button variant="outline" size="sm" className="mt-1 w-full text-xs text-accent-500 hover:text-accent-500/80">
            <Crown className="mr-1 h-3 w-3" /> Upgrade Plan
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
