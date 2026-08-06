'use client';

import { DashboardPageHeader, StatusBadge, TableSkeleton } from '@/components/dashboard';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, THead, TR, TH, TBody, TD } from '@/components/ui/table';
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
        <Alert variant="error" title="Failed to load user verification submissions">{error.message}</Alert>
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
        <EmptyState icon={ShieldCheck} title="No user verification submissions" description="All buyers have been verified." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="User Verification Queue" description="Review and manage buyer KYC verification submissions" />

      <Table>
        <THead>
          <TR><TH>User</TH><TH>Level</TH><TH>Status</TH><TH>Submitted</TH><TH>Action</TH></TR>
        </THead>
        <TBody>
          {verifications.map((v) => (
            <TR key={v.id}>
              <TD>
                <div className="flex flex-col">
                  <span className="font-medium">{v.submitter?.name || v.submittedBy}</span>
                  <span className="text-xs text-text-tertiary">{v.submitter?.email}</span>
                </div>
              </TD>
              <TD><Badge variant="default">{v.level}</Badge></TD>
              <TD><StatusBadge status={v.status} /></TD>
              <TD className="text-sm text-text-secondary">{new Date(v.createdAt).toLocaleDateString()}</TD>
              <TD>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" disabled title="View details">
                    <Eye size={14} />
                  </Button>
                  {v.status === 'PENDING' && (
                    <>
                      <Button size="sm" variant="outline" className="border-green-500/30 text-green-500 hover:bg-green-500/10"
                        onClick={() => handleReview(v.id, 'APPROVED')} disabled={actionId === v.id}>
                        {actionId === v.id ? '...' : <CheckCircle size={14} />}
                      </Button>
                      <Button size="sm" variant="outline" className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                        onClick={() => handleReview(v.id, 'REJECTED')} disabled={actionId === v.id}>
                        {actionId === v.id ? '...' : <XCircle size={14} />}
                      </Button>
                    </>
                  )}
                </div>
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
