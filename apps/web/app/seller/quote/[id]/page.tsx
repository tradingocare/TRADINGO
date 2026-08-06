'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardPageHeader, StatusBadge, TableSkeleton } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Package, ArrowLeft, CheckCircle2, Send, XCircle, RotateCcw, Building2, FileText, Clock, Download } from 'lucide-react';
import { useQuote, useSubmitQuote, useWithdrawQuote } from '@/hooks/use-quotes';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/components/ui/use-toast';

export default function SellerQuoteDetail() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params.id as string;
  const { user } = useAuth();
  const { data: quote, isLoading, error, refetch } = useQuote(quoteId);
  const submitMutation = useSubmitQuote();
  const withdrawMutation = useWithdrawQuote();
  const [withdrawReason, setWithdrawReason] = useState('');

  const q: any = quote;
  const status = q?.status ?? '';
  const companyId = q?.company?.id ?? '';
  const rfqId = q?.rfq?.id ?? '';
  const isDraft = status === 'DRAFT';
  const isSubmitted = status === 'SUBMITTED';
  const isViewed = status === 'VIEWED';
  const canSubmit = isDraft;
  const canWithdraw = isSubmitted || isViewed;

  const handleSubmit = async () => {
    if (!companyId || !rfqId) { toast.error('Missing company or RFQ info'); return; }
    try {
      await submitMutation.mutateAsync({ companyId, rfqId, quoteId });
      toast.success('Quote submitted');
      refetch();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to submit');
    }
  };

  const handleWithdraw = async () => {
    if (!companyId || !rfqId) { toast.error('Missing company or RFQ info'); return; }
    try {
      await withdrawMutation.mutateAsync({ companyId, rfqId, quoteId, reason: withdrawReason });
      toast.success('Quote withdrawn');
      refetch();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to withdraw');
    }
  };

  if (isLoading) return <div className="space-y-6"><DashboardPageHeader title="Loading..." /><TableSkeleton rows={5} /></div>;

  if (error || !quote) return (
    <div className="space-y-6">
      <DashboardPageHeader title="Quote Not Found" actions={<Button variant="ghost" onClick={() => router.push('/seller/quote')}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>} />
      <div className="flex flex-col items-center justify-center surface-card p-12 backdrop-blur-xl">
        <p className="text-sm text-text-secondary">{(error as any)?.message || 'Failed to load quote'}</p>
        <Button variant="outline" className="mt-4" onClick={() => refetch()}>Retry</Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={`Quote #${q.id?.slice(0, 8)}`}
        description={q.rfq?.title ? `RFQ: ${q.rfq.title}` : `RFQ: ${rfqId.slice(0, 8)}`}
        actions={
          <div className="flex items-center gap-2">
            {canSubmit && (
              <Button onClick={handleSubmit} disabled={submitMutation.isPending} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white">
                <Send className="h-4 w-4" /> {submitMutation.isPending ? 'Submitting...' : 'Submit'}
              </Button>
            )}
            {canWithdraw && (
              <Button onClick={handleWithdraw} disabled={withdrawMutation.isPending} variant="destructive" className="flex items-center gap-1.5">
                <XCircle className="h-4 w-4" /> {withdrawMutation.isPending ? 'Withdrawing...' : 'Withdraw'}
              </Button>
            )}
            <Button variant="ghost" onClick={() => router.push('/seller/quote')}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
          </div>
        }
      />

      {canWithdraw && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 backdrop-blur-xl">
          <label className="text-xs font-medium text-amber-300">Withdrawal reason (optional)</label>
          <input value={withdrawReason} onChange={e => setWithdrawReason(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-white/30 focus:border-amber-500/50 focus:outline-none"
            placeholder="Why are you withdrawing this quote?" />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">

          <div className="surface-card p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-text-secondary mb-3">
              <FileText className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">RFQ Details</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">{q.rfq?.title || 'Untitled RFQ'}</p>
                <p className="text-xs text-text-tertiary">Created by: {q.rfq?.createdBy || 'Unknown'}</p>
              </div>
              <StatusBadge status={q.rfq?.status || 'unknown'} />
            </div>
          </div>

          <div className="surface-card p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-text-secondary mb-3">
              <Package className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Line Items</span>
            </div>
            <div className="space-y-2">
              {q.lineItems?.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-surface p-3">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{item.productName}</p>
                    <p className="text-xs text-text-tertiary">{item.quantity} {item.unit}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-text-primary">₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}</p>
                    <p className="text-xs text-text-tertiary">₹{item.unitPrice}/{item.unit}</p>
                  </div>
                </div>
              ))}
              {!q.lineItems?.length && <p className="text-sm text-text-tertiary">No line items</p>}
            </div>
            <div className="mt-3 space-y-1 border-t border-border pt-3">
              <div className="flex justify-between text-sm"><span className="text-text-secondary">Subtotal</span><span className="text-text-primary">₹{Number(q.subtotal || 0).toLocaleString('en-IN')}</span></div>
              {Number(q.discountAmount || 0) > 0 && <div className="flex justify-between text-sm"><span className="text-text-secondary">Discount</span><span className="text-green-400">-₹{Number(q.discountAmount).toLocaleString('en-IN')}</span></div>}
              <div className="flex justify-between text-sm"><span className="text-text-secondary">GST</span><span className="text-text-primary">₹{Number(q.taxAmount || 0).toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between text-base font-bold border-t border-border pt-2"><span className="text-text-secondary">Total</span><span className="text-text-primary">₹{Number(q.totalAmount || 0).toLocaleString('en-IN')}</span></div>
            </div>
          </div>

          {q.attachments?.length > 0 && (
            <div className="surface-card p-5 backdrop-blur-xl">
              <div className="flex items-center gap-2 text-text-secondary mb-3">
                <Download className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wider">Attachments</span>
              </div>
              <div className="space-y-2">
                {q.attachments.map((a: any, i: number) => (
                  <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-border bg-surface p-3 text-sm text-blue-400 hover:bg-surface transition-colors">
                    <Download className="h-3.5 w-3.5" />
                    {a.name || `Attachment ${i + 1}`}
                  </a>
                ))}
              </div>
            </div>
          )}

          {q.notes && (
            <div className="surface-card p-5 backdrop-blur-xl">
              <h3 className="text-xs font-medium uppercase tracking-wider text-text-secondary mb-2">Notes</h3>
              <p className="text-sm text-text-secondary">{q.notes}</p>
            </div>
          )}

          {q.events?.length > 0 && (
            <div className="surface-card p-5 backdrop-blur-xl">
              <div className="flex items-center gap-2 text-text-secondary mb-3">
                <Clock className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wider">Timeline</span>
              </div>
              <div className="space-y-2">
                {q.events.map((ev: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-surface">
                      {ev.eventType === 'SUBMITTED' ? <Send className="h-3 w-3 text-blue-400" /> :
                       ev.eventType === 'ACCEPTED' ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> :
                       ev.eventType === 'REJECTED' ? <XCircle className="h-3 w-3 text-red-400" /> :
                       ev.eventType === 'WITHDRAWN' ? <RotateCcw className="h-3 w-3 text-amber-400" /> :
                       <Clock className="h-3 w-3 text-gray-400" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-text-secondary">{ev.eventType.replace(/_/g, ' ')}</p>
                      <p className="text-[10px] text-text-tertiary">{new Date(ev.createdAt).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="surface-card p-5 backdrop-blur-xl">
            <h3 className="text-xs font-medium uppercase tracking-wider text-text-secondary mb-3">Status</h3>
            <StatusBadge status={q.status} className="text-sm" />
            <p className="mt-1 text-xs text-text-tertiary">Version {q.quoteVersion || 1}</p>
          </div>

          {q.company && (
            <div className="surface-card p-5 backdrop-blur-xl">
              <div className="flex items-center gap-2 text-text-secondary mb-3">
                <Building2 className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wider">Your Company</span>
              </div>
              <p className="text-sm font-medium text-text-primary">{q.company.name}</p>
              <p className="text-xs text-text-tertiary">Trust Score: {q.company.trustScore || 'N/A'}</p>
              <p className="text-xs text-text-tertiary">Verification: {q.company.verificationLevel?.replace('LEVEL_', 'Level ') || 'N/A'}</p>
            </div>
          )}

          <div className="surface-card p-5 backdrop-blur-xl">
            <h3 className="text-xs font-medium uppercase tracking-wider text-text-secondary mb-3">Terms</h3>
            <dl className="space-y-2">
              <div><dt className="text-xs text-text-tertiary">Delivery</dt><dd className="text-sm text-text-primary">{q.deliveryTerms || 'Not set'}</dd></div>
              <div><dt className="text-xs text-text-tertiary">Payment</dt><dd className="text-sm text-text-primary">{q.paymentTerms || 'Not set'}</dd></div>
              <div><dt className="text-xs text-text-tertiary">Lead Time</dt><dd className="text-sm text-text-primary">{q.leadTimeDays ? `${q.leadTimeDays} days` : 'Not set'}</dd></div>
              <div><dt className="text-xs text-text-tertiary">Valid Until</dt><dd className="text-sm text-text-primary">{q.validityDate ? new Date(q.validityDate).toLocaleDateString('en-IN') : 'Not set'}</dd></div>
              <div><dt className="text-xs text-text-tertiary">Created</dt><dd className="text-sm text-text-primary">{new Date(q.createdAt).toLocaleDateString('en-IN')}</dd></div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
