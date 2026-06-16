'use client';

import { DashboardPageHeader, StatCard, StatusBadge, StatCardSkeleton, TableSkeleton } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGocashBalance, useGocashHistory } from '@/hooks';
import { Award, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { GocashEntry } from '@/lib/api/types';

export default function SellerGocashPage() {
  const { data: balance, isLoading: balanceLoading } = useGocashBalance();
  const { data: history, isLoading: historyLoading, error } = useGocashHistory();

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="GOCASH Rewards"
        description="Your earnings and rewards"
      />

      {balanceLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Award} label="GOCASH Balance" value={`₹${(balance?.balance ?? 0).toLocaleString('en-IN')}`} change="Available" changeType="positive" />
          <StatCard icon={ArrowUpRight} label="Total Earned" value={`₹${(history?.data ?? []).filter((e: GocashEntry) => e.type === 'earned').reduce((s: number, e: GocashEntry) => s + e.amount, 0).toLocaleString('en-IN')}`} change="Lifetime" changeType="neutral" />
          <StatCard icon={ArrowDownRight} label="Total Spent" value={`₹${(history?.data ?? []).filter((e: GocashEntry) => e.type === 'spent').reduce((s: number, e: GocashEntry) => s + e.amount, 0).toLocaleString('en-IN')}`} change="All time" changeType="neutral" />
          <StatCard icon={Award} label="Transactions" value={String(history?.total ?? 0)} change="Total entries" changeType="neutral" />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Rewards History</CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <TableSkeleton />
          ) : error ? (
            <p className="text-sm text-text-secondary dark:text-dark-text-secondary">Failed to load history.</p>
          ) : !history?.data?.length ? (
            <p className="text-sm text-text-secondary dark:text-dark-text-secondary">No rewards history yet.</p>
          ) : (
            <div className="space-y-4">
              {history.data.map((item: GocashEntry) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border border-border bg-surface-secondary/50 p-4 dark:border-dark-border dark:bg-dark-surface-secondary/50">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">{item.description}</p>
                    <p className="mt-0.5 text-xs text-text-secondary dark:text-dark-text-secondary">{new Date(item.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-semibold ${item.type === 'earned' ? 'text-accent-600 dark:text-accent-400' : 'text-red-600 dark:text-red-400'}`}>
                      {item.type === 'earned' ? '+' : '-'}₹{item.amount.toLocaleString('en-IN')}
                    </span>
                    <StatusBadge status={item.type === 'earned' ? 'completed' : 'cancelled'} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
