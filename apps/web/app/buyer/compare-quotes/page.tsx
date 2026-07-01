'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DashboardPageHeader, StatusBadge } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Star, Clock, Loader2, ArrowLeft, Check } from 'lucide-react';
import { smartRfqApi } from '@/lib/api/smart-rfq';
import { useToast } from '@/components/ui/use-toast';

function CompareQuotesContent() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const rfqId = searchParams.get('rfqId') || '';
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  useEffect(() => {
    if (!rfqId) { setLoading(false); return; }
    smartRfqApi.getQuotes(rfqId)
      .then(setQuotes)
      .catch(() => toast({ title: 'Failed to load quotes', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [rfqId]);

  const handleAccept = async (quoteId: string) => {
    setAcceptingId(quoteId);
    try {
      await smartRfqApi.acceptQuote(rfqId, quoteId);
      toast({ title: 'Quote accepted' });
      router.push(`/buyer/order?rfqId=${rfqId}`);
    } catch {
      toast({ title: 'Failed to accept quote', variant: 'destructive' });
    } finally {
      setAcceptingId(null);
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
        <div className="flex items-center justify-center py-20 text-text-secondary">No quotes available yet.</div>
      </div>
    );
  }

  const lowestPrice = Math.min(...quotes.map((q: any) => q.totalAmount || q.subtotal || 0));
  const highestRating = Math.max(...quotes.map((q: any) => q.company?.trustScore || 0));
  const quickestDelivery = Math.min(...quotes.map((q: any) => q.leadTimeDays || 999));

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Compare Quotes"
        description={`Comparing ${quotes.length} quote(s)`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="mr-1 h-4 w-4" />Back
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-secondary/50 dark:border-dark-border dark:bg-dark-surface-secondary/50">
                  <th className="px-4 py-3 text-xs font-medium uppercase text-text-secondary dark:text-dark-text-secondary">Parameter</th>
                  {quotes.map((q: any) => (
                    <th key={q.id} className="px-4 py-3 text-xs font-medium uppercase text-text-secondary dark:text-dark-text-secondary">
                      {q.company?.name || 'Supplier'}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border dark:border-dark-border">
                  <td className="px-4 py-3 text-sm font-medium text-text-primary dark:text-dark-text-primary">Total Price</td>
                  {quotes.map((q: any) => {
                    const price = q.totalAmount || q.subtotal || 0;
                    const isBest = price === lowestPrice;
                    return (
                      <td key={q.id} className={`px-4 py-3 font-semibold ${isBest ? 'text-accent-600' : 'text-text-primary dark:text-dark-text-primary'}`}>
                        {price.toLocaleString('en-IN')}
                        {isBest && <span className="ml-1.5 text-xs text-accent-600">Best</span>}
                      </td>
                    );
                  })}
                </tr>
                <tr className="border-b border-border dark:border-dark-border">
                  <td className="px-4 py-3 text-sm font-medium text-text-primary dark:text-dark-text-primary">Delivery Time</td>
                  {quotes.map((q: any) => (
                    <td key={q.id} className={`px-4 py-3 ${q.leadTimeDays === quickestDelivery ? 'font-semibold text-accent-600' : 'text-text-secondary dark:text-dark-text-secondary'}`}>
                      {q.leadTimeDays ? `${q.leadTimeDays} days` : 'Not specified'}
                      {q.leadTimeDays === quickestDelivery && <span className="ml-1.5 text-xs text-accent-600">Fastest</span>}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-border dark:border-dark-border">
                  <td className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-text-primary dark:text-dark-text-primary">
                    <Star className="h-4 w-4 text-text-tertiary" />
                    Seller Trust Score
                  </td>
                  {quotes.map((q: any) => {
                    const score = q.company?.trustScore || 0;
                    const isBest = score === highestRating;
                    return (
                      <td key={q.id} className={`px-4 py-3 ${isBest ? 'font-semibold text-amber-600' : 'text-text-secondary dark:text-dark-text-secondary'}`}>
                        {score}%
                        {isBest && <span className="ml-1.5 text-xs text-amber-600">Top</span>}
                      </td>
                    );
                  })}
                </tr>
                <tr className="border-b border-border dark:border-dark-border">
                  <td className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-text-primary dark:text-dark-text-primary">
                    <Clock className="h-4 w-4 text-text-tertiary" />
                    Validity
                  </td>
                  {quotes.map((q: any) => (
                    <td key={q.id} className="px-4 py-3 text-text-secondary dark:text-dark-text-secondary">
                      {q.validityDate ? new Date(q.validityDate).toLocaleDateString('en-IN') : '-'}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-border dark:border-dark-border">
                  <td className="px-4 py-3 text-sm font-medium text-text-primary dark:text-dark-text-primary">Delivery Terms</td>
                  {quotes.map((q: any) => (
                    <td key={q.id} className="px-4 py-3 text-text-secondary dark:text-dark-text-secondary">{q.deliveryTerms || '-'}</td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-text-primary dark:text-dark-text-primary">Payment Terms</td>
                  {quotes.map((q: any) => (
                    <td key={q.id} className="px-4 py-3 text-text-secondary dark:text-dark-text-secondary">
                      {q.paymentTerms ? q.paymentTerms.replace(/_/g, ' ') : '-'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {quotes.map((q: any) => {
          const price = q.totalAmount || q.subtotal || 0;
          const bestPrice = price === lowestPrice;
          return (
            <Card key={q.id} className={`relative ${bestPrice ? 'border-accent-500 dark:border-accent-600' : ''}`}>
              {bestPrice && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center rounded-full bg-accent-600 px-3 py-0.5 text-[10px] font-semibold text-white">
                    Best Price
                  </span>
                </div>
              )}
              <CardContent className="p-5">
                <div className="text-center">
                  <h3 className="text-base font-semibold text-text-primary dark:text-dark-text-primary">{q.company?.name || 'Supplier'}</h3>
                  {q.company?.trustScore && (
                    <div className="mt-1 flex items-center justify-center gap-1 text-sm text-amber-600">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      {q.company.trustScore}%
                    </div>
                  )}
                </div>
                <Separator className="my-4" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-text-primary dark:text-dark-text-primary">{price.toLocaleString('en-IN')}</p>
                </div>
                <Separator className="my-4" />
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary dark:text-dark-text-secondary">Delivery</span>
                    <span className="font-medium text-text-primary dark:text-dark-text-primary">{q.leadTimeDays ? `${q.leadTimeDays} days` : '-'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary dark:text-dark-text-secondary">Validity</span>
                    <span className="font-medium text-text-primary dark:text-dark-text-primary">{q.validityDate ? new Date(q.validityDate).toLocaleDateString('en-IN') : '-'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary dark:text-dark-text-secondary">Payment</span>
                    <span className="text-right text-xs font-medium text-text-primary dark:text-dark-text-primary">{q.paymentTerms?.replace(/_/g, ' ') || '-'}</span>
                  </div>
                </div>
                <Button className="mt-4 w-full" onClick={() => handleAccept(q.id)} disabled={acceptingId === q.id}>
                  {acceptingId === q.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {acceptingId === q.id ? 'Accepting...' : 'Accept Quote'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default function CompareQuotesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>}>
      <CompareQuotesContent />
    </Suspense>
  );
}
