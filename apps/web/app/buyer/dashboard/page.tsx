'use client';

import { DashboardPageHeader, StatCard, StatusBadge, DashboardSkeleton } from '@/components/dashboard';
import { useRfqs, useQuotes, useOrders, useGocashBalance } from '@/hooks';
import { FileText, Quote, ShoppingCart, Award, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export default function BuyerDashboardPage() {
  const { data: rfqsData, isLoading: rfqsLoading } = useRfqs({ limit: 5 });
  const { data: quotesData, isLoading: quotesLoading } = useQuotes({ limit: 1 });
  const { data: ordersData, isLoading: ordersLoading } = useOrders({ limit: 1 });
  const { data: balanceData, isLoading: balanceLoading } = useGocashBalance();

  if (rfqsLoading || quotesLoading || ordersLoading || balanceLoading) {
    return <DashboardSkeleton />;
  }

  const activeRfqs = rfqsData?.total ?? 0;
  const quotesReceived = quotesData?.total ?? 0;
  const ordersInProgress = ordersData?.total ?? 0;
  const gocashBalance = balanceData?.balance ?? 0;
  const recentRfqs = rfqsData?.data ?? [];

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Buyer Dashboard"
        description="Track your procurement activity"
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FileText} label="Active RFQs" value={String(activeRfqs)} change="Total" changeType="neutral" />
        <StatCard icon={Quote} label="Quotes Received" value={String(quotesReceived)} change="Total" changeType="neutral" />
        <StatCard icon={ShoppingCart} label="Orders in Progress" value={String(ordersInProgress)} change="Total" changeType="neutral" />
        <StatCard icon={Award} label="GOCASH" value={formatINR(gocashBalance)} change="Balance" changeType="neutral" />
      </div>

      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm dark:bg-dark-surface dark:border-dark-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">Recent RFQs</h2>
            <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">Your latest requests for quotes</p>
          </div>
          <Link
            href="/buyer/rfqs"
            className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {recentRfqs.length === 0 ? (
          <p className="mt-4 text-sm text-text-secondary dark:text-dark-text-secondary">No RFQs found.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {recentRfqs.map((rfq) => (
              <div
                key={rfq.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface-secondary/50 p-3 dark:border-dark-border dark:bg-dark-surface-secondary/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">{rfq.productName}</p>
                  <p className="text-xs text-text-secondary dark:text-dark-text-secondary">
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
  );
}
