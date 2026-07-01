'use client';

import { useParams, useRouter } from 'next/navigation';
import { DashboardPageHeader, StatusBadge, TableSkeleton } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Package, ArrowLeft } from 'lucide-react';
import { useQuote } from '@/hooks/use-quotes';

export default function SellerQuoteDetail() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params.id as string;
  const { data: quote, isLoading, error } = useQuote(quoteId);

  if (isLoading) return <div className="space-y-6"><DashboardPageHeader title="Loading..." /><TableSkeleton rows={5} /></div>;

  if (error || !quote) return (
    <div className="space-y-6">
      <DashboardPageHeader title="Quote Not Found" description="This quote could not be loaded." actions={<Button variant="ghost" onClick={() => router.push('/seller/quote')}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>} />
      <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04] p-12 backdrop-blur-xl">
        <p className="text-sm text-white/60">{(error as any)?.message || 'Failed to load quote'}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={`Quote #${quote.id?.slice(0, 8)}`}
        description={quote.rfqId ? `RFQ: ${quote.rfqId.slice(0, 8)}` : ''}
        actions={
          <Button variant="ghost" onClick={() => router.push('/seller/quote')}>
            <ArrowLeft className="mr-2 h-4 w-4" />Back
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-white/60 mb-3">
              <Package className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Line Items</span>
            </div>
            <div className="space-y-2">
              {(quote as any).lineItems?.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                  <div>
                    <p className="text-sm font-medium text-white">{item.productName}</p>
                    <p className="text-xs text-white/40">{item.quantity} {item.unit}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white">₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}</p>
                    <p className="text-xs text-white/40">₹{item.unitPrice}/{item.unit}</p>
                  </div>
                </div>
              ))}
              {!(quote as any).lineItems?.length && <p className="text-sm text-white/40">No line items</p>}
            </div>
            <div className="mt-3 space-y-1 border-t border-white/[0.06] pt-3">
              <div className="flex justify-between text-sm"><span className="text-white/60">Subtotal</span><span className="text-white">₹{Number((quote as any).subtotal || 0).toLocaleString('en-IN')}</span></div>
              {Number((quote as any).discountAmount || 0) > 0 && <div className="flex justify-between text-sm"><span className="text-white/60">Discount</span><span className="text-green-400">-₹{Number((quote as any).discountAmount).toLocaleString('en-IN')}</span></div>}
              <div className="flex justify-between text-sm"><span className="text-white/60">GST</span><span className="text-white">₹{Number((quote as any).taxAmount || 0).toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between text-base font-bold border-t border-white/[0.06] pt-2"><span className="text-white/80">Total</span><span className="text-white">₹{Number((quote as any).totalAmount || 0).toLocaleString('en-IN')}</span></div>
            </div>
          </div>

          {(quote as any).notes && (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-5 backdrop-blur-xl">
              <h3 className="text-xs font-medium uppercase tracking-wider text-white/60 mb-2">Notes</h3>
              <p className="text-sm text-white/80">{(quote as any).notes}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-5 backdrop-blur-xl">
            <h3 className="text-xs font-medium uppercase tracking-wider text-white/60 mb-3">Status</h3>
            <StatusBadge status={(quote as any).status} className="text-sm" />
            <p className="mt-1 text-xs text-white/40">Version {(quote as any).quoteVersion}</p>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-5 backdrop-blur-xl">
            <h3 className="text-xs font-medium uppercase tracking-wider text-white/60 mb-3">Terms</h3>
            <dl className="space-y-2">
              <div><dt className="text-xs text-white/40">Delivery</dt><dd className="text-sm text-white">{(quote as any).deliveryTerms || 'Not set'}</dd></div>
              <div><dt className="text-xs text-white/40">Payment</dt><dd className="text-sm text-white">{(quote as any).paymentTerms || 'Not set'}</dd></div>
              <div><dt className="text-xs text-white/40">Lead Time</dt><dd className="text-sm text-white">{(quote as any).leadTimeDays ? `${(quote as any).leadTimeDays} days` : 'Not set'}</dd></div>
              <div><dt className="text-xs text-white/40">Valid Until</dt><dd className="text-sm text-white">{(quote as any).validityDate ? new Date((quote as any).validityDate).toLocaleDateString('en-IN') : 'Not set'}</dd></div>
              <div><dt className="text-xs text-white/40">Created</dt><dd className="text-sm text-white">{new Date((quote as any).createdAt).toLocaleDateString('en-IN')}</dd></div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
