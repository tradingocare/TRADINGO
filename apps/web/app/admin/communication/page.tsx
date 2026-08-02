'use client';

import { useState } from 'react';
import { useModerationReports, useModerationStats, useReviewReport, useDismissReport } from '@/hooks';
import { DashboardPageHeader } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Shield, AlertTriangle, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function AdminCommunicationPage() {
  const [status, setStatus] = useState<string | undefined>();
  const { data: reportsData, isLoading } = useModerationReports({ status, limit: 50 });
  const { data: stats } = useModerationStats();
  const reviewReport = useReviewReport();
  const dismissReport = useDismissReport();

  const reports = reportsData?.items ?? [];

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Communication Moderation" description="Review reported messages and spam" />

      {stats && (
        <div className="grid gap-4 sm:grid-cols-4">
          <Card><CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400"><MessageSquare className="h-5 w-5" /></div>
            <div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-text-secondary">Total Reports</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400"><AlertTriangle className="h-5 w-5" /></div>
            <div><p className="text-2xl font-bold">{stats.pending}</p><p className="text-xs text-text-secondary">Pending</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/15 text-green-400"><CheckCircle className="h-5 w-5" /></div>
            <div><p className="text-2xl font-bold">{stats.reviewed}</p><p className="text-xs text-text-secondary">Reviewed</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/15 text-red-400"><XCircle className="h-5 w-5" /></div>
            <div><p className="text-2xl font-bold">{stats.dismissed}</p><p className="text-xs text-text-secondary">Dismissed</p></div>
          </CardContent></Card>
        </div>
      )}

      <div className="flex gap-2">
        {['', 'PENDING', 'REVIEWED', 'DISMISSED'].map((s) => (
          <button key={s} onClick={() => setStatus(s || undefined)}
            className={`rounded-lg px-4 py-1.5 text-xs font-medium transition-colors ${(status || '') === s ? 'bg-[#f97316] text-white' : 'border border-border text-text-secondary hover:border-[#f97316]/30'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" color="muted" /></div>
      ) : reports.length === 0 ? (
        <EmptyState icon={Shield} title="All Clear" description="No reported messages to review." />
      ) : (
        <div className="space-y-3">
          {reports.map((report: any) => (
            <Card key={report.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        report.status === 'PENDING' ? 'bg-amber-500/15 text-amber-400' :
                        report.status === 'REVIEWED' ? 'bg-green-500/15 text-green-400' : 'bg-surface-secondary text-text-secondary'
                      }`}>{report.status}</span>
                      <span className="text-xs text-text-secondary">Reported by {report.reportedBy?.name || 'Unknown'}</span>
                      <span className="text-xs text-text-tertiary">{new Date(report.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-text-primary">Reason: {report.reason}</p>
                    {report.description && <p className="mt-1 text-xs text-text-secondary">{report.description}</p>}
                    <div className="mt-3 rounded-lg bg-surface-secondary/50 p-3 text-xs dark:bg-dark-surface-secondary/50">
                      <p className="font-medium text-text-primary">Message:</p>
                      <p className="mt-1 text-text-secondary">{report.message?.content || '[deleted]'}</p>
                    </div>
                  </div>
                  {report.status === 'PENDING' && (
                    <div className="flex flex-col gap-2">
                      <Button size="sm" className="bg-green-600 text-white hover:bg-green-700"
                        onClick={() => reviewReport.mutate({ id: report.id, action: 'WARNING' })}>
                        <CheckCircle className="h-3 w-3 mr-1" /> Warn
                      </Button>
                      <Button size="sm" variant="destructive"
                        onClick={() => reviewReport.mutate({ id: report.id, action: 'MESSAGE_REMOVED' })}>
                        <XCircle className="h-3 w-3 mr-1" /> Remove
                      </Button>
                      <Button size="sm" variant="outline"
                        onClick={() => dismissReport.mutate(report.id)}>
                        Dismiss
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
