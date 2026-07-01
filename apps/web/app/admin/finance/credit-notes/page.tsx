'use client';

import { useState } from 'react';
import { DashboardPageHeader, TableSkeleton } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreditNotes, useCreateCreditNote, useIssueCreditNote, useCancelCreditNote, useDebitNotes, useCreateDebitNote, useIssueDebitNote, useCancelDebitNote, useCreditNoteGstSummary } from '@/hooks/use-finance';
import { toast } from '@/components/ui/use-toast';
import { FileText, Plus, CheckCircle, XCircle, Download } from 'lucide-react';

const STATUS_STYLES: Record<string, string> = { DRAFT: 'bg-gray-500/20 text-gray-400', ISSUED: 'bg-green-500/20 text-green-400', APPLIED: 'bg-blue-500/20 text-blue-400', CANCELLED: 'bg-red-500/20 text-red-400' };

export default function AdminCreditNotesPage() {
  const [tab, setTab] = useState<'credit' | 'debit'>('credit');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ invoiceId: '', reason: '', subtotal: 0, taxAmount: 0, totalAmount: 0, notes: '' });

  const { data: creditNotes, isLoading: cl } = useCreditNotes({ page: 1, limit: 50 });
  const { data: debitNotes, isLoading: dl } = useDebitNotes({ page: 1, limit: 50 });
  const { data: gstSummary } = useCreditNoteGstSummary();
  const createCn = useCreateCreditNote();
  const issueCn = useIssueCreditNote();
  const cancelCn = useCancelCreditNote();
  const createDn = useCreateDebitNote();
  const issueDn = useIssueDebitNote();
  const cancelDn = useCancelDebitNote();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (tab === 'credit') { await createCn.mutateAsync(form); toast({ title: 'Credit note created' }); }
      else { await createDn.mutateAsync(form); toast({ title: 'Debit note created' }); }
      setShowForm(false); setForm({ invoiceId: '', reason: '', subtotal: 0, taxAmount: 0, totalAmount: 0, notes: '' });
    } catch { toast({ title: 'Failed', variant: 'destructive' }); }
  };

  const notes = tab === 'credit' ? creditNotes : debitNotes;
  const isLoading = tab === 'credit' ? cl : dl;

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Credit & Debit Notes" description="GST-compliant credit and debit note management" actions={
        <Button onClick={() => setShowForm(!showForm)}><Plus className="mr-2 h-4 w-4" /> Create {tab === 'credit' ? 'Credit' : 'Debit'} Note</Button>
      } />

      <div className="flex gap-2 mb-4">
        <Button variant={tab === 'credit' ? 'default' : 'outline'} onClick={() => setTab('credit')}>Credit Notes</Button>
        <Button variant={tab === 'debit' ? 'default' : 'outline'} onClick={() => setTab('debit')}>Debit Notes</Button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-lg border border-gray-700" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Create {tab === 'credit' ? 'Credit' : 'Debit'} Note</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div><Label>Invoice ID *</Label><Input required value={form.invoiceId} onChange={e => setForm(p => ({ ...p, invoiceId: e.target.value }))} /></div>
              <div><Label>Reason *</Label><Input required value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Subtotal</Label><Input type="number" min={0} value={form.subtotal} onChange={e => setForm(p => ({ ...p, subtotal: Number(e.target.value) }))} /></div>
                <div><Label>Tax</Label><Input type="number" min={0} value={form.taxAmount} onChange={e => setForm(p => ({ ...p, taxAmount: Number(e.target.value) }))} /></div>
                <div><Label>Total *</Label><Input required type="number" min={0} value={form.totalAmount} onChange={e => setForm(p => ({ ...p, totalAmount: Number(e.target.value) }))} /></div>
              </div>
              <div><Label>Notes</Label><Input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {gstSummary && (
          <>
            <Card><CardHeader className="p-4 pb-2"><CardTitle className="text-xs text-gray-400">Total Notes</CardTitle></CardHeader><CardContent className="p-4 pt-0 text-2xl font-bold">{gstSummary.count}</CardContent></Card>
            <Card><CardHeader className="p-4 pb-2"><CardTitle className="text-xs text-gray-400">Total Value</CardTitle></CardHeader><CardContent className="p-4 pt-0 text-2xl font-bold">₹{gstSummary.totalValue.toLocaleString()}</CardContent></Card>
            <Card><CardHeader className="p-4 pb-2"><CardTitle className="text-xs text-gray-400">GST (CGST+SGST+IGST)</CardTitle></CardHeader><CardContent className="p-4 pt-0 text-2xl font-bold">₹{(gstSummary.totalCgst + gstSummary.totalSgst + gstSummary.totalIgst).toLocaleString()}</CardContent></Card>
          </>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle>{tab === 'credit' ? 'Credit' : 'Debit'} Notes ({(notes as any)?.meta?.total || 0})</CardTitle></CardHeader>
        <CardContent className="p-0">
          {isLoading ? <TableSkeleton rows={5} /> : !(notes as any)?.data?.length ? <div className="p-8 text-center text-gray-400">No notes</div> : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-gray-700 text-left text-sm text-gray-400"><th className="p-3">Number</th><th className="p-3">Invoice</th><th className="p-3">Reason</th><th className="p-3">Amount</th><th className="p-3">Status</th><th className="p-3">Date</th><th className="p-3"></th></tr></thead>
                <tbody>
                  {(notes as any)?.data?.map((n: any) => (
                    <tr key={n.id} className="border-b border-gray-700/50">
                      <td className="p-3 text-sm font-medium">{n.creditNoteNumber || n.debitNoteNumber}</td>
                      <td className="p-3 text-sm">{n.invoice?.invoiceNumber || n.invoiceId}</td>
                      <td className="p-3 text-sm text-gray-400">{n.reason}</td>
                      <td className="p-3 text-sm">₹{Number(n.totalAmount).toLocaleString()}</td>
                      <td className="p-3"><Badge className={STATUS_STYLES[n.status] || ''}>{n.status}</Badge></td>
                      <td className="p-3 text-sm text-gray-400">{new Date(n.createdAt).toLocaleDateString()}</td>
                      <td className="p-3 flex gap-1">
                        {n.status === 'DRAFT' && <Button size="sm" variant="ghost" onClick={async () => { try { tab === 'credit' ? await issueCn.mutateAsync(n.id) : await issueDn.mutateAsync(n.id); toast({ title: 'Issued' }); } catch { toast({ title: 'Failed', variant: 'destructive' }); } }}><CheckCircle className="h-4 w-4 text-green-400" /></Button>}
                        {n.status !== 'CANCELLED' && <Button size="sm" variant="ghost" onClick={async () => { const r = prompt('Cancel reason:'); if (r) { try { tab === 'credit' ? await cancelCn.mutateAsync({ id: n.id, reason: r }) : await cancelDn.mutateAsync({ id: n.id, reason: r }); toast({ title: 'Cancelled' }); } catch { toast({ title: 'Failed', variant: 'destructive' }); } } }}><XCircle className="h-4 w-4 text-red-400" /></Button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
