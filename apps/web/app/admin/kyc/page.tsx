'use client';

import { DashboardPageHeader, StatusBadge, TableSkeleton } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { useKycSubmissions } from '@/hooks';
import { ShieldCheck, Eye, AlertCircle } from 'lucide-react';
import type { KYCSubmission } from '@/lib/api/types';

export default function AdminKycPage() {
  const { data, isLoading, error } = useKycSubmissions();
  const kycList = data?.data ?? [];

  if (error) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="KYC Reviews" description="Verify user identities and documents" />
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12 dark:bg-dark-surface dark:border-dark-border">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="mt-4 text-lg font-medium text-text-primary dark:text-dark-text-primary">Failed to load KYC submissions</p>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">{error.message}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="KYC Reviews" description="Verify user identities and documents" />
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="KYC Reviews"
        description="Verify user identities and documents"
      />

      {kycList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12 dark:bg-dark-surface dark:border-dark-border">
          <ShieldCheck className="h-12 w-12 text-text-tertiary" />
          <p className="mt-4 text-lg font-medium text-text-primary dark:text-dark-text-primary">No KYC submissions found</p>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">KYC submissions from users will appear here for verification.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface dark:bg-dark-surface dark:border-dark-border">
          <div className="hidden grid-cols-12 gap-4 border-b border-border px-6 py-3 text-xs font-medium uppercase text-text-secondary dark:border-dark-border dark:text-dark-text-secondary sm:grid">
            <div className="col-span-3">Company</div>
            <div className="col-span-3">Document Type</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Submitted</div>
            <div className="col-span-2">Action</div>
          </div>
          {kycList.map((item: KYCSubmission) => (
            <div
              key={item.id}
              className="grid grid-cols-1 gap-3 border-b border-border px-6 py-4 last:border-0 sm:grid-cols-12 sm:items-center dark:border-dark-border"
            >
              <div className="flex items-center gap-3 sm:col-span-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">{item.companyName ?? item.companyId.slice(0, 8)}</p>
              </div>
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary sm:col-span-3">{item.documentType}</p>
              <div className="sm:col-span-2">
                <StatusBadge status={item.status} />
              </div>
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary sm:col-span-2">{new Date(item.submittedAt).toLocaleDateString('en-IN')}</p>
              <div className="sm:col-span-2">
                <Button variant="outline" size="sm">
                  <Eye className="mr-1.5 h-3.5 w-3.5" />
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
