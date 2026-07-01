'use client';

import Link from 'next/link';
import { DashboardPageHeader, StatCard, StatusBadge, DashboardSkeleton } from '@/components/dashboard';
import { useRfqs, useQuotes, useOrders, useBuyerDashboard } from '@/hooks';
import { useBuyerWalletSummary } from '@/hooks/use-wallet';
import { FileText, Quote, ShoppingCart, Award, ArrowRight, Heart, Store, Bell, ClipboardList, type LucideIcon } from 'lucide-react';
import { BUYER_QUICK_ACTIONS } from '@/data/master-data';

const ICON_MAP: Record<string, LucideIcon> = {
  FileText, Quote, ShoppingCart, Award, Search: FileText, Heart, GitCompare: ClipboardList,
};

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export default function BuyerDashboardPage() {
  const { data: rfqsData, isLoading: rfqsLoading } = useRfqs({ limit: 5 });
  const { data: quotesData, isLoading: quotesLoading } = useQuotes({ limit: 1 });
  const { data: ordersData, isLoading: ordersLoading } = useOrders({ limit: 1 });
  const { data: balanceData, isLoading: balanceLoading } = useBuyerWalletSummary();
  const { data: dashboardData, isLoading: dashLoading } = useBuyerDashboard();

  if (rfqsLoading || quotesLoading || ordersLoading || balanceLoading || dashLoading) {
    return (
      <div className="min-h-screen" style={{ background: '#1D0001' }}>
        <div className="pointer-events-none fixed inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(255,77,0,0.08), transparent)' }} />
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
    <div className="min-h-screen" style={{ background: '#1D0001' }}>
      <div className="pointer-events-none fixed inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(255,77,0,0.08), transparent)' }} />
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

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/[0.06] bg-white/[0.04] p-6 backdrop-blur-xl transition-all duration-300 hover:border-orange-500/20 hover:shadow-[0_0_30px_-5px_rgba(255,77,0,0.15)]">
              <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
              <p className="mt-1 text-sm text-white/60">Common procurement tasks</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {BUYER_QUICK_ACTIONS.map((action) => {
                  const Icon = ICON_MAP[action.icon];
                  return (
                    <Link key={action.label} href={action.href}>
                      <div className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white/80 backdrop-blur-md transition-all duration-200 hover:border-orange-500/30 hover:bg-orange-500/10 hover:text-[#FF4D00]">
                        {Icon && <Icon className="h-4 w-4" />}
                        {action.label}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-white/[0.06] bg-white/[0.04] p-6 backdrop-blur-xl transition-all duration-300 hover:border-orange-500/20 hover:shadow-[0_0_30px_-5px_rgba(255,77,0,0.15)]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
                  <p className="mt-1 text-sm text-white/60">Latest updates</p>
                </div>
              </div>
              <div className="mt-4 space-y-4">
                {(dashboardData?.recentActivity ?? []).length ? (
                  dashboardData.recentActivity.map((notif: any) => (
                    <div key={notif.id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.04] p-4 backdrop-blur-md transition-all duration-200 hover:border-orange-500/10 hover:bg-white/[0.06]">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white">{notif.title}</p>
                        <p className="text-xs text-white/50">{notif.body}</p>
                        <p className="mt-0.5 text-xs text-white/40">{new Date(notif.createdAt).toLocaleDateString()}</p>
                      </div>
                      <StatusBadge status={notif.readAt ? 'completed' : 'pending'} />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-white/50">No recent activity</p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/[0.06] bg-white/[0.04] p-6 backdrop-blur-xl transition-all duration-300 hover:border-orange-500/20 hover:shadow-[0_0_30px_-5px_rgba(255,77,0,0.15)]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Recent RFQs</h2>
                <p className="mt-1 text-sm text-white/60">Your latest requests for quotes</p>
              </div>
              <Link href="/buyer/rfqs" className="flex items-center gap-1 text-sm font-medium text-[#FF4D00] transition-colors hover:text-orange-400">
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {recentRfqs.length === 0 ? (
              <div className="mt-6 text-center">
                <p className="text-sm text-white/50 mb-3">No RFQs yet. Create your first RFQ to start buying.</p>
                <Link href="/rfq" className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #FF4D00, #FF7A3D)', boxShadow: '0 4px 16px rgba(255,77,0,0.3)' }}>
                  <FileText className="h-4 w-4" /> Create RFQ
                </Link>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {recentRfqs.map((rfq: any) => (
                  <div key={rfq.id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.04] p-4 backdrop-blur-md transition-all duration-200 hover:border-orange-500/10 hover:bg-white/[0.06]">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white">{rfq.productName}</p>
                      <p className="mt-0.5 text-xs text-white/50">
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
    </div>
  );
}
