'use client';

import { useState } from 'react';
import { useModerationReports, useModerationStats, useReviewReport, useDismissReport } from '@/hooks';
import { DashboardPageHeader } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle, CheckCircle, XCircle, Loader2, MessageSquare } from 'lucide-react';

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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><MessageSquare className="h-5 w-5" /></div>
            <div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-text-secondary">Total Reports</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600"><AlertTriangle className="h-5 w-5" /></div>
            <div><p className="text-2xl font-bold">{stats.pending}</p><p className="text-xs text-text-secondary">Pending</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600"><CheckCircle className="h-5 w-5" /></div>
            <div><p className="text-2xl font-bold">{stats.reviewed}</p><p className="text-xs text-text-secondary">Reviewed</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600"><XCircle className="h-5 w-5" /></div>
            <div><p className="text-2xl font-bold">{stats.dismissed}</p><p className="text-xs text-text-secondary">Dismissed</p></div>
          </CardContent></Card>
        </div>
      )}

      <div className="flex gap-2">
        {['', 'PENDING', 'REVIEWED', 'DISMISSED'].map((s) => (
          <button key={s} onClick={() => setStatus(s || undefined)}
            className={`rounded-lg px-4 py-1.5 text-xs font-medium transition-colors ${(status || '') === s ? 'bg-[#FF5A1F] text-white' : 'border border-border text-text-secondary hover:border-[#FF5A1F]/30'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-text-tertiary" /></div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12 dark:bg-dark-surface dark:border-dark-border">
          <Shield className="h-12 w-12 text-text-tertiary" />
          <h3 className="mt-4 text-lg font-semibold">All Clear</h3>
          <p className="mt-1 text-sm text-text-secondary">No reported messages to review.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report: any) => (
            <Card key={report.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        report.status === 'PENDING' ? 'bg-amber-50 text-amber-600' :
                        report.status === 'REVIEWED' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600'
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
