'use client';

import { DashboardPageHeader, StatCard, StatusBadge, DashboardSkeleton } from '@/components/dashboard';
import { useProducts, useRfqs, useOrders, useGocashBalance, useNotifications } from '@/hooks';
import { Package, FileText, PlusCircle, BarChart3, Trophy, Store, Users, DollarSign, type LucideIcon } from 'lucide-react';
import { SELLER_QUICK_ACTIONS, TRADING_STATS } from '@/data/master-data';
import Link from 'next/link';

const ICON_MAP: Record<string, LucideIcon> = {
  PlusCircle, FileText, BarChart3, Trophy,
  Package, Store, Users, DollarSign,
};

const shimmer = 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent'

export default function SellerDashboardPage() {
  const { isLoading: productsLoading } = useProducts({ limit: 1 });
  const { isLoading: rfqsLoading } = useRfqs({ limit: 1 });
  const { isLoading: ordersLoading } = useOrders({ limit: 1 });
  const { isLoading: balanceLoading } = useGocashBalance();
  const { data: notifications, isLoading: notifsLoading } = useNotifications({ limit: 5 });

  const isLoading = productsLoading || rfqsLoading || ordersLoading || balanceLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ background: '#1D0001' }}>
        <div
          className="pointer-events-none fixed inset-0"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(255,77,0,0.08), transparent)' }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-8">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#1D0001' }}>
      <div
        className="pointer-events-none fixed inset-0"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(255,77,0,0.08), transparent)' }}
      />
      <div className="relative mx-auto max-w-7xl px-4 py-8">
        <div className="space-y-6">
          <DashboardPageHeader
            title="Seller Dashboard"
            description="Welcome back! Here's your business overview."
          />

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TRADING_STATS.map((stat) => (
              <StatCard key={stat.label} icon={ICON_MAP[stat.icon]} label={stat.label} value={stat.value} />
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/[0.06] bg-white/[0.04] p-6 backdrop-blur-xl transition-all duration-300 hover:border-orange-500/20 hover:shadow-[0_0_30px_-5px_rgba(255,77,0,0.15)]">
              <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
              <p className="mt-1 text-sm text-white/60">Common tasks to manage your store</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {SELLER_QUICK_ACTIONS.map((action) => {
                  const Icon = ICON_MAP[action.icon];
                  return (
                    <Link key={action.label} href={action.href}>
                      <div className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white/80 backdrop-blur-md transition-all duration-200 hover:border-orange-500/30 hover:bg-orange-500/10 hover:text-[#FF4D00]">
                        <Icon className="h-4 w-4" />
                        {action.label}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-white/[0.06] bg-white/[0.04] p-6 backdrop-blur-xl transition-all duration-300 hover:border-orange-500/20 hover:shadow-[0_0_30px_-5px_rgba(255,77,0,0.15)]">
              <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
              <p className="mt-1 text-sm text-white/60">Latest updates from your store</p>
              <div className="mt-4 space-y-4">
                {notifsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={`h-16 rounded-2xl bg-white/[0.04] ${shimmer}`} />
                  ))
                ) : notifications?.data?.length ? (
                  notifications.data.map((notif) => (
                    <div key={notif.id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.04] p-4 backdrop-blur-md transition-all duration-200 hover:border-orange-500/10 hover:bg-white/[0.06]">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white">{notif.title}</p>
                        <p className="text-xs text-white/50">{notif.message}</p>
                        <p className="mt-0.5 text-xs text-white/40">{new Date(notif.createdAt).toLocaleDateString()}</p>
                      </div>
                      <StatusBadge status={notif.read ? 'completed' : 'pending'} />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-white/50">No recent activity</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
