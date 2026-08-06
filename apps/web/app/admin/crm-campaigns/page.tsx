'use client';

import { useState } from 'react';
import { DashboardPageHeader, StatCard, StatCardSkeleton, TableSkeleton } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import Link from 'next/link';
import { useCampaigns, useCampaignDashboard } from '@/hooks/use-crm';
import { Plus, Search, Target, Play, Pause, TrendingUp, List } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-surface-secondary text-text-tertiary',
  ACTIVE: 'bg-green-500/15 text-green-400',
  PAUSED: 'bg-amber-500/15 text-amber-400',
  COMPLETED: 'bg-blue-500/15 text-blue-400',
  CANCELLED: 'bg-red-500/15 text-red-400',
};

export default function AdminCrmCampaignsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { data: campaignsData, isLoading } = useCampaigns({ page, limit: 20, search });
  const { data: dashboard, isLoading: dashLoading } = useCampaignDashboard();

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="CRM Campaigns"
        description="Manage marketing and outreach campaigns"
        actions={<Link href="/admin/crm-campaigns/new"><Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Campaign</Button></Link>}
      />

      {dashLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard icon={List} label="Total Campaigns" value={String(dashboard?.totalCampaigns ?? 0)} />
          <StatCard icon={Play} label="Active" value={String(dashboard?.activeCampaigns ?? 0)} />
          <StatCard icon={Pause} label="Paused" value={String(dashboard?.byStatus?.find((s: any) => s.status === 'PAUSED')?.count ?? 0)} />
          <StatCard icon={TrendingUp} label="Completion Rate" value={dashboard?.totalCampaigns ? `${((dashboard.byStatus?.find((s: any) => s.status === 'COMPLETED')?.count ?? 0) / dashboard.totalCampaigns * 100).toFixed(0)}%` : '0%'} />
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Campaigns</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
              <Input placeholder="Search campaigns..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? <TableSkeleton rows={5} /> : (
            <Table>
              <THead>
                <TR>
                  <TH>Name</TH><TH>Type</TH><TH>Status</TH><TH>Target</TH><TH>Leads</TH><TH>Actions</TH>
                </TR>
              </THead>
              <TBody>
                {campaignsData?.data?.length ? campaignsData.data.map((c: any) => (
                  <TR key={c.id}>
                    <TD><Link href={`/admin/crm-campaigns/${c.id}`} className="text-accent hover:underline">{c.name}</Link></TD>
                    <TD><Badge variant="outline">{c.type}</Badge></TD>
                    <TD><Badge className={STATUS_COLORS[c.status] || ''}>{c.status}</Badge></TD>
                    <TD>{c.targetLeads}</TD>
                    <TD>{c._count?.leads ?? 0}</TD>
                    <TD><Link href={`/admin/crm-campaigns/${c.id}`}><Button variant="ghost" size="sm">View</Button></Link></TD>
                  </TR>
                )) : (
                  <TR><TD colSpan={6} className="text-center text-text-tertiary py-8">No campaigns found</TD></TR>
                )}
              </TBody>
            </Table>
          )}
          {campaignsData?.meta && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-text-tertiary">Page {campaignsData.meta.page} of {campaignsData.meta.totalPages} ({campaignsData.meta.total} total)</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={!campaignsData.meta.hasPrevious} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={!campaignsData.meta.hasNext} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
