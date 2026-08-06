'use client';

import { useState } from 'react';
import { DashboardPageHeader, StatCard, StatCardSkeleton, TableSkeleton } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import Link from 'next/link';
import { useCampaigns, useAdminCampaignDashboard, usePauseCampaign, useResumeCampaign, useArchiveCampaign, useCloneCampaign } from '@/hooks/use-campaign';
import { Plus, Play, Pause, Archive, Copy, ExternalLink, Megaphone, Trophy, FileText, DollarSign } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-500/15 text-green-400',
  DRAFT: 'bg-surface-secondary text-text-secondary',
  PAUSED: 'bg-amber-500/15 text-amber-400',
  COMPLETED: 'bg-blue-500/15 text-blue-400',
  EXPIRED: 'bg-red-500/15 text-red-400',
  ARCHIVED: 'bg-surface-secondary text-text-tertiary',
};

export default function AdminCampaignsPage() {
  const [page, setPage] = useState(1);
  const { data: campaignsData, isLoading: campaignsLoading } = useCampaigns({ page, limit: 20 });
  const { data: dashboard, isLoading: dashboardLoading } = useAdminCampaignDashboard();
  const pauseMutation = usePauseCampaign();
  const resumeMutation = useResumeCampaign();
  const archiveMutation = useArchiveCampaign();
  const cloneMutation = useCloneCampaign();

  const campaigns = campaignsData?.data ?? [];
  const totalPages = campaignsData?.totalPages ?? 0;
  const total = campaignsData?.total ?? 0;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Campaign Engine"
        description="Manage promotions, cashback, and rewards"
        actions={<Link href="/admin/campaigns/new"><Button><Plus className="mr-2 h-4 w-4" /> New Campaign</Button></Link>}
      />

      {dashboardLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : dashboard ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard icon={Megaphone} label="Total Campaigns" value={String(dashboard.total)} />
          <StatCard icon={Play} label="Active" value={String(dashboard.active)} />
          <StatCard icon={FileText} label="Drafts" value={String(dashboard.draft)} />
          <StatCard icon={Trophy} label="Completed" value={String(dashboard.completed)} />
          <StatCard icon={DollarSign} label="Budget Used" value={`${(dashboard.budgetUsageRate * 100).toFixed(1)}%`} />
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>All Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          {campaignsLoading ? (
            <TableSkeleton />
          ) : !campaigns.length ? (
            <p className="text-sm text-white/60">No campaigns yet. Create your first campaign.</p>
          ) : (
            <Table>
              <THead><TR>
                <TH>Name</TH>
                <TH>Type</TH>
                <TH>Status</TH>
                <TH>Budget</TH>
                <TH>Claims</TH>
                <TH>Period</TH>
                <TH>Actions</TH>
              </TR></THead>
              <TBody>
                {campaigns.map((c) => (
                  <TR key={c.id}>
                    <TD className="font-medium">{c.name}</TD>
                    <TD><Badge variant="outline">{c.type}</Badge></TD>
                    <TD>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[c.status] ?? ''}`}>{c.status}</span>
                    </TD>
                    <TD><span className="text-xs">₹{Number(c.spentBudget).toLocaleString('en-IN')} / ₹{Number(c.budget).toLocaleString('en-IN')}</span></TD>
                    <TD>{c.currentClaims}/{c.maxClaims || '∞'}</TD>
                    <TD className="text-xs text-white/60">{new Date(c.startDate).toLocaleDateString()} - {new Date(c.endDate).toLocaleDateString()}</TD>
                    <TD>
                      <div className="flex gap-1">
                        <Link href={`/admin/campaigns/${c.id}`}><Button variant="ghost" size="sm"><ExternalLink className="h-3 w-3" /></Button></Link>
                        {c.status === 'ACTIVE' && <Button variant="ghost" size="sm" onClick={() => pauseMutation.mutate(c.id)}><Pause className="h-3 w-3" /></Button>}
                        {c.status === 'PAUSED' && <Button variant="ghost" size="sm" onClick={() => resumeMutation.mutate(c.id)}><Play className="h-3 w-3" /></Button>}
                        {c.status !== 'ARCHIVED' && <Button variant="ghost" size="sm" onClick={() => archiveMutation.mutate(c.id)}><Archive className="h-3 w-3" /></Button>}
                        <Button variant="ghost" size="sm" onClick={() => cloneMutation.mutate(c.id)}><Copy className="h-3 w-3" /></Button>
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-white/60">Page {page} of {totalPages} ({total} total)</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
