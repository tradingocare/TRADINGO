'use client';

import { useState } from 'react';
import { DashboardPageHeader, StatCard, StatCardSkeleton, TableSkeleton } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCollectionsSummary, useAgingReport, useOverdueCompanies, useCollectionNotes, useCreateCollectionNote, useCollectionTimeline } from '@/hooks/use-finance';
import { toast } from '@/components/ui/use-toast';
import { Clock, AlertTriangle, DollarSign, Phone, Mail, FileText, Activity, Sparkles, Loader2, Shield, FileEdit } from 'lucide-react';
import { useAiFinanceCollectionStrategy, useAiFinanceCollectionDraft } from '@/hooks/use-ai-finance';

const ACTION_LABELS: Record<string, string> = { CALL: 'Call', EMAIL: 'Email', VISIT: 'Visit', LETTER: 'Letter', PAYMENT_PLAN: 'Payment Plan', ESCALATION: 'Escalation', LEGAL: 'Legal' };

export default function AdminCollectionsPage() {
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [noteForm, setNoteForm] = useState({ actionType: 'CALL', content: '', contactedPerson: '', outcome: '', followUpAt: '' });
  const [aiResult, setAiResult] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftAmount, setDraftAmount] = useState('');
  const [draftDays, setDraftDays] = useState('');
  const aiCollectionStrategy = useAiFinanceCollectionStrategy();
  const aiCollectionDraft = useAiFinanceCollectionDraft();

  const { data: summary, isLoading: sLoading } = useCollectionsSummary();
  const { data: aging, isLoading: aLoading } = useAgingReport();
  const { data: overdueData, isLoading: oLoading } = useOverdueCompanies({ page: 1, limit: 50 });
  const { data: notes } = useCollectionNotes(selectedCompany || '');
  const { data: timeline } = useCollectionTimeline(selectedCompany || '');
  const createNoteMutation = useCreateCollectionNote();

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;
    try { await createNoteMutation.mutateAsync({ companyId: selectedCompany, dto: noteForm }); toast({ title: 'Note added' }); setNoteForm({ actionType: 'CALL', content: '', contactedPerson: '', outcome: '', followUpAt: '' }); } catch { toast({ title: 'Failed', variant: 'destructive' }); }
  };

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Collections" description="Outstanding payments, aging reports, and recovery" />

      {sLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}</div>
      ) : summary ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard icon={DollarSign} label="Total Overdue" value={`₹${summary.totalOverdue.toLocaleString()}`} />
          <StatCard icon={Clock} label="Overdue Payments" value={`₹${summary.overduePayments.toLocaleString()}`} />
          <StatCard icon={FileText} label="Overdue Invoices" value={`₹${summary.overdueInvoices.toLocaleString()}`} />
          <StatCard icon={AlertTriangle} label="Total Pending" value={`₹${summary.totalPending.toLocaleString()}`} />
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Aging Report</CardTitle></CardHeader>
          <CardContent>
            {aLoading ? <TableSkeleton rows={4} /> : !aging?.length ? <p className="text-sm text-gray-400">No data</p> : (
              <div className="space-y-3">
                {aging.map((b: any) => (
                  <div key={b.bucket} className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                    <span className="text-sm">{b.bucket}</span>
                    <div className="text-right"><p className="text-sm font-medium">₹{(b.amount / 100).toLocaleString()}</p><p className="text-xs text-gray-400">{b.count} payments</p></div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Overdue Companies ({overdueData?.meta?.total || 0})</CardTitle></CardHeader>
          <CardContent className="max-h-[400px] overflow-y-auto p-0">
            {oLoading ? <TableSkeleton rows={5} /> : !overdueData?.data?.length ? <div className="p-8 text-center text-gray-400">No overdue accounts</div> : (
              <div>
                {overdueData.data.map((c: any) => (
                  <div key={c.companyId} className={`p-3 border-b border-gray-700/50 cursor-pointer hover:bg-gray-800/50 ${selectedCompany === c.companyId ? 'bg-gray-800' : ''}`} onClick={() => setSelectedCompany(selectedCompany === c.companyId ? null : c.companyId)}>
                    <div className="flex justify-between items-start">
                      <div><p className="text-sm font-medium">{c.company?.name || c.companyId}</p><p className="text-xs text-gray-400">{c.daysOverdue} days overdue • {c.paymentCount} payments</p></div>
                      <p className="text-sm font-bold text-red-400">₹{(c.totalOverdue / 100).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedCompany && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Add Collection Note</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleAddNote} className="space-y-3">
                <div><Label>Action Type</Label>
                  <select className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm" value={noteForm.actionType} onChange={e => setNoteForm(p => ({ ...p, actionType: e.target.value }))}>
                    {Object.entries(ACTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div><Label>Content</Label><Textarea required value={noteForm.content} onChange={e => setNoteForm(p => ({ ...p, content: e.target.value }))} /></div>
                <div><Label>Contacted Person</Label><Input value={noteForm.contactedPerson} onChange={e => setNoteForm(p => ({ ...p, contactedPerson: e.target.value }))} /></div>
                <div><Label>Outcome</Label><Input value={noteForm.outcome} onChange={e => setNoteForm(p => ({ ...p, outcome: e.target.value }))} /></div>
                <div><Label>Follow-up At</Label><Input type="datetime-local" value={noteForm.followUpAt} onChange={e => setNoteForm(p => ({ ...p, followUpAt: e.target.value }))} /></div>
                <Button type="submit" disabled={createNoteMutation.isPending}>Add Note</Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Collection Notes ({notes?.length || 0})</CardTitle></CardHeader>
              <CardContent className="max-h-[300px] overflow-y-auto space-y-2">
                {!notes?.length ? <p className="text-sm text-gray-400">No notes</p> : notes.map((n: any) => (
                  <div key={n.id} className="p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <Badge className="bg-blue-500/20 text-blue-400 text-xs">{ACTION_LABELS[n.actionType] || n.actionType}</Badge>
                      <span className="text-xs text-gray-500">{new Date(n.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm mt-1">{n.content}</p>
                    {n.outcome && <p className="text-xs text-gray-400 mt-1">Outcome: {n.outcome}</p>}
                    {n.contactedPerson && <p className="text-xs text-gray-500">Contact: {n.contactedPerson}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
              <CardContent className="max-h-[300px] overflow-y-auto space-y-2">
                {!timeline?.length ? <p className="text-sm text-gray-400">No events</p> : timeline.map((e: any) => (
                  <div key={e.id} className="flex gap-3 text-sm">
                    <Activity className="h-4 w-4 mt-0.5 text-gray-500 shrink-0" />
                    <div><p>{e.description}</p><p className="text-xs text-gray-500">{new Date(e.createdAt).toLocaleString()}</p></div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-orange-400" /> AI Collection Intelligence</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button size="sm" disabled={aiLoading} onClick={async () => {
              setAiLoading(true); try {
                const firstOverdue = overdueData?.data?.[0];
                const ctx = { companyData: firstOverdue ? { id: firstOverdue.companyId, name: firstOverdue.company?.name } : {}, totalOverdue: summary?.totalOverdue || 0, daysOverdue: firstOverdue?.daysOverdue || 30 };
                const r = await aiCollectionStrategy.mutateAsync(ctx); setAiResult(r.data); toast({ title: 'Collection strategy ready' });
              } catch { toast({ title: 'Failed', variant: 'destructive' }); } finally { setAiLoading(false); }
            }}>
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />} Collection Strategy
            </Button>
          </div>
          <div className="flex flex-wrap items-end gap-2 mt-3">
            <div className="space-y-1">
              <Label className="text-xs">Customer Name</Label>
              <Input className="w-40 text-xs h-8" placeholder="Name" value={draftName} onChange={e => setDraftName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Amount</Label>
              <Input className="w-28 text-xs h-8" placeholder="0" value={draftAmount} onChange={e => setDraftAmount(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Days Overdue</Label>
              <Input className="w-20 text-xs h-8" placeholder="0" value={draftDays} onChange={e => setDraftDays(e.target.value)} />
            </div>
            <Button size="sm" disabled={aiLoading || !draftName} onClick={async () => {
              setAiLoading(true); try {
                const r = await aiCollectionDraft.mutateAsync({ customerName: draftName, outstandingAmount: Number(draftAmount) || 0, daysOverdue: Number(draftDays) || 0 });
                setAiResult(r.data); toast({ title: 'Collection draft generated' });
              } catch { toast({ title: 'Failed', variant: 'destructive' }); } finally { setAiLoading(false); }
            }}>
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileEdit className="h-4 w-4" />} Generate Draft
            </Button>
          </div>
          {aiResult && (
            <pre className="mt-4 p-3 bg-gray-800/50 rounded-lg text-xs text-gray-300 whitespace-pre-wrap overflow-auto max-h-60">{JSON.stringify(aiResult, null, 2)}</pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
