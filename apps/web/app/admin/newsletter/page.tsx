'use client';

import { useState } from 'react';
import { DashboardPageHeader, StatCard, StatCardSkeleton, TableSkeleton } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs } from '@/components/ui/tabs';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { subscribe, listSubscribers, getSubscriberStats, createNewsletterCampaign, listNewsletterCampaigns, sendNewsletterCampaign } from '@/lib/api/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, Users, Send, Search, ListPlus } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-surface-secondary text-text-tertiary',
  SCHEDULED: 'bg-blue-500/15 text-blue-400',
  SENDING: 'bg-amber-500/15 text-amber-400',
  SENT: 'bg-green-500/15 text-green-400',
  CANCELLED: 'bg-red-500/15 text-red-400',
};

export default function AdminNewsletterPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('subscribers');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [newCampaign, setNewCampaign] = useState({ name: '', subject: '', body: '' });

  const { data: stats } = useQuery({ queryKey: ['newsletter', 'stats'], queryFn: getSubscriberStats });
  const { data: subsData, isLoading: subsLoading } = useQuery({ queryKey: ['newsletter', 'subscribers', page, search], queryFn: () => listSubscribers({ page, limit: 20, search }) });
  const { data: campaignsData, isLoading: campsLoading } = useQuery({ queryKey: ['newsletter', 'campaigns', page], queryFn: () => listNewsletterCampaigns({ page, limit: 20 }) });

  const createMutation = useMutation({
    mutationFn: () => createNewsletterCampaign(newCampaign),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['newsletter', 'campaigns'] }); setNewCampaign({ name: '', subject: '', body: '' }); },
  });

  const sendMutation = useMutation({
    mutationFn: (id: string) => sendNewsletterCampaign(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['newsletter', 'campaigns'] }),
  });

  const tabs = [
    { value: 'subscribers', label: 'Subscribers', icon: <Users className="h-4 w-4" /> },
    { value: 'campaigns', label: 'Campaigns', icon: <Mail className="h-4 w-4" /> },
    { value: 'create', label: 'New Campaign', icon: <ListPlus className="h-4 w-4" /> },
  ];

  const renderTabContent = () => {
    switch (tab) {
      case 'subscribers':
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Subscribers</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                  <Input placeholder="Search..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {subsLoading ? <TableSkeleton rows={5} /> : (
                <Table><THead><TR><TH>Email</TH><TH>Name</TH><TH>Status</TH><TH>Subscribed</TH></TR></THead>
                  <TBody>{subsData?.data?.length ? subsData.data.map((s: any) => (
                    <TR key={s.id}><TD>{s.email}</TD><TD>{s.name || '-'}</TD><TD><Badge variant="outline">{s.status}</Badge></TD><TD>{new Date(s.subscribedAt).toLocaleDateString()}</TD></TR>
                  )) : <TR><TD colSpan={4} className="text-center text-text-tertiary py-8">No subscribers</TD></TR>}</TBody>
                </Table>
              )}
            </CardContent>
          </Card>
        );
      case 'campaigns':
        return (
          <Card>
            <CardHeader><CardTitle>Email Campaigns</CardTitle></CardHeader>
            <CardContent>
              {campsLoading ? <TableSkeleton rows={5} /> : (
                <Table><THead><TR><TH>Name</TH><TH>Subject</TH><TH>Status</TH><TH>Sent</TH><TH>Opens</TH><TH>Actions</TH></TR></THead>
                  <TBody>{campaignsData?.data?.length ? campaignsData.data.map((c: any) => (
                    <TR key={c.id}>
                      <TD>{c.name}</TD><TD className="text-text-tertiary max-w-[200px] truncate">{c.subject}</TD>
                      <TD><Badge className={STATUS_COLORS[c.status] || ''}>{c.status}</Badge></TD>
                      <TD>{c.sentCount}</TD><TD>{c.openCount}</TD>
                      <TD>{c.status === 'DRAFT' && <Button variant="outline" size="sm" onClick={() => sendMutation.mutate(c.id)} disabled={sendMutation.isPending}><Send className="h-3 w-3 mr-1" />Send</Button>}</TD>
                    </TR>
                  )) : <TR><TD colSpan={6} className="text-center text-text-tertiary py-8">No campaigns</TD></TR>}</TBody>
                </Table>
              )}
            </CardContent>
          </Card>
        );
      case 'create':
        return (
          <Card>
            <CardHeader><CardTitle>Create Newsletter Campaign</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><label className="text-sm text-text-tertiary">Name</label><Input value={newCampaign.name} onChange={(e) => setNewCampaign(p => ({ ...p, name: e.target.value }))} placeholder="Campaign name" /></div>
              <div><label className="text-sm text-text-tertiary">Subject</label><Input value={newCampaign.subject} onChange={(e) => setNewCampaign(p => ({ ...p, subject: e.target.value }))} placeholder="Email subject" /></div>
              <div><label className="text-sm text-text-tertiary">Body</label><Textarea value={newCampaign.body} onChange={(e) => setNewCampaign(p => ({ ...p, body: e.target.value }))} placeholder="Email body (HTML)" rows={8} /></div>
              <Button onClick={() => createMutation.mutate()} disabled={!newCampaign.name || !newCampaign.subject || !newCampaign.body}>
                <ListPlus className="h-4 w-4 mr-1" /> Create Campaign
              </Button>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Newsletter" description="Manage subscribers and email campaigns" />

      {stats ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Active" value={String(stats.active)} />
          <StatCard icon={Users} label="Unsubscribed" value={String(stats.unsubscribed)} />
          <StatCard icon={Users} label="Bounced" value={String(stats.bounced)} />
          <StatCard icon={Mail} label="Total" value={String(stats.total)} />
        </div>
      ) : <div className="grid grid-cols-1 md:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}</div>}

      <Tabs tabs={tabs} value={tab} onChange={setTab} />

      {renderTabContent()}
    </div>
  );
}
