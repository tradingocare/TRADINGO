'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DashboardPageHeader, StatusBadge } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, Check, MessageSquare, Clock, Shield,
  Star, TrendingUp, Handshake, Loader2,
} from 'lucide-react';
import { smartRfqApi } from '@/lib/api/smart-rfq';
import { useStartNegotiation } from '@/hooks/use-smart-negotiation';
import { useToast } from '@/components/ui/use-toast';

function QuoteComparePage() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const rfqId = searchParams.get('rfqId') || '';
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (!rfqId) { setLoading(false); return; }
    smartRfqApi.getQuotes(rfqId)
      .then(setQuotes)
      .catch(() => toast({ title: 'Failed to load quotes', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [rfqId]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const startNegMutation = useStartNegotiation();
  const handleNegotiate = async (quoteId: string) => {
    try {
      await startNegMutation.mutateAsync({ quoteId });
      toast({ title: 'Negotiation started' });
      router.push('/buyer/negotiation');
    } catch {
      toast({ title: 'Failed to start negotiation', variant: 'destructive' });
    }
  };

  const columns = [
    { key: 'supplier', label: 'Supplier' },
    { key: 'price', label: 'Price' },
    { key: 'leadTime', label: 'Lead Time' },
    { key: 'validity', label: 'Valid Until' },
    { key: 'trust', label: 'Trust Score' },
    { key: 'response', label: 'Response Rate' },
    { key: 'delivery', label: 'Delivery Terms' },
    { key: 'payment', label: 'Payment Terms' },
    { key: 'lineItems', label: 'Items' },
  ];

  const getCell = (q: any, key: string) => {
    switch (key) {
      case 'supplier':
        return (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/10 text-orange-400 text-xs font-bold">
              {(q.company?.name || '?').charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium text-white truncate max-w-[120px]">{q.company?.name || 'Unknown'}</p>
              {q.company?.verificationLevel && (
                <div className="flex items-center gap-1">
                  <Shield className="h-3 w-3 text-green-400" />
                  <span className="text-[10px] text-green-400/70">{q.company.verificationLevel.replace('LEVEL_', 'L')}</span>
                </div>
              )}
            </div>
          </div>
        );
      case 'price':
        return <p className="text-sm font-bold text-white">{(q.totalAmount || q.subtotal || 0).toLocaleString('en-IN')}</p>;
      case 'leadTime':
        return (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-white/40" />
            <span className="text-sm text-white/80">{q.leadTimeDays ? `${q.leadTimeDays}d` : '-'}</span>
          </div>
        );
      case 'validity':
        return <p className="text-sm text-white/80">{q.validityDate ? new Date(q.validityDate).toLocaleDateString('en-IN') : '-'}</p>;
      case 'trust':
        return (
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 text-amber-400" />
            <span className="text-sm font-medium text-white">{q.company?.trustScore || 0}%</span>
          </div>
        );
      case 'response':
        return (
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-green-400" />
            <span className="text-sm text-white/80">{Math.round((q.company?.responseRate || 0) * 100)}%</span>
          </div>
        );
      case 'delivery':
        return <Badge variant="secondary" className="text-[10px]">{q.deliveryTerms || '-'}</Badge>;
      case 'payment':
        return <span className="text-xs text-white/60">{q.paymentTerms?.replace(/_/g, ' ') || '-'}</span>;
      case 'lineItems':
        return <span className="text-xs text-white/60">{q.lineItems?.length || 0} item(s)</span>;
      default:
        return '-';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Compare Quotes" />
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>
      </div>
    );
  }

  if (!rfqId || quotes.length === 0) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Compare Quotes" description="No quotes to compare" />
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04] p-12 backdrop-blur-xl">
          <p className="text-white/60">No quotes available for this RFQ yet.</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/buyer/rfq')}>Back to RFQs</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Compare Quotes"
        description={`${quotes.length} quote(s) for RFQ: ${rfqId.slice(0, 8)}`}
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

      <div className="overflow-x-auto rounded-xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="sticky left-0 z-10 bg-[#1D0001] px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/40 min-w-[140px]">
                Criteria
              </th>
              {quotes.map((q: any) => (
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
                {quotes.map((q: any) => (
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
          <p className="text-sm font-medium text-orange-400">{selected.length} quote(s) selected</p>
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
