'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardPageHeader, StatCard, StatusBadge, DashboardSkeleton } from '@/components/dashboard';
import { useRfqs, useQuotes, useOrders, useBuyerDashboard } from '@/hooks';
import { useBuyerWalletSummary } from '@/hooks/use-wallet';
import { useAuth } from '@/hooks/use-auth';
import { getBuyerRecommendations, BuyerRecommendationResult } from '@/lib/api/marketplace-intelligence';
import { useEcosystemDashboard, useCheckin } from '@/hooks/use-ecosystem';
import { usePageTracking } from '@/hooks/use-tracking';
import { TrackingEvent } from '@/lib/tracking/events';
import { DailyCheckinCard } from '@/components/ecosystem/daily-checkin-card';
import { XPProgressBar } from '@/components/ecosystem/xp-progress-bar';
import { PlatformIntegrationsCard, BUYER_INTEGRATIONS } from '@/components/ecosystem/platform-integrations-card';
import { TradeTalkDashboardWidget } from '@/components/tradetalk/dashboard-widget';
import { BuyerDashboardCopilot } from '@/components/buyer-agent/dashboard-copilot';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { FileText, Quote, ShoppingCart, Award, ArrowRight, Heart, Store, Bell, ClipboardList, Sparkles, Zap, Flame, TrendingUp, Gift, ChevronRight, type LucideIcon } from 'lucide-react';
import { BUYER_QUICK_ACTIONS } from '@/data/master-data';

const ICON_MAP: Record<string, LucideIcon> = {
  FileText, Quote, ShoppingCart, Award, Search: FileText, Heart, GitCompare: ClipboardList,
};

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export default function BuyerDashboardPage() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<BuyerRecommendationResult[]>([]);
  const [recsLoading, setRecsLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    setRecsLoading(true);
    getBuyerRecommendations(user.id, user.id, 6)
      .then(setRecommendations)
      .catch(() => { toast({ title: 'Error', description: 'Failed to load recommendations', variant: 'destructive' }) })
      .finally(() => setRecsLoading(false));
  }, [user?.id]);

  usePageTracking(TrackingEvent.DASHBOARD_VISIT, { role: 'buyer' });

  const { data: rfqsData, isLoading: rfqsLoading } = useRfqs({ limit: 5 });
  const { data: quotesData, isLoading: quotesLoading } = useQuotes({ limit: 1 });
  const { data: ordersData, isLoading: ordersLoading } = useOrders({ limit: 1 });
  const { data: balanceData, isLoading: balanceLoading } = useBuyerWalletSummary();
  const { data: dashboardData, isLoading: dashLoading } = useBuyerDashboard();
  const { data: ecoDashboard, isLoading: ecoLoading } = useEcosystemDashboard();
  const checkin = useCheckin();

  if (rfqsLoading || quotesLoading || ordersLoading || balanceLoading || dashLoading) {
    return (
      <div className="min-h-screen bg-bg-base">
      <div className="pointer-events-none fixed inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -20%, color-mix(in srgb, var(--accent) 8%, transparent), transparent)' }} />
      <div className="relative mx-auto max-w-7xl px-4 py-8"><DashboardSkeleton /></div>
      </div>
    );
  }

  const activeRfqs = rfqsData?.total ?? 0;
  const quotesReceived = quotesData?.total ?? 0;
  const ordersInProgress = ordersData?.total ?? 0;
  const gocashBalance = balanceData?.balance ?? 0;
  const recentRfqs = rfqsData?.data ?? [];
  const stats = dashboardData?.stats ?? {};

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="pointer-events-none fixed inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -20%, color-mix(in srgb, var(--accent) 8%, transparent), transparent)' }} />
      <div className="relative mx-auto max-w-7xl px-4 py-8">
        <div className="space-y-6">
          <DashboardPageHeader title="Buyer Dashboard" description="Track your procurement activity" />

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={FileText} label="Active RFQs" value={String(activeRfqs)} change="Total" changeType="neutral" />
            <StatCard icon={Quote} label="Quotes Received" value={String(quotesReceived)} change="Total" changeType="neutral" />
            <StatCard icon={ShoppingCart} label="Orders in Progress" value={String(ordersInProgress)} change="Total" changeType="neutral" />
            <StatCard icon={Award} label="GOCASH" value={formatINR(gocashBalance)} change="Balance" changeType="neutral" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Heart} label="Saved Products" value={String(stats.savedProducts ?? 0)} change="" changeType="neutral" />
            <StatCard icon={Store} label="Saved Suppliers" value={String(stats.savedSuppliers ?? 0)} change="" changeType="neutral" />
            <StatCard icon={Bell} label="Unread Notifs" value={String(stats.unreadNotifications ?? 0)} change="" changeType="neutral" />
            <StatCard icon={ClipboardList} label="Downloads" value={String(stats.downloads ?? 0)} change="" changeType="neutral" />
          </div>

          <div className="rounded-3xl border border-border/5 bg-surface/20 p-6 backdrop-blur-xl transition-all duration-300 hover:border-accent/20 hover:shadow-lg hover:shadow-accent/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Recommended for You</h2>
                <p className="mt-1 text-sm text-text-tertiary">AI-powered marketplace suggestions</p>
              </div>
              <Sparkles className="h-5 w-5 text-accent" />
            </div>
            <div className="mt-4">
              {recsLoading ? (
                <div className="flex h-20 items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                </div>
              ) : recommendations.length === 0 ? (
                <p className="text-sm text-text-tertiary">No recommendations yet. Start exploring products and suppliers.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {recommendations.slice(0, 6).map((rec, i) => (
                    <Link
                      key={`${rec.type}-${i}`}
                      href={rec.type === 'supplier' ? `/seller/${(rec.item as any).slug}` : rec.type === 'product' ? `/product/${(rec.item as any).slug}` : rec.type === 'category' ? `/search?category=${(rec.item as any).slug}` : '#'}
                      className="group rounded-2xl border border-border/5 bg-surface/20 p-3 backdrop-blur-md transition-all duration-200 hover:border-accent/30 hover:bg-accent/10"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-accent/70">{rec.type.replace('_', ' ')}</span>
                        <span className="text-xs font-semibold text-text-tertiary">{rec.score}/100</span>
                      </div>
                      <p className="mt-1.5 text-sm font-medium text-text-primary group-hover:text-accent">{(rec.item as any).name ?? rec.item?.productName ?? 'Unknown'}</p>
                      <p className="mt-1 text-xs text-text-tertiary line-clamp-2">{rec.reason}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {ecoDashboard && !ecoLoading && (
            <div className="rounded-3xl border border-border/5 bg-gradient-to-r from-accent/5 to-transparent p-6 backdrop-blur-xl transition-all duration-300 hover:border-accent/20 hover:shadow-lg hover:shadow-accent/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-accent" />
                  <h2 className="text-lg font-semibold text-text-primary">Ecosystem</h2>
                </div>
                <Link href="/buyer/ecosystem" className="flex items-center gap-1 text-sm font-medium text-accent transition-colors hover:text-accent">
                  View All <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs text-text-tertiary">Current Level</p>
                  <p className="text-lg font-bold text-text-primary">{ecoDashboard.level.name}</p>
                  <XPProgressBar current={ecoDashboard.totalXp} target={ecoDashboard.nextLevelXp} size="sm" showLabel={false} className="mt-2" />
                </div>
                <div>
                  <p className="text-xs text-text-tertiary">Total XP</p>
                  <p className="text-lg font-bold text-accent">{ecoDashboard.totalXp.toLocaleString()}</p>
                  <p className="mt-1 text-[10px] text-text-tertiary">{ecoDashboard.completedMissions} missions completed</p>
                </div>
                <div>
                  <p className="text-xs text-text-tertiary">Badges Earned</p>
                  <p className="text-lg font-bold text-accent">{ecoDashboard.badges}</p>
                  <p className="mt-1 text-[10px] text-text-tertiary">{ecoDashboard.achievements} achievements</p>
                </div>
                <div className="flex flex-col items-end justify-center">
                  <Button
                    variant={ecoDashboard.checkedInToday ? 'outline' : 'default'}
                    size="sm"
                    className={ecoDashboard.checkedInToday ? 'border-status-success/30 text-status-success' : 'bg-gradient-to-r from-accent to-accent/80 text-white'}
                    disabled={ecoDashboard.checkedInToday || checkin.isPending}
                    onClick={() => checkin.mutate(undefined, {
                      onSuccess: (data) => toast({ title: data.bonusEarned ? 'Streak bonus!' : 'Checked in!', description: `Day ${data.streakCount}` }),
                      onError: () => toast({ title: 'Check-in failed', variant: 'destructive' }),
                    })}
                  >
                    <Flame className="mr-1 h-3 w-3" />
                    {ecoDashboard.checkedInToday ? 'Checked In' : 'Check In'}
                    {ecoDashboard.currentStreak > 0 && <span className="ml-1 text-[10px] opacity-70">({ecoDashboard.currentStreak}d)</span>}
                  </Button>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-4 border-t-border pt-4">
                <div className="flex items-center gap-1.5 text-xs">
                  <Zap className="h-3 w-3 text-accent" />
                  <span className="text-text-tertiary">Today XP:</span>
                  <span className="font-medium text-accent">+{ecoDashboard.todayXp}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <Award className="h-3 w-3 text-status-success" />
                  <span className="text-text-tertiary">Rewards:</span>
                  <span className="font-medium text-status-success">{ecoDashboard.todayRewards}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <Sparkles className="h-3 w-3 text-accent" />
                  <span className="text-text-tertiary">Next:</span>
                  <span className="font-medium text-text-primary">{ecoDashboard.recommendedAction}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <TrendingUp className="h-3 w-3 text-status-info" />
                  <span className="text-text-tertiary">{ecoDashboard.businessImpact}</span>
                </div>
              </div>
            </div>
          )}

          <TradeTalkDashboardWidget />

          <PlatformIntegrationsCard links={BUYER_INTEGRATIONS} title="Earn XP" />

          <Link href="/buyer/referrals" className="block">
            <div className="group relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 to-emerald-500/[0.02] p-5 transition-all duration-300 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/10">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20">
                  <Gift className="h-6 w-6 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-text-primary group-hover:text-emerald-400 transition-colors">Refer & Earn Rewards</h3>
                  <p className="mt-0.5 text-xs text-text-secondary">Invite other businesses to TRADINGO and earn GOCASH for every successful referral.</p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-text-tertiary group-hover:text-emerald-400 transition-colors" />
              </div>
            </div>
          </Link>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-border/5 bg-surface/20 p-6 backdrop-blur-xl transition-all duration-300 hover:border-accent/20 hover:shadow-lg hover:shadow-accent/10">
              <h2 className="text-lg font-semibold text-text-primary">Quick Actions</h2>
              <p className="mt-1 text-sm text-text-tertiary">Common procurement tasks</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {BUYER_QUICK_ACTIONS.map((action) => {
                  const Icon = ICON_MAP[action.icon];
                  return (
                    <Link key={action.label} href={action.href}>
                      <div className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border/5 bg-surface/20 px-4 py-2.5 text-sm font-medium text-text-primary backdrop-blur-md transition-all duration-200 hover:border-accent/30 hover:bg-accent/10 hover:text-accent">
                        {Icon && <Icon className="h-4 w-4" />}
                        {action.label}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-border/5 bg-surface/20 p-6 backdrop-blur-xl transition-all duration-300 hover:border-accent/20 hover:shadow-lg hover:shadow-accent/10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">Recent Activity</h2>
                  <p className="mt-1 text-sm text-text-tertiary">Latest updates</p>
                </div>
              </div>
              <div className="mt-4 space-y-4">
                {(dashboardData?.recentActivity ?? []).length ? (
                  dashboardData.recentActivity.map((notif: any) => (
                    <div key={notif.id} className="flex items-center justify-between gap-4 rounded-2xl border border-border/5 bg-surface/20 p-4 backdrop-blur-md transition-all duration-200 hover:border-accent/10 hover:bg-surface/30">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-text-primary">{notif.title}</p>
                        <p className="text-xs text-text-tertiary">{notif.body}</p>
                        <p className="mt-0.5 text-xs text-text-tertiary">{new Date(notif.createdAt).toLocaleDateString()}</p>
                      </div>
                      <StatusBadge status={notif.readAt ? 'completed' : 'pending'} />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-text-tertiary">No recent activity</p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border/5 bg-surface/20 p-6 backdrop-blur-xl transition-all duration-300 hover:border-accent/20 hover:shadow-lg hover:shadow-accent/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Recent RFQs</h2>
                <p className="mt-1 text-sm text-text-tertiary">Your latest requests for quotes</p>
              </div>
              <Link href="/buyer/rfqs" className="flex items-center gap-1 text-sm font-medium text-accent transition-colors hover:text-accent">
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {recentRfqs.length === 0 ? (
              <div className="mt-6 text-center">
                <p className="text-sm text-text-tertiary mb-3">No RFQs yet. Create your first RFQ to start buying.</p>
                <Link href="/rfq" className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-br from-accent to-accent/80 shadow-lg shadow-accent/20 transition-all hover:opacity-90">
                  <FileText className="h-4 w-4" /> Create RFQ
                </Link>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {recentRfqs.map((rfq: any) => (
                  <div key={rfq.id} className="flex items-center justify-between gap-4 rounded-2xl border border-border/5 bg-surface/20 p-4 backdrop-blur-md transition-all duration-200 hover:border-accent/10 hover:bg-surface/30">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text-primary">{rfq.productName}</p>
                      <p className="mt-0.5 text-xs text-text-tertiary">
                        {rfq.quantity} {rfq.unit} &middot; {rfq.responseCount ?? 'N/A'} responses &middot; {new Date(rfq.createdAt).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <StatusBadge status={rfq.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <BuyerDashboardCopilot />
    </div>
  );
}
