'use client';

import { useParams, useRouter } from 'next/navigation';
import { DashboardPageHeader, StatusBadge } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSmartRfq, useDuplicateSmartRfq } from '@/hooks/use-smart-rfq';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Copy, Edit3, Archive, FileText, Package, Store, MapPin, Clock, Calendar, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function BuyerRfqDetail() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;
  const { data: rfq, isLoading, error } = useSmartRfq(id);
  const duplicateMutation = useDuplicateSmartRfq();

  if (error) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="RFQ Details" />
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04] p-12 backdrop-blur-xl">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="mt-4 text-lg font-medium text-white">RFQ not found</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/buyer/rfq')}>Back to RFQs</Button>
        </div>
      </div>
    );
  }

  if (isLoading || !rfq) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="RFQ Details" />
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-white/[0.04]" />
          ))}
        </div>
      </div>
    );
  }

  const handleDuplicate = async () => {
    try {
      const result = await duplicateMutation.mutateAsync(id);
      toast({ title: 'RFQ duplicated' });
      router.push(`/buyer/rfq/${result.id || result}`);
    } catch {
      toast({ title: 'Failed to duplicate RFQ', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={rfq.title || 'RFQ Details'}
        description={rfq.rfqNumber ? `#${rfq.rfqNumber}` : ''}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {rfq.status === 'DRAFT' && (
              <Link href={`/buyer/rfq/${id}/edit`}>
                <Button variant="outline"><Edit3 className="mr-2 h-4 w-4" />Edit</Button>
              </Link>
            )}
            <Button variant="outline" onClick={handleDuplicate} disabled={duplicateMutation.isPending}>
              <Copy className="mr-2 h-4 w-4" />Duplicate
            </Button>
            <Button variant="ghost" onClick={() => router.push('/buyer/rfq')}>
              <ArrowLeft className="mr-2 h-4 w-4" />Back
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-white/60 mb-3">
              <FileText className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Description</span>
            </div>
            <p className="text-sm text-white/80">{rfq.description || 'No description provided.'}</p>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-white/60 mb-3">
              <Package className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Products</span>
            </div>
            {rfq.productItems?.length > 0 ? (
              <div className="space-y-2">
                {rfq.productItems.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                    <div>
                      <p className="text-sm font-medium text-white">{item.productName}</p>
                      {item.description && <p className="text-xs text-white/40">{item.description}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-white">{item.quantity} {item.unit}</p>
                      {item.targetPrice && <p className="text-xs text-white/40">₹{item.targetPrice}/{item.unit}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/40">No products specified</p>
            )}
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-white/60 mb-3">
              <Store className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Quotes ({rfq.quoteCount ?? 0})</span>
            </div>
            <p className="text-sm text-white/40">Quotes will appear here once suppliers respond.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-5 backdrop-blur-xl">
            <h3 className="text-xs font-medium uppercase tracking-wider text-white/60 mb-3">Status</h3>
            <StatusBadge status={rfq.status} className="text-sm" />
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-5 backdrop-blur-xl">
            <h3 className="text-xs font-medium uppercase tracking-wider text-white/60 mb-3">Details</h3>
            <dl className="space-y-3">
              <div><dt className="text-xs text-white/40">Type</dt><dd className="text-sm text-white">{rfq.rfqType || 'PRODUCT'}</dd></div>
              <div><dt className="text-xs text-white/40">Visibility</dt><dd className="text-sm text-white">{rfq.visibility || 'PUBLIC'}</dd></div>
              <div><dt className="text-xs text-white/40">Source</dt><dd className="text-sm text-white">{rfq.source || 'DIRECT'}</dd></div>
              {rfq.urgency && <div><dt className="text-xs text-white/40">Priority</dt><dd className="text-sm text-white">{rfq.urgency}</dd></div>}
              <div><dt className="text-xs text-white/40">Created</dt><dd className="text-sm text-white">{new Date(rfq.createdAt).toLocaleDateString('en-IN')}</dd></div>
              {rfq.expiresAt && <div><dt className="text-xs text-white/40">Expires</dt><dd className="text-sm text-white">{new Date(rfq.expiresAt).toLocaleDateString('en-IN')}</dd></div>}
            </dl>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-white/60 mb-3">
              <MapPin className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Delivery</span>
            </div>
            {rfq.locations?.length > 0 ? (
              <p className="text-sm text-white/80">{rfq.locations[0].city}, {rfq.locations[0].state}</p>
            ) : (
              <p className="text-sm text-white/40">Not specified</p>
            )}
          </div>

          {rfq.paymentPreference && (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-5 backdrop-blur-xl">
              <h3 className="text-xs font-medium uppercase tracking-wider text-white/60 mb-3">Payment</h3>
              <p className="text-sm text-white/80">{rfq.paymentPreference}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
