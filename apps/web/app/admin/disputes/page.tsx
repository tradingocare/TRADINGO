'use client';

import { DashboardPageHeader, StatusBadge, TableSkeleton } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { useDisputes } from '@/hooks';
import { Alert } from '@/components/ui/alert';
import { EmptyState } from '@/components/ui/empty-state';
import { Scale, MessageSquare } from 'lucide-react';
import type { Dispute } from '@/lib/api/types';

export default function AdminDisputesPage() {
  const { data, isLoading, error } = useDisputes();
  const disputes = data?.data ?? [];

  if (error) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Disputes" description="Resolve trading disputes" />
        <Alert variant="error" title="Failed to load disputes">{error.message}</Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Disputes" description="Resolve trading disputes" />
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Disputes"
        description="Resolve trading disputes"
      />

      {disputes.length === 0 ? (
        <EmptyState icon={Scale} title="No disputes found" description="All trades are running smoothly with no disputes raised." />
      ) : (
        <div className="space-y-4">
          {disputes.map((dispute: Dispute) => (
            <div
              key={dispute.id}
              className="rounded-xl border border-border bg-surface p-5 shadow-sm dark:bg-dark-surface dark:border-dark-border"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                    <Scale className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">{dispute.id}</p>
                      <StatusBadge status={dispute.status === 'under_review' ? 'pending' : dispute.status} />
                    </div>
                    <p className="mt-1 text-sm text-text-primary dark:text-dark-text-primary">{dispute.reason}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary dark:text-dark-text-secondary">
                      <span>Raised by: <span className="font-medium text-text-primary dark:text-dark-text-primary">{dispute.raisedById.slice(0, 8)}...</span></span>
                      <span>Order: <span className="font-medium text-text-primary dark:text-dark-text-primary">{dispute.orderId.slice(0, 8)}...</span></span>
                      <span>{new Date(dispute.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                  Review
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
