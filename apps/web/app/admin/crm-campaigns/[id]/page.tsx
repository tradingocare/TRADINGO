'use client';

import { useParams } from 'next/navigation';
import { DashboardPageHeader } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { useCampaign, useCampaignAnalytics } from '@/hooks/use-crm';
import { Target, Calendar, DollarSign, Users } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-surface-secondary text-text-tertiary',
  ACTIVE: 'bg-green-500/15 text-green-400',
  PAUSED: 'bg-amber-500/15 text-amber-400',
  COMPLETED: 'bg-blue-500/15 text-blue-400',
  CANCELLED: 'bg-red-500/15 text-red-400',
};

export default function CrmCampaignDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: campaign, isLoading } = useCampaign(id);
  const { data: analytics } = useCampaignAnalytics(id);

  if (isLoading) {
    return <div className="p-6"><DashboardPageHeader title="Loading..." /><div className="animate-pulse space-y-4"><div className="h-24 bg-surface rounded" /><div className="h-64 bg-surface rounded" /></div></div>;
  }
  if (!campaign) {
    return <div className="p-6"><DashboardPageHeader title="Campaign Not Found" /><p className="text-text-tertiary">The campaign you are looking for does not exist.</p></div>;
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader title={campaign.name} description={campaign.description || 'No description'} />

      <div className="flex gap-2 mb-4"><Badge className={STATUS_COLORS[campaign.status] || ''}>{campaign.status}</Badge></div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><Target className="h-5 w-5 text-accent" /><div><p className="text-sm text-text-tertiary">Type</p><p className="font-medium">{campaign.type}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><Calendar className="h-5 w-5 text-accent" /><div><p className="text-sm text-text-tertiary">Duration</p><p className="font-medium">{campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : 'N/A'} - {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : 'N/A'}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><DollarSign className="h-5 w-5 text-accent" /><div><p className="text-sm text-text-tertiary">Budget</p><p className="font-medium">{campaign.budget ? `\u20B9${Number(campaign.budget).toLocaleString()}` : 'Not set'}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><Users className="h-5 w-5 text-accent" /><div><p className="text-sm text-text-tertiary">Leads</p><p className="font-medium">{campaign._count?.leads ?? 0} / {campaign.targetLeads}</p></div></div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Campaign Leads</CardTitle></CardHeader>
          <CardContent>
            {campaign.leads?.length ? (
              <Table><THead><TR><TH>Name</TH><TH>Email</TH><TH>Status</TH><TH>Score</TH></TR></THead>
                <TBody>{campaign.leads.map((l: any) => (
                  <TR key={l.id}><TD>{l.name}</TD><TD className="text-text-tertiary">{l.email || '-'}</TD><TD><Badge variant="outline">{l.status}</Badge></TD><TD>{l.score}</TD></TR>
                ))}</TBody>
              </Table>
            ) : <p className="text-text-tertiary text-center py-8">No leads assigned to this campaign</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Analytics</CardTitle></CardHeader>
          <CardContent>
            {analytics ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface rounded p-3"><p className="text-xs text-text-tertiary">Target</p><p className="text-lg font-semibold">{analytics.targetLeads}</p></div>
                  <div className="bg-surface rounded p-3"><p className="text-xs text-text-tertiary">Reached</p><p className="text-lg font-semibold">{analytics.reachedLeads}</p></div>
                  <div className="bg-surface rounded p-3"><p className="text-xs text-text-tertiary">Converted</p><p className="text-lg font-semibold">{analytics.convertedLeads}</p></div>
                  <div className="bg-surface rounded p-3"><p className="text-xs text-text-tertiary">Total</p><p className="text-lg font-semibold">{analytics.totalLeads}</p></div>
                </div>
                <div><h4 className="text-sm font-medium mb-2">By Status</h4>{analytics.statusBreakdown?.map((s: any) => (
                  <div key={s.status} className="flex justify-between text-sm"><span>{s.status}</span><span className="text-text-secondary">{s.count}</span></div>
                ))}</div>
                <div><h4 className="text-sm font-medium mb-2">By Source</h4>{analytics.sourceBreakdown?.map((s: any) => (
                  <div key={s.source} className="flex justify-between text-sm"><span>{s.source}</span><span className="text-text-secondary">{s.count}</span></div>
                ))}</div>
              </div>
            ) : <p className="text-text-tertiary text-center py-8">Analytics not available</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
