'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DashboardPageHeader, StatCard, StatCardSkeleton, TableSkeleton } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLeads, useCreateLead } from '@/hooks/use-crm';
import { Plus, Search, Users, TrendingUp, XCircle, Target, ArrowUpDown } from 'lucide-react';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { toast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

const STATUS_STYLES: Record<string, string> = {
  NEW: 'bg-blue-500/20 text-blue-400', CONTACTED: 'bg-yellow-500/20 text-yellow-400',
  QUALIFIED: 'bg-purple-500/20 text-purple-400', PROPOSAL: 'bg-indigo-500/20 text-indigo-400',
  NEGOTIATION: 'bg-orange-500/20 text-orange-400', WON: 'bg-green-500/20 text-green-400',
  LOST: 'bg-red-500/20 text-red-400', DISQUALIFIED: 'bg-bg-elevated text-gray-400',
};

export default function SellerCrmPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', mobile: '', source: '', description: '' });

  const { data: leadsData, isLoading, error } = useLeads({ page, limit: 20, search, status: statusFilter || undefined, sortBy: 'createdAt', sortOrder: 'desc' });
  const createMutation = useCreateLead();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({ name: form.name, email: form.email || undefined, mobile: form.mobile || undefined, source: form.source || undefined, description: form.description || undefined });
      toast({ title: 'Lead created' });
      setShowCreate(false);
      setForm({ name: '', email: '', mobile: '', source: '', description: '' });
    } catch { toast({ title: 'Failed to create lead', variant: 'destructive' }); }
  };

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="CRM" description="Manage your leads and prospects" actions={
        <Button onClick={() => setShowCreate(true)}><Plus className="mr-2 h-4 w-4" /> Add Lead</Button>
      } />

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Lead">
        <form onSubmit={handleCreate} className="space-y-4">
          <div><Label>Name *</Label><Input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
          <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
          <div><Label>Mobile</Label><Input value={form.mobile} onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))} /></div>
          <div><Label>Source</Label><Input value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))} /></div>
          <div><Label>Description</Label><Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending}>Create Lead</Button>
          </div>
        </form>
      </Modal>

      <div className="flex items-center gap-4">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" /><Input placeholder="Search leads..." className="pl-10" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div>
        <Select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          {Object.keys(STATUS_STYLES).map(s => <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-4"><TableSkeleton rows={5} /></div>
      ) : error ? (
        <Card><CardContent className="py-8 text-center text-red-400">Failed to load leads</CardContent></Card>
      ) : leadsData?.data?.length === 0 ? (
        <Card><CardContent className="py-12"><EmptyState title="No leads found" description="Create your first lead to start tracking prospects." /></CardContent></Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>Leads ({leadsData?.meta?.total || 0})</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <THead><TR><TH>Name</TH><TH>Email</TH><TH>Status</TH><TH>Priority</TH><TH>Score</TH><TH>Value</TH><TH>Created</TH><TH></TH></TR></THead>
              <TBody>
                {leadsData.data.map((lead: any) => (
                  <TR key={lead.id}>
                    <TD className="font-medium"><Link href={`/seller/crm/${lead.id}`} className="hover:text-blue-400">{lead.name}</Link>{lead.company && <span className="ml-2 text-xs text-text-secondary">{lead.company.name}</span>}</TD>
                    <TD className="text-sm text-text-tertiary">{lead.email || '-'}</TD>
                    <TD><Badge className={STATUS_STYLES[lead.status] || ''}>{lead.status}</Badge></TD>
                    <TD className="text-sm">{lead.priority || '-'}</TD>
                    <TD className="text-sm">{lead.score || 0}</TD>
                    <TD className="text-sm">{lead.estimatedValue ? `₹${Number(lead.estimatedValue).toLocaleString()}` : '-'}</TD>
                    <TD className="text-sm text-text-tertiary">{new Date(lead.createdAt).toLocaleDateString()}</TD>
                    <TD><Link href={`/seller/crm/${lead.id}`}><Button variant="ghost" size="sm"><Users className="h-4 w-4" /></Button></Link></TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            {leadsData?.meta?.totalPages > 1 && (
              <div className="flex justify-between items-center p-4 border-t border-border">
                <span className="text-sm text-text-tertiary">Page {leadsData.meta.page} of {leadsData.meta.totalPages}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={!leadsData.meta.hasPrevious} onClick={() => setPage(p => p - 1)}>Previous</Button>
                  <Button variant="outline" size="sm" disabled={!leadsData.meta.hasNext} onClick={() => setPage(p => p + 1)}>Next</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
