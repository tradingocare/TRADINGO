'use client';

import { useParams, useRouter } from 'next/navigation';
import { DashboardPageHeader, StatusBadge } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSmartRfq, useSellerAcceptRfq, useSellerDeclineRfq } from '@/hooks/use-smart-rfq';
import { ArrowLeft, Check, X, MessageSquare, FileText, Package, MapPin, Calendar, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function SellerRfqDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: rfq, isLoading, error } = useSmartRfq(id);
  const acceptMutation = useSellerAcceptRfq();
  const declineMutation = useSellerDeclineRfq();
  const [declineReason, setDeclineReason] = useState('');
  const [showDecline, setShowDecline] = useState(false);

  if (error) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="RFQ Details" />
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04] p-12 backdrop-blur-xl">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="mt-4 text-lg font-medium text-white">RFQ not found</p>
          <Button variant="outline" onClick={() => router.push('/seller/rfq')}>Back</Button>
        </div>
      </div>
    );
  }

  if (isLoading || !rfq) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="RFQ Details" />
        <div className="animate-pulse space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-xl bg-white/[0.04]" />)}</div>
      </div>
    );
  }

  const matchStatus = rfq.vendorMatches?.[0]?.status || rfq.status;
  const canRespond = matchStatus === 'SENT' || matchStatus === 'VIEWED';

  const handleAccept = async () => {
    try { await acceptMutation.mutateAsync(id); } catch {}
  };

  const handleDecline = async () => {
    try { await declineMutation.mutateAsync({ rfqId: id, reason: declineReason }); } catch {}
    setShowDecline(false);
  };

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={rfq.title || 'RFQ Details'}
        description={rfq.company?.name ? `From: ${rfq.company.name}` : ''}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {canRespond && (
              <>
                <Button variant="accent" onClick={handleAccept} disabled={acceptMutation.isPending}>
                  <Check className="mr-2 h-4 w-4" />Accept
                </Button>
                <Button variant="outline" onClick={() => setShowDecline(!showDecline)}>
                  <X className="mr-2 h-4 w-4" />Decline
                </Button>
              </>
            )}
            <Link href={`/seller/inbox`}>
              <Button variant="ghost"><MessageSquare className="mr-2 h-4 w-4" />Message</Button>
            </Link>
            <Button variant="ghost" onClick={() => router.push('/seller/rfq')}>
              <ArrowLeft className="mr-2 h-4 w-4" />Back
            </Button>
          </div>
        }
      />

      {showDecline && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm font-medium text-red-400">Decline Reason</p>
          <textarea
            placeholder="Optional reason..."
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            rows={2}
            className="mt-2 w-full rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-red-500/50"
          />
          <div className="mt-2 flex gap-2">
            <Button variant="destructive" size="sm" onClick={handleDecline} disabled={declineMutation.isPending}>
              Confirm Decline
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowDecline(false)}>Cancel</Button>
          </div>
        </div>
      )}

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
              <span className="text-xs font-medium uppercase tracking-wider">Products Required</span>
            </div>
            {rfq.productItems?.length > 0 ? (
              <div className="space-y-2">
                {rfq.productItems.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                    <span className="text-sm font-medium text-white">{item.productName}</span>
                    <span className="text-sm text-white/60">{item.quantity} {item.unit}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/40">Not specified</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-5 backdrop-blur-xl">
            <h3 className="text-xs font-medium uppercase tracking-wider text-white/60 mb-3">Match Status</h3>
            <StatusBadge status={matchStatus} className="text-sm" />
            {canRespond && <p className="mt-2 text-xs text-white/40">Review and respond to this RFQ</p>}
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-5 backdrop-blur-xl">
            <h3 className="text-xs font-medium uppercase tracking-wider text-white/60 mb-3">Budget</h3>
            <p className="text-sm text-white">
              {rfq.showBudget && (rfq.budgetMin || rfq.budgetMax)
                ? `₹${rfq.budgetMin || 0} - ₹${rfq.budgetMax || 0}`
                : 'Not disclosed'}
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-white/60 mb-3">
              <MapPin className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Delivery Location</span>
            </div>
            {rfq.locations?.length > 0 ? (
              <p className="text-sm text-white/80">{rfq.locations[0].city}, {rfq.locations[0].state}</p>
            ) : <p className="text-sm text-white/40">Not specified</p>}
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-5 backdrop-blur-xl">
            <h3 className="text-xs font-medium uppercase tracking-wider text-white/60 mb-3">Timeline</h3>
            <dl className="space-y-2">
              <div><dt className="text-xs text-white/40">Posted</dt><dd className="text-sm text-white">{new Date(rfq.createdAt).toLocaleDateString('en-IN')}</dd></div>
              {rfq.expiresAt && <div><dt className="text-xs text-white/40">Expires</dt><dd className="text-sm text-white">{new Date(rfq.expiresAt).toLocaleDateString('en-IN')}</dd></div>}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
