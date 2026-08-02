'use client';

import { useState, useEffect } from 'react';
import { DashboardPageHeader, StatCard, StatusBadge, DashboardSkeleton } from '@/components/dashboard';
import { useNotifications } from '@/hooks';
import { useAuth } from '@/hooks/use-auth';
import { getSellerRecommendations, SellerRecommendationResult } from '@/lib/api/marketplace-intelligence';
import { useEcosystemDashboard } from '@/hooks/use-ecosystem';
import { XPProgressBar } from '@/components/ecosystem/xp-progress-bar';
import { PlatformIntegrationsCard, SELLER_INTEGRATIONS } from '@/components/ecosystem/platform-integrations-card';
import { TradeTalkDashboardWidget } from '@/components/tradetalk/dashboard-widget';
import { Package, FileText, PlusCircle, BarChart3, Trophy, Store, Users, Eye, Heart, ShoppingCart, Sparkles, Zap, ArrowRight, TrendingUp, Award, Gift, ChevronRight, type LucideIcon } from 'lucide-react';
import { SELLER_QUICK_ACTIONS } from '@/data/master-data';
import Link from 'next/link';
import api from '@/lib/api/client';
import { DashboardCopilot } from '@/components/seller-agent/dashboard-copilot';
import { usePageTracking } from '@/hooks/use-tracking';
import { TrackingEvent } from '@/lib/tracking/events';

const ICON_MAP: Record<string, LucideIcon> = {
  PlusCircle, FileText, BarChart3, Trophy,
  Package, Store, Users, Eye, Heart, ShoppingCart,
};

const STAT_ICONS = ['Package', 'Store', 'Users', 'ShoppingCart'];

const shimmer = 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent'

export default function SellerDashboardPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<SellerRecommendationResult[]>([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const { data: notifications, isLoading: notifsLoading } = useNotifications({ limit: 5 });
  const { data: ecoDashboard, isLoading: ecoLoading } = useEcosystemDashboard();

  useEffect(() => {
    if (!user?.id) return;
    setRecsLoading(true);
    getSellerRecommendations(user.id, 6)
      .then(setRecommendations)
      .catch((err) => console.error('Failed to load recommendations:', err))
      .finally(() => setRecsLoading(false));
  }, [user?.id]);

  useEffect(() => {
    api.get('/seller/analytics/overview')
      .then(res => setAnalytics(res.data?.data || res.data))
      .catch(() => { console.error('Analytics load failed'); })
      .finally(() => setAnalyticsLoading(false));
  }, []);

  usePageTracking(TrackingEvent.DASHBOARD_VISIT, { role: 'seller' });

  const isLoading = analyticsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
        <div
          className="pointer-events-none fixed inset-0"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(245, 158, 11, 0.08), transparent)' }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-8">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  const summaryStats = analytics ? [
    { label: 'Total Products', value: String(analytics.totalProducts || 0), icon: 'Package' },
    { label: 'Active Products', value: String(analytics.activeProducts || 0), icon: 'Store' },
    { label: 'Total Views', value: String(analytics.totalViews || 0), icon: 'Eye' },
    { label: 'Total Orders', value: String(analytics.totalOrders || 0), icon: 'ShoppingCart' },
  ] : [
    { label: 'Total Products', value: '0', icon: 'Package' },
    { label: 'Active Products', value: '0', icon: 'Store' },
    { label: 'Total Views', value: '0', icon: 'Eye' },
    { label: 'Total Orders', value: '0', icon: 'ShoppingCart' },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <div
        className="pointer-events-none fixed inset-0"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(245, 158, 11, 0.08), transparent)' }}
      />
      <div className="relative mx-auto max-w-7xl px-4 py-8">
        <div className="space-y-6">
          <DashboardPageHeader
            title="Seller Dashboard"
            description="Welcome back! Here's your business overview."
          />

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {summaryStats.map((stat) => (
              <StatCard key={stat.label} icon={ICON_MAP[stat.icon]} label={stat.label} value={stat.value} />
            ))}
          </div>

          <div className="glass-card-xl p-6  transition-all duration-300 hover:border-orange-500/20 hover:shadow-[0_0_30px_-5px_rgba(245, 158, 11, 0.15)]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Seller Recommendations</h2>
                <p className="mt-1 text-sm text-white/60">Growth opportunities powered by AI</p>
              </div>
              <Sparkles className="h-5 w-5 text-orange-400" />
            </div>
            <div className="mt-4">
              {recsLoading ? (
                <div className="flex h-20 items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-400 border-t-transparent" />
                </div>
              ) : recommendations.length === 0 ? (
                <p className="text-sm text-white/50">No recommendations yet. List more products to get started.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {recommendations.slice(0, 6).map((rec, i) => (
                    <div key={`${rec.type}-${i}`} className="group surface-card-lg p-3 backdrop-blur-md transition-all duration-200 hover:border-orange-500/30 hover:bg-orange-500/10">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-accent-500/70">{rec.type.replace(/_/g, ' ')}</span>
                        <span className="text-xs font-semibold text-white/60">{rec.score}/100</span>
                      </div>
                      <p className="mt-1.5 text-sm font-medium text-white group-hover:text-accent-500">{(rec.item as any).name ?? (rec.item as any).categoryName ?? 'Unknown'}</p>
                      <p className="mt-1 text-xs text-white/50 line-clamp-2">{rec.reason}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {ecoDashboard && !ecoLoading && (
            <div className="rounded-3xl border border-border bg-gradient-to-r from-orange-500/5 to-transparent p-6 backdrop-blur-xl transition-all duration-300 hover:border-orange-500/20 hover:shadow-[0_0_30px_-5px_rgba(245, 158, 11, 0.15)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orange-400" />
                  <h2 className="text-lg font-semibold text-white">Seller Ecosystem</h2>
                </div>
                <Link href="/seller/ecosystem" className="flex items-center gap-1 text-sm font-medium text-accent-500 transition-colors hover:text-accent-500">
                  View All <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-4 grid gap-6 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-white/50">Level</p>
                  <p className="text-lg font-bold text-white">{ecoDashboard.level.name}</p>
                  <XPProgressBar current={ecoDashboard.totalXp} target={ecoDashboard.nextLevelXp} size="sm" showLabel={false} className="mt-2" />
                </div>
                <div>
                  <p className="text-xs text-white/50">XP & Badges</p>
                  <p className="text-lg font-bold text-accent-500">{ecoDashboard.totalXp.toLocaleString()} XP</p>
                  <p className="mt-1 text-[10px] text-white/40">{ecoDashboard.badges} badges &middot; {ecoDashboard.completedMissions} missions</p>
                </div>
                <div>
                  <p className="text-xs text-white/50">Daily Streak</p>
                  <p className="text-lg font-bold text-purple-400">{ecoDashboard.currentStreak} days</p>
                  <p className="mt-1 text-[10px] text-white/40">{ecoDashboard.checkedInToday ? 'Checked in today' : 'Check in to start streak'}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-border pt-4">
                <div className="flex items-center gap-1.5 text-xs">
                  <Zap className="h-3 w-3 text-amber-400" />
                  <span className="text-white/50">Today XP:</span>
                  <span className="font-medium text-accent-500">+{ecoDashboard.todayXp}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <Award className="h-3 w-3 text-emerald-400" />
                  <span className="text-white/50">Rewards:</span>
                  <span className="font-medium text-emerald-400">{ecoDashboard.todayRewards}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <Sparkles className="h-3 w-3 text-purple-400" />
                  <span className="text-white/50">Next:</span>
                  <span className="font-medium text-white">{ecoDashboard.recommendedAction}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <TrendingUp className="h-3 w-3 text-blue-400" />
                  <span className="text-white/50">{ecoDashboard.businessImpact}</span>
                </div>
              </div>
            </div>
          )}

          <TradeTalkDashboardWidget />

          <PlatformIntegrationsCard links={SELLER_INTEGRATIONS} title="Earn XP" />

          <Link href="/seller/referrals" className="block">
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
            <div className="glass-card-xl p-6  transition-all duration-300 hover:border-orange-500/20 hover:shadow-[0_0_30px_-5px_rgba(245, 158, 11, 0.15)]">
              <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
              <p className="mt-1 text-sm text-white/60">Common tasks to manage your store</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {SELLER_QUICK_ACTIONS.map((action) => {
                  const Icon = ICON_MAP[action.icon];
                  return (
                    <Link key={action.label} href={action.href}>
                      <div className="flex w-full items-center justify-center gap-2 surface-card-lg px-4 py-2.5 text-sm font-medium text-white backdrop-blur-md transition-all duration-200 hover:border-orange-500/30 hover:bg-orange-500/10 hover:text-accent-500">
                        <Icon className="h-4 w-4" />
                        {action.label}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="glass-card-xl p-6  transition-all duration-300 hover:border-orange-500/20 hover:shadow-[0_0_30px_-5px_rgba(245, 158, 11, 0.15)]">
              <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
              <p className="mt-1 text-sm text-white/60">Latest updates from your store</p>
              <div className="mt-4 space-y-4">
                {notifsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={`h-16 rounded-2xl bg-surface ${shimmer}`} />
                  ))
                ) : notifications?.data?.length ? (
                  notifications.data.map((notif) => (
                    <div key={notif.id} className="flex items-center justify-between gap-4 surface-card-lg p-4 backdrop-blur-md transition-all duration-200 hover:border-orange-500/10 hover:bg-surface-secondary">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-text-primary">{notif.title}</p>
                        <p className="text-xs text-text-tertiary">{notif.message}</p>
                        <p className="mt-0.5 text-xs text-text-tertiary">{new Date(notif.createdAt).toLocaleDateString()}</p>
                      </div>
                      <StatusBadge status={notif.read ? 'completed' : 'pending'} />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-text-tertiary">No recent activity</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <DashboardCopilot />
    </div>
  );
}
