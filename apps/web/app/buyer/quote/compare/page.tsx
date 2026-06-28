'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DashboardPageHeader, StatusBadge } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, Check, X, MessageSquare, DollarSign, Clock, Shield,
  Star, TrendingUp, Award, MapPin, Package, FileText, Handshake,
} from 'lucide-react';
import { useState } from 'react';
import { useStartNegotiation } from '@/hooks/use-smart-negotiation';

const MOCK_QUOTES = [
  {
    id: 'q1', companyName: 'Premium Steel Works', slug: 'premium-steel', logo: null,
    trustScore: 92, verificationLevel: 'LEVEL_6', responseRate: 0.98,
    totalAmount: 295000, subtotal: 250000, taxAmount: 45000, discountAmount: 10000, discountPercent: 4,
    deliveryTerms: 'CIF', paymentTerms: 'CREDIT_30', leadTimeDays: 21, validityDate: '2026-08-15',
    warranty: '12 months', freight: 'Included', currency: 'INR', status: 'SUBMITTED',
    lineItems: [{ productName: 'Industrial Bearing Set', quantity: 500, unit: 'pcs', unitPrice: 350 }],
  },
  {
    id: 'q2', companyName: 'Allied Manufacturing Co.', slug: 'allied-mfg', logo: null,
    trustScore: 85, verificationLevel: 'LEVEL_5', responseRate: 0.92,
    totalAmount: 282000, subtotal: 240000, taxAmount: 43200, discountAmount: 1200, discountPercent: 0.5,
    deliveryTerms: 'CIF', paymentTerms: 'CREDIT_15', leadTimeDays: 28, validityDate: '2026-08-10',
    warranty: '6 months', freight: '₹5,000 extra', currency: 'INR', status: 'SUBMITTED',
    lineItems: [{ productName: 'Industrial Bearing Set', quantity: 500, unit: 'pcs', unitPrice: 335 }],
  },
  {
    id: 'q3', companyName: 'National Hardware Supply', slug: 'national-hw', logo: null,
    trustScore: 88, verificationLevel: 'LEVEL_5', responseRate: 0.95,
    totalAmount: 310000, subtotal: 265000, taxAmount: 47700, discountAmount: 2700, discountPercent: 1,
    deliveryTerms: 'EX_WORKS', paymentTerms: 'ADVANCE', leadTimeDays: 14, validityDate: '2026-07-30',
    warranty: '24 months', freight: 'Buyer pays', currency: 'INR', status: 'SUBMITTED',
    lineItems: [{ productName: 'Industrial Bearing Set', quantity: 500, unit: 'pcs', unitPrice: 380 }],
  },
];

function QuoteComparePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rfqId = searchParams.get('rfqId') || '';
  const [selected, setSelected] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const startNegMutation = useStartNegotiation();
  const handleNegotiate = async (quoteId: string) => {
    try {
      await startNegMutation.mutateAsync({ quoteId });
      router.push('/buyer/negotiation');
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to start negotiation');
    }
  };

  const columns = [
    { key: 'supplier', label: 'Supplier' },
    { key: 'price', label: 'Price (₹)' },
    { key: 'moq', label: 'MOQ' },
    { key: 'leadTime', label: 'Lead Time' },
    { key: 'gst', label: 'GST' },
    { key: 'freight', label: 'Freight' },
    { key: 'validity', label: 'Valid Until' },
    { key: 'warranty', label: 'Warranty' },
    { key: 'trust', label: 'Trust Score' },
    { key: 'response', label: 'Response Rate' },
    { key: 'delivery', label: 'Delivery Terms' },
    { key: 'payment', label: 'Payment Terms' },
  ];

  const getCell = (q: any, key: string) => {
    switch (key) {
      case 'supplier':
        return (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/10 text-orange-400 text-xs font-bold">
              {q.companyName.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium text-white truncate max-w-[120px]">{q.companyName}</p>
              {q.verificationLevel && (
                <div className="flex items-center gap-1">
                  <Shield className="h-3 w-3 text-green-400" />
                  <span className="text-[10px] text-green-400/70">{q.verificationLevel.replace('LEVEL_', 'L')}</span>
                </div>
              )}
            </div>
          </div>
        );
      case 'price':
        return <p className="text-sm font-bold text-white">₹{q.totalAmount?.toLocaleString('en-IN')}</p>;
      case 'moq':
        return <p className="text-sm text-white/80">{q.lineItems?.[0]?.quantity || 1} {q.lineItems?.[0]?.unit || 'pcs'}</p>;
      case 'leadTime':
        return (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-white/40" />
            <span className="text-sm text-white/80">{q.leadTimeDays ? `${q.leadTimeDays}d` : '-'}</span>
          </div>
        );
      case 'gst':
        return <p className="text-sm text-white/80">₹{q.taxAmount?.toLocaleString('en-IN')}</p>;
      case 'freight':
        return <p className="text-sm text-white/80">{q.freight || '-'}</p>;
      case 'validity':
        return <p className="text-sm text-white/80">{q.validityDate ? new Date(q.validityDate).toLocaleDateString('en-IN') : '-'}</p>;
      case 'warranty':
        return <p className="text-sm text-white/80">{q.warranty || '-'}</p>;
      case 'trust':
        return (
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 text-amber-400" />
            <span className="text-sm font-medium text-white">{q.trustScore}%</span>
          </div>
        );
      case 'response':
        return (
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-green-400" />
            <span className="text-sm text-white/80">{Math.round((q.responseRate || 0) * 100)}%</span>
          </div>
        );
      case 'delivery':
        return <Badge variant="secondary" className="text-[10px]">{q.deliveryTerms || '-'}</Badge>;
      case 'payment':
        return <span className="text-xs text-white/60">{q.paymentTerms?.replace('_', ' ') || '-'}</span>;
      default:
        return '-';
    }
  };

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Compare Quotes"
        description={rfqId ? `RFQ: ${rfqId.slice(0, 8)}` : 'Side-by-side quotation comparison'}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="accent" disabled={selected.length === 0}>
              <Check className="mr-2 h-4 w-4" />Accept Selected
            </Button>
            <Button variant="ghost" onClick={() => router.push('/buyer/quote')}>
              <ArrowLeft className="mr-2 h-4 w-4" />Back
            </Button>
          </div>
        }
      />

      {/* Horizontal scrollable comparison table */}
      <div className="overflow-x-auto rounded-xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="sticky left-0 z-10 bg-[#1D0001] px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/40 min-w-[140px]">
                Criteria
              </th>
              {MOCK_QUOTES.map((q) => (
                <th key={q.id} className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider min-w-[180px] ${
                  selected.includes(q.id) ? 'bg-orange-500/10' : ''
                }`}>
                  <div className="flex items-center justify-center gap-2">
                    <input
                      type="checkbox"
                      checked={selected.includes(q.id)}
                      onChange={() => toggleSelect(q.id)}
                      className="h-4 w-4 rounded border-white/20 bg-white/[0.04] text-orange-500 focus:ring-orange-500"
                    />
                    <StatusBadge status={q.status} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {columns.map((col) => (
              <tr key={col.key} className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.02]">
                <td className="sticky left-0 z-10 bg-[#1D0001] px-4 py-3 text-xs font-medium text-white/60">
                  {col.label}
                </td>
                {MOCK_QUOTES.map((q) => (
                  <td key={q.id} className={`px-4 py-3 text-center ${selected.includes(q.id) ? 'bg-orange-500/5' : ''}`}>
                    {getCell(q, col.key)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected.length > 0 && (
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/10 p-4 backdrop-blur-xl">
          <p className="text-sm font-medium text-orange-400">
            {selected.length} quote(s) selected
          </p>
          <p className="mt-1 text-xs text-white/50">
            You can accept, message sellers, or continue comparing.
          </p>
          <div className="mt-3 flex gap-2">
            <Button variant="accent" size="sm"><Check className="mr-1 h-3 w-3" />Accept</Button>
            <Button variant="outline" size="sm"><MessageSquare className="mr-1 h-3 w-3" />Message Sellers</Button>
            <Button variant="outline" size="sm" onClick={() => handleNegotiate(selected[0])} disabled={selected.length !== 1}>
              <Handshake className="mr-1 h-3 w-3" />Negotiate
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelected([])}>Clear Selection</Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function QuoteComparePageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" /></div>}>
      <QuoteComparePage />
    </Suspense>
  );
}
