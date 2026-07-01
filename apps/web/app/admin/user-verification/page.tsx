'use client';

import { DashboardPageHeader, StatusBadge, TableSkeleton } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { useUserVerifications, useReviewUserVerification } from '@/hooks';
import { ShieldCheck, Eye, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';
import type { UserVerification } from '@/lib/api/user-verification';

export default function AdminUserVerificationPage() {
  const { data, isLoading, error } = useUserVerifications();
  const reviewKyc = useReviewUserVerification();
  const [actionId, setActionId] = useState<string | null>(null);
  const verifications: UserVerification[] = data?.data ?? [];

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
        <DashboardPageHeader title="User Verification Queue" description="Review and manage buyer KYC verification submissions" />
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12 dark:bg-dark-surface dark:border-dark-border">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="mt-4 text-lg font-medium text-text-primary dark:text-dark-text-primary">Failed to load user verification submissions</p>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">{error.message}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="User Verification Queue" description="Review and manage buyer KYC verification submissions" />
        <TableSkeleton />
      </div>
    );
  }

  if (!verifications.length) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="User Verification Queue" description="Review and manage buyer KYC verification submissions" />
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12 dark:bg-dark-surface dark:border-dark-border">
          <ShieldCheck className="h-12 w-12 text-green-500" />
          <p className="mt-4 text-lg font-medium text-text-primary dark:text-dark-text-primary">No user verification submissions</p>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">All buyers have been verified.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="User Verification Queue" description="Review and manage buyer KYC verification submissions" />

      <div className="overflow-x-auto rounded-xl border border-border bg-surface dark:bg-dark-surface dark:border-dark-border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border dark:border-dark-border text-text-tertiary">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Level</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Submitted</th>
              <th className="px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {verifications.map((v) => (
              <tr key={v.id} className="border-b border-border dark:border-dark-border last:border-b-0">
                <td className="px-4 py-3 text-text-primary dark:text-dark-text-primary">
                  <div className="flex flex-col">
                    <span className="font-medium">{v.submitter?.name || v.submittedBy}</span>
                    <span className="text-xs text-text-tertiary">{v.submitter?.email}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-500">
                    {v.level}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={v.status} />
                </td>
                <td className="px-4 py-3 text-sm text-text-secondary dark:text-dark-text-secondary">
                  {new Date(v.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" disabled title="View details">
                      <Eye size={14} />
                    </Button>
                    {v.status === 'PENDING' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-500/30 text-green-500 hover:bg-green-500/10"
                          onClick={() => handleReview(v.id, 'APPROVED')}
                          disabled={actionId === v.id}
                        >
                          {actionId === v.id ? '...' : <CheckCircle size={14} />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                          onClick={() => handleReview(v.id, 'REJECTED')}
                          disabled={actionId === v.id}
                        >
                          {actionId === v.id ? '...' : <XCircle size={14} />}
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
