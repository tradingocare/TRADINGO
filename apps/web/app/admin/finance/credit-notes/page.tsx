'use client';

import { useState } from 'react';
import { DashboardPageHeader, TableSkeleton } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreditNotes, useCreateCreditNote, useIssueCreditNote, useCancelCreditNote, useDebitNotes, useCreateDebitNote, useIssueDebitNote, useCancelDebitNote, useCreditNoteGstSummary } from '@/hooks/use-finance';
import { toast } from '@/components/ui/use-toast';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Plus, CheckCircle, XCircle } from 'lucide-react';

const STATUS_STYLES: Record<string, string> = { DRAFT: 'bg-bg-elevated text-text-tertiary', ISSUED: 'bg-green-500/20 text-green-400', APPLIED: 'bg-blue-500/20 text-blue-400', CANCELLED: 'bg-red-500/20 text-red-400' };

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
    } catch (e) { console.error('Create note failed:', e); toast({ title: 'Failed', variant: 'destructive' }); }
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

      <Modal open={showForm} onClose={() => setShowForm(false)} title={'Create ' + (tab === 'credit' ? 'Credit' : 'Debit') + ' Note'}>
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
      </Modal>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {gstSummary && (
          <>
            <Card><CardHeader className="p-4 pb-2"><CardTitle className="text-xs text-text-tertiary">Total Notes</CardTitle></CardHeader><CardContent className="p-4 pt-0 text-2xl font-bold">{gstSummary.count}</CardContent></Card>
            <Card><CardHeader className="p-4 pb-2"><CardTitle className="text-xs text-text-tertiary">Total Value</CardTitle></CardHeader><CardContent className="p-4 pt-0 text-2xl font-bold">₹{gstSummary.totalValue.toLocaleString()}</CardContent></Card>
            <Card><CardHeader className="p-4 pb-2"><CardTitle className="text-xs text-text-tertiary">GST (CGST+SGST+IGST)</CardTitle></CardHeader><CardContent className="p-4 pt-0 text-2xl font-bold">₹{(gstSummary.totalCgst + gstSummary.totalSgst + gstSummary.totalIgst).toLocaleString()}</CardContent></Card>
          </>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle>{tab === 'credit' ? 'Credit' : 'Debit'} Notes ({(notes as any)?.meta?.total || 0})</CardTitle></CardHeader>
        <CardContent className="p-0">
          {isLoading ? <TableSkeleton rows={5} /> : !(notes as any)?.data?.length ? <EmptyState title="No notes" /> : (
            <Table>
              <THead><TR><TH>Number</TH><TH>Invoice</TH><TH>Reason</TH><TH>Amount</TH><TH>Status</TH><TH>Date</TH><TH></TH></TR></THead>
              <TBody>
                {(notes as any)?.data?.map((n: any) => (
                  <TR key={n.id}>
                    <TD className="font-medium">{n.creditNoteNumber || n.debitNoteNumber}</TD>
                    <TD>{n.invoice?.invoiceNumber || n.invoiceId}</TD>
                    <TD className="text-text-tertiary">{n.reason}</TD>
                    <TD>₹{Number(n.totalAmount).toLocaleString()}</TD>
                    <TD><Badge className={STATUS_STYLES[n.status] || ''}>{n.status}</Badge></TD>
                    <TD className="text-text-tertiary">{new Date(n.createdAt).toLocaleDateString()}</TD>
                    <TD className="flex gap-1">
                      {n.status === 'DRAFT' && <Button size="sm" variant="ghost" onClick={async () => { try { tab === 'credit' ? await issueCn.mutateAsync(n.id) : await issueDn.mutateAsync(n.id); toast({ title: 'Issued' }); } catch (e) { console.error('Issue note failed:', e); toast({ title: 'Failed', variant: 'destructive' }); } }}><CheckCircle className="h-4 w-4 text-green-400" /></Button>}
                      {n.status !== 'CANCELLED' && <Button size="sm" variant="ghost" onClick={async () => { const r = prompt('Cancel reason:'); if (r) { try { tab === 'credit' ? await cancelCn.mutateAsync({ id: n.id, reason: r }) : await cancelDn.mutateAsync({ id: n.id, reason: r }); toast({ title: 'Cancelled' }); } catch (e) { console.error('Cancel note failed:', e); toast({ title: 'Failed', variant: 'destructive' }); } } }}><XCircle className="h-4 w-4 text-red-400" /></Button>}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
