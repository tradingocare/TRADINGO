'use client';

import { DashboardPageHeader, StatusBadge, TableSkeleton } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { useKycSubmissions, useReviewKyc } from '@/hooks';
import { ShieldCheck, Eye, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';
import type { CompanyVerification } from '@/lib/api/kyc';

export default function AdminVerificationPage() {
  const { data, isLoading, error } = useKycSubmissions();
  const reviewKyc = useReviewKyc();
  const [actionId, setActionId] = useState<string | null>(null);
  const verifications: CompanyVerification[] = data?.data ?? [];

  const handleReview = (id: string, status: 'APPROVED' | 'REJECTED') => {
    setActionId(id);
    reviewKyc.mutate(
      { id, status, notes: status === 'APPROVED' ? 'Approved by admin' : 'Rejected by admin' },
      { onSettled: () => setActionId(null) },
    );
  };

  if (error) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Verification Queue" description="Review and manage KYC and business verification submissions" />
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12 dark:bg-dark-surface dark:border-dark-border">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="mt-4 text-lg font-medium text-text-primary dark:text-dark-text-primary">Failed to load verification submissions</p>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">{error.message}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Verification Queue" description="Review and manage KYC and business verification submissions" />
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Verification Queue"
        description="Review and manage KYC and business verification submissions"
      />

      {verifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12 dark:bg-dark-surface dark:border-dark-border">
          <ShieldCheck className="h-12 w-12 text-text-tertiary" />
          <p className="mt-4 text-lg font-medium text-text-primary dark:text-dark-text-primary">No verification submissions found</p>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">
            KYC and business verification submissions from users will appear here.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface dark:bg-dark-surface dark:border-dark-border">
          <div className="hidden grid-cols-12 gap-4 border-b border-border px-6 py-3 text-xs font-medium uppercase text-text-secondary dark:border-dark-border dark:text-dark-text-secondary sm:grid">
            <div className="col-span-3">Company</div>
            <div className="col-span-2">Level</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Submitted</div>
            <div className="col-span-3">Action</div>
          </div>
          {verifications.map((item: CompanyVerification) => (
            <div
              key={item.id}
              className="grid grid-cols-1 gap-3 border-b border-border px-6 py-4 last:border-0 sm:grid-cols-12 sm:items-center dark:border-dark-border"
            >
              <div className="flex items-center gap-3 sm:col-span-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">
                  {item.company?.name ?? item.companyId.slice(0, 8)}
                </p>
              </div>
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary sm:col-span-2">
                {item.level?.replace('LEVEL_', 'L') ?? '-'}
              </p>
              <div className="sm:col-span-2">
                <StatusBadge status={item.status} />
              </div>
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary sm:col-span-2">
                {new Date(item.createdAt).toLocaleDateString('en-IN')}
              </p>
              <div className="flex gap-2 sm:col-span-3">
                <Button variant="outline" size="sm" disabled>
                  <Eye className="mr-1.5 h-3.5 w-3.5" />
                  View
                </Button>
                {item.status === 'PENDING' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-500 hover:text-green-600"
                      disabled={actionId === item.id}
                      onClick={() => handleReview(item.id, 'APPROVED')}
                    >
                      <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-600"
                      disabled={actionId === item.id}
                      onClick={() => handleReview(item.id, 'REJECTED')}
                    >
                      <XCircle className="mr-1.5 h-3.5 w-3.5" />
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
