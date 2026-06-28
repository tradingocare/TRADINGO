'use client';

import { useParams, useRouter } from 'next/navigation';
import { DashboardPageHeader, StatusBadge } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Package, DollarSign, Clock, Calendar, MapPin } from 'lucide-react';
import { useState } from 'react';

const MOCK_QUOTE = {
  id: 'qtc-001',
  rfqId: 'rfq-001',
  status: 'SUBMITTED',
  currency: 'INR',
  subtotal: 250000,
  taxAmount: 45000,
  totalAmount: 295000,
  discountAmount: 10000,
  discountPercent: 4,
  deliveryTerms: 'CIF',
  paymentTerms: 'CREDIT_30',
  leadTimeDays: 21,
  validityDate: '2026-08-15',
  notes: 'Price includes GST. Freight additional for Northeast regions. 12-month warranty on all parts.',
  quoteVersion: 1,
  createdAt: new Date().toISOString(),
  lineItems: [
    { productName: 'Industrial Bearing Set', quantity: 500, unit: 'pcs', unitPrice: 350, totalPrice: 175000 },
    { productName: 'Steel Roller Chain', quantity: 200, unit: 'm', unitPrice: 375, totalPrice: 75000 },
  ],
};

export default function SellerQuoteDetail() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params.id as string;
  const quote = MOCK_QUOTE;

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
              {quote.lineItems.map((item: any, i: number) => (
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
            </div>
            <div className="mt-3 space-y-1 border-t border-white/[0.06] pt-3">
              <div className="flex justify-between text-sm"><span className="text-white/60">Subtotal</span><span className="text-white">₹{quote.subtotal?.toLocaleString('en-IN')}</span></div>
              {quote.discountAmount > 0 && <div className="flex justify-between text-sm"><span className="text-white/60">Discount</span><span className="text-green-400">-₹{quote.discountAmount?.toLocaleString('en-IN')}</span></div>}
              <div className="flex justify-between text-sm"><span className="text-white/60">GST</span><span className="text-white">₹{quote.taxAmount?.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between text-base font-bold border-t border-white/[0.06] pt-2"><span className="text-white/80">Total</span><span className="text-white">₹{quote.totalAmount?.toLocaleString('en-IN')}</span></div>
            </div>
          </div>

          {quote.notes && (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-5 backdrop-blur-xl">
              <h3 className="text-xs font-medium uppercase tracking-wider text-white/60 mb-2">Notes</h3>
              <p className="text-sm text-white/80">{quote.notes}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-5 backdrop-blur-xl">
            <h3 className="text-xs font-medium uppercase tracking-wider text-white/60 mb-3">Status</h3>
            <StatusBadge status={quote.status} className="text-sm" />
            <p className="mt-1 text-xs text-white/40">Version {quote.quoteVersion}</p>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-5 backdrop-blur-xl">
            <h3 className="text-xs font-medium uppercase tracking-wider text-white/60 mb-3">Terms</h3>
            <dl className="space-y-2">
              <div><dt className="text-xs text-white/40">Delivery</dt><dd className="text-sm text-white">{quote.deliveryTerms || 'Not set'}</dd></div>
              <div><dt className="text-xs text-white/40">Payment</dt><dd className="text-sm text-white">{quote.paymentTerms || 'Not set'}</dd></div>
              <div><dt className="text-xs text-white/40">Lead Time</dt><dd className="text-sm text-white">{quote.leadTimeDays ? `${quote.leadTimeDays} days` : 'Not set'}</dd></div>
              <div><dt className="text-xs text-white/40">Valid Until</dt><dd className="text-sm text-white">{quote.validityDate ? new Date(quote.validityDate).toLocaleDateString('en-IN') : 'Not set'}</dd></div>
              <div><dt className="text-xs text-white/40">Created</dt><dd className="text-sm text-white">{new Date(quote.createdAt).toLocaleDateString('en-IN')}</dd></div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
