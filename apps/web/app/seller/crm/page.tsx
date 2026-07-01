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
import { toast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';

const STATUS_STYLES: Record<string, string> = {
  NEW: 'bg-blue-500/20 text-blue-400', CONTACTED: 'bg-yellow-500/20 text-yellow-400',
  QUALIFIED: 'bg-purple-500/20 text-purple-400', PROPOSAL: 'bg-indigo-500/20 text-indigo-400',
  NEGOTIATION: 'bg-orange-500/20 text-orange-400', WON: 'bg-green-500/20 text-green-400',
  LOST: 'bg-red-500/20 text-red-400', DISQUALIFIED: 'bg-gray-500/20 text-gray-400',
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

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md border border-gray-700" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Create Lead</h2>
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
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" /><Input placeholder="Search leads..." className="pl-10" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div>
        <select className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          {Object.keys(STATUS_STYLES).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-4"><TableSkeleton rows={5} /></div>
      ) : error ? (
        <Card><CardContent className="py-8 text-center text-red-400">Failed to load leads</CardContent></Card>
      ) : leadsData?.data?.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-gray-400">No leads found. Create your first lead to start tracking prospects.</CardContent></Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>Leads ({leadsData?.meta?.total || 0})</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-gray-700 text-left text-sm text-gray-400">
                  <th className="p-4">Name</th><th className="p-4">Email</th><th className="p-4">Status</th><th className="p-4">Priority</th><th className="p-4">Score</th><th className="p-4">Value</th><th className="p-4">Created</th><th className="p-4"></th>
                </tr></thead>
                <tbody>
                  {leadsData.data.map((lead: any) => (
                    <tr key={lead.id} className="border-b border-gray-700/50 hover:bg-gray-800/50">
                      <td className="p-4 font-medium"><Link href={`/seller/crm/${lead.id}`} className="hover:text-blue-400">{lead.name}</Link>{lead.company && <span className="ml-2 text-xs text-gray-500">{lead.company.name}</span>}</td>
                      <td className="p-4 text-sm text-gray-400">{lead.email || '-'}</td>
                      <td className="p-4"><Badge className={STATUS_STYLES[lead.status] || ''}>{lead.status}</Badge></td>
                      <td className="p-4 text-sm">{lead.priority || '-'}</td>
                      <td className="p-4 text-sm">{lead.score || 0}</td>
                      <td className="p-4 text-sm">{lead.estimatedValue ? `₹${Number(lead.estimatedValue).toLocaleString()}` : '-'}</td>
                      <td className="p-4 text-sm text-gray-400">{new Date(lead.createdAt).toLocaleDateString()}</td>
                      <td className="p-4"><Link href={`/seller/crm/${lead.id}`}><Button variant="ghost" size="sm"><Users className="h-4 w-4" /></Button></Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {leadsData?.meta?.totalPages > 1 && (
              <div className="flex justify-between items-center p-4 border-t border-gray-700">
                <span className="text-sm text-gray-400">Page {leadsData.meta.page} of {leadsData.meta.totalPages}</span>
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
