'use client';

import { Suspense, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardPageHeader, StatusBadge } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useSmartRfq } from '@/hooks/use-smart-rfq';
import { useCreateQuote, useSubmitQuote } from '@/hooks/use-smart-quote';
import { ArrowLeft, Send, Save, DollarSign, Package, Clock, Shield, FileText } from 'lucide-react';

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED'];
const DELIVERY_TERMS = ['EX_WORKS', 'FOB', 'CIF', 'CFR', 'CPT', 'CIP', 'DAP', 'DDP'];
const PAYMENT_TERMS_LIST = ['ADVANCE', 'COD', 'CREDIT_15', 'CREDIT_30', 'CREDIT_60', 'LC', 'ESCROW'];

function NewQuotePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rfqId = searchParams.get('rfqId') || '';
  const { data: rfq } = useSmartRfq(rfqId);

  const [form, setForm] = useState({
    currency: 'INR',
    subtotal: '',
    taxAmount: '',
    totalAmount: '',
    discountAmount: '',
    discountPercent: '',
    deliveryTerms: '',
    paymentTerms: '',
    leadTimeDays: '',
    validityDate: '',
    notes: '',
    lineItems: (rfq?.productItems ?? []).map((p: any) => ({
      rfqProductItemId: p.id,
      productName: p.productName,
      description: p.description || '',
      quantity: p.quantity || 1,
      unit: p.unit || 'pcs',
      unitPrice: '',
    })),
  });

  const companyId = 'company-id-placeholder'; // Resolve from auth store

  const createMutation = useCreateQuote();
  const submitMutation = useSubmitQuote();
  const [saving, setSaving] = useState(false);

  const update = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));
  const updateLineItem = (index: number, key: string, value: any) => {
    setForm((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((li: any, i: number) => (i === index ? { ...li, [key]: value } : li)),
    }));
  };

  const buildPayload = () => {
    const subtotal = parseFloat(form.subtotal) || 0;
    const discountAmount = parseFloat(form.discountAmount) || 0;
    const discountPercent = parseFloat(form.discountPercent) || 0;
    const taxAmount = parseFloat(form.taxAmount) || 0;
    const totalAmount = parseFloat(form.totalAmount) || (subtotal - discountAmount + taxAmount);
    return {
      currency: form.currency,
      subtotal,
      taxAmount,
      totalAmount,
      discountAmount,
      discountPercent,
      deliveryTerms: form.deliveryTerms || undefined,
      paymentTerms: form.paymentTerms || undefined,
      leadTimeDays: form.leadTimeDays ? parseInt(form.leadTimeDays) : undefined,
      validityDate: form.validityDate || undefined,
      notes: form.notes || undefined,
      lineItems: form.lineItems.map((li: any) => ({
        rfqProductItemId: li.rfqProductItemId || undefined,
        productName: li.productName,
        description: li.description || undefined,
        quantity: li.quantity ? parseInt(li.quantity) : undefined,
        unit: li.unit,
        unitPrice: parseFloat(li.unitPrice) || 0,
      })),
    };
  };

  const handleSave = async (submitAfter: boolean) => {
    setSaving(true);
    try {
      const payload = buildPayload();
      const quote = await createMutation.mutateAsync({ companyId, rfqId, data: payload });
      if (submitAfter && quote.id) {
        await submitMutation.mutateAsync({ companyId, rfqId, quoteId: quote.id });
      }
      router.push('/seller/quote');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Create Quotation"
        description={rfq ? `For: ${rfq.title || rfq.rfqNumber || rfqId?.slice(0, 8)}` : 'Select an RFQ to quote on'}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />Save Draft
            </Button>
            <Button variant="accent" onClick={() => handleSave(true)} disabled={saving}>
              <Send className="mr-2 h-4 w-4" />{saving ? 'Saving...' : 'Submit Quote'}
            </Button>
            <Button variant="ghost" onClick={() => router.push('/seller/rfq')}>
              <ArrowLeft className="mr-2 h-4 w-4" />Back
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Line Items */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-white/60 mb-4">
              <Package className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Products / Line Items</span>
            </div>
            <div className="space-y-3">
              {form.lineItems.map((li: any, i: number) => (
                <div key={i} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                  <div className="grid gap-3 sm:grid-cols-4">
                    <div className="sm:col-span-2">
                      <Label className="text-xs text-white/60">Product *</Label>
                      <Input
                        value={li.productName}
                        onChange={(e) => updateLineItem(i, 'productName', e.target.value)}
                        className="bg-white/[0.04] border-white/[0.06] text-white mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-white/60">Qty</Label>
                      <Input
                        type="number" min={1}
                        value={li.quantity}
                        onChange={(e) => updateLineItem(i, 'quantity', e.target.value)}
                        className="bg-white/[0.04] border-white/[0.06] text-white mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-white/60">Unit Price *</Label>
                      <Input
                        type="number" min={0} step={0.01}
                        value={li.unitPrice}
                        onChange={(e) => updateLineItem(i, 'unitPrice', e.target.value)}
                        className="bg-white/[0.04] border-white/[0.06] text-white mt-1"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-white/60 mb-4">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Pricing</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <Label className="text-xs text-white/60">Currency</Label>
                <select
                  value={form.currency}
                  onChange={(e) => update('currency', e.target.value)}
                  className="w-full rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                >
                  {CURRENCIES.map((c) => <option key={c} value={c} className="bg-gray-900 text-white">{c}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-white/60">Subtotal</Label>
                <Input type="number" min={0} step={0.01} value={form.subtotal} onChange={(e) => update('subtotal', e.target.value)} className="bg-white/[0.04] border-white/[0.06] text-white" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-white/60">Discount %</Label>
                <Input type="number" min={0} max={100} step={0.01} value={form.discountPercent} onChange={(e) => update('discountPercent', e.target.value)} className="bg-white/[0.04] border-white/[0.06] text-white" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-white/60">Tax (GST)</Label>
                <Input type="number" min={0} step={0.01} value={form.taxAmount} onChange={(e) => update('taxAmount', e.target.value)} className="bg-white/[0.04] border-white/[0.06] text-white" />
              </div>
            </div>
            <div className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Total Amount</span>
                <span className="font-bold text-white">
                  {form.currency} {(() => {
                    const s = parseFloat(form.subtotal) || 0;
                    const d = parseFloat(form.discountAmount) || (parseFloat(form.discountPercent) ? s * parseFloat(form.discountPercent) / 100 : 0);
                    const t = parseFloat(form.taxAmount) || 0;
                    return (s - d + t).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                  })()}
                </span>
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-white/60 mb-4">
              <FileText className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Terms & Delivery</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <Label className="text-xs text-white/60">Delivery Terms</Label>
                <select value={form.deliveryTerms} onChange={(e) => update('deliveryTerms', e.target.value)}
                  className="w-full rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50">
                  <option value="" className="bg-gray-900 text-white/60">Select</option>
                  {DELIVERY_TERMS.map((t) => <option key={t} value={t} className="bg-gray-900 text-white">{t.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-white/60">Payment Terms</Label>
                <select value={form.paymentTerms} onChange={(e) => update('paymentTerms', e.target.value)}
                  className="w-full rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50">
                  <option value="" className="bg-gray-900 text-white/60">Select</option>
                  {PAYMENT_TERMS_LIST.map((t) => <option key={t} value={t} className="bg-gray-900 text-white">{t.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-white/60">Lead Time (days)</Label>
                <Input type="number" min={1} value={form.leadTimeDays} onChange={(e) => update('leadTimeDays', e.target.value)} className="bg-white/[0.04] border-white/[0.06] text-white" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-white/60">Validity Date</Label>
                <Input type="date" value={form.validityDate} onChange={(e) => update('validityDate', e.target.value)} className="bg-white/[0.04] border-white/[0.06] text-white" />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <Label className="text-xs text-white/60">Notes</Label>
              <textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} rows={3}
                className="w-full rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                placeholder="Warranty, freight, GST details, remarks..."
              />
            </div>
          </div>
        </div>

        {/* Right sidebar - RFQ Info */}
        <div className="space-y-4">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-5 backdrop-blur-xl">
            <h3 className="text-xs font-medium uppercase tracking-wider text-white/60 mb-3">RFQ Details</h3>
            {rfq ? (
              <dl className="space-y-3">
                <div><dt className="text-xs text-white/40">Title</dt><dd className="text-sm text-white">{rfq.title || 'N/A'}</dd></div>
                <div><dt className="text-xs text-white/40">Status</dt><dd><StatusBadge status={rfq.status} /></dd></div>
                <div><dt className="text-xs text-white/40">Products Required</dt><dd className="text-sm text-white">{rfq.productItems?.length ?? 0}</dd></div>
                {rfq.expiresAt && <div><dt className="text-xs text-white/40">Expires</dt><dd className="text-sm text-white">{new Date(rfq.expiresAt).toLocaleDateString('en-IN')}</dd></div>}
              </dl>
            ) : (
              <p className="text-sm text-white/40">Loading...</p>
            )}
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-5 backdrop-blur-xl">
            <h3 className="text-xs font-medium uppercase tracking-wider text-white/60 mb-3">Quick Tips</h3>
            <ul className="space-y-2 text-xs text-white/50">
              <li className="flex items-start gap-2"><Shield className="h-3 w-3 mt-0.5 shrink-0" /> Competitive pricing increases acceptance chance</li>
              <li className="flex items-start gap-2"><Clock className="h-3 w-3 mt-0.5 shrink-0" /> Shorter lead time = higher ranking</li>
              <li className="flex items-start gap-2"><FileText className="h-3 w-3 mt-0.5 shrink-0" /> Detailed terms reduce negotiation rounds</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewQuotePageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" /></div>}>
      <NewQuotePage />
    </Suspense>
  );
}
