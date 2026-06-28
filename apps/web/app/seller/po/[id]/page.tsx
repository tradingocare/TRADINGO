'use client';

import { useRouter, useParams } from 'next/navigation';
import { DashboardPageHeader, StatusBadge } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import {
  usePurchaseOrderDetail, usePoVersions, usePoTimeline,
  useAcceptPo, useRejectPo, useCancelPo, useRequestRevision,
} from '@/hooks/use-smart-po';
import { smartPoApi } from '@/lib/api/smart-po';
import { useState } from 'react';
import {
  ArrowLeft, DollarSign, Clock, FileText, Check, X, Download, History, Activity, Building2, Package, Truck, Shield
} from 'lucide-react';

const fmtStatus = (s: string) => s.replace(/_/g, ' ').toLowerCase();

export default function SellerPoDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { data: po, isLoading } = usePurchaseOrderDetail(id);
  const { data: versions } = usePoVersions(id);
  const { data: timeline } = usePoTimeline(id);

  const acceptMutation = useAcceptPo();
  const rejectMutation = useRejectPo();
  const cancelMutation = useCancelPo();
  const revisionMutation = useRequestRevision();

  const [rejectReason, setRejectReason] = useState('');
  const [revisionNotes, setRevisionNotes] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [showRevision, setShowRevision] = useState(false);

  const p: any = po;
  const canAccept = p?.status === 'SELLER_PENDING';
  const canReject = ['DRAFT', 'BUYER_CONFIRMED', 'SELLER_PENDING'].includes(p?.status);
  const canCancel = ['DRAFT', 'BUYER_CONFIRMED', 'SELLER_PENDING'].includes(p?.status);
  const canRequestRevision = p?.status === 'SELLER_PENDING';
  const pdfUrl = id ? smartPoApi.getPdfUrl(id) : '';

  if (isLoading) return <div className="p-8 text-white/60">Loading...</div>;
  if (!p) return <div className="p-8 text-white/60">Purchase order not found.</div>;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={`PO: ${p.poNumber}`}
        description={`From ${p.buyerCompany?.name || 'N/A'}`}
        actions={
          <div className="flex items-center gap-2">
            {canAccept && (
              <Button variant="accent" onClick={() => acceptMutation.mutateAsync(id)} disabled={acceptMutation.isPending}>
                <Check className="mr-2 h-4 w-4" />Accept
              </Button>
            )}
            {canRequestRevision && (
              <Button variant="outline" onClick={() => setShowRevision(true)}>
                Edit
              </Button>
            )}
            <Button variant="outline" onClick={() => window.open(pdfUrl, '_blank')}>
              <Download className="mr-2 h-4 w-4" />PDF
            </Button>
            {canReject && (
              <Button variant="destructive" onClick={() => setShowReject(true)}>
                <X className="mr-2 h-4 w-4" />Reject
              </Button>
            )}
            <Button variant="ghost" onClick={() => router.push('/seller/po')}>
              <ArrowLeft className="mr-2 h-4 w-4" />Back
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Header */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-white/60">
                <FileText className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wider">Purchase Order</span>
              </div>
              <StatusBadge status={fmtStatus(p.status)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-xs text-white/40">PO Number</p>
                <p className="text-lg font-bold text-orange-400">{p.poNumber}</p>
              </div>
              <div>
                <p className="text-xs text-white/40">Buyer</p>
                <div className="flex items-center gap-1">
                  <Building2 className="h-3 w-3 text-white/40" />
                  <span className="text-sm text-white/80">{p.buyerCompany?.name || 'N/A'}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-white/40">Created</p>
                <p className="text-sm text-white/80">{p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN') : '-'}</p>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-white/60 mb-4">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Pricing</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div><p className="text-xs text-white/40">Subtotal</p><p className="text-sm text-white/80">{p.currency} {(p.subtotal || 0).toLocaleString('en-IN')}</p></div>
              <div><p className="text-xs text-white/40">Tax</p><p className="text-sm text-white/80">{p.currency} {(p.taxAmount || 0).toLocaleString('en-IN')}</p></div>
              <div><p className="text-xs text-white/40">Discount</p><p className="text-sm text-white/80">{p.discountPercent ? `${p.discountPercent}%` : '-'}</p></div>
              <div><p className="text-xs text-white/40 text-orange-400 font-bold">Total</p><p className="text-sm font-bold text-orange-400">{p.currency} {(p.totalAmount || 0).toLocaleString('en-IN')}</p></div>
            </div>
          </div>

          {/* Terms */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-white/60 mb-4">
              <Truck className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Terms</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><p className="text-xs text-white/40">Delivery Terms</p><p className="text-sm text-white/80">{p.deliveryTerms || '-'}</p></div>
              <div><p className="text-xs text-white/40">Payment Terms</p><p className="text-sm text-white/80">{p.paymentTerms ? p.paymentTerms.replace(/_/g, ' ') : '-'}</p></div>
              <div><p className="text-xs text-white/40">Lead Time</p><p className="text-sm text-white/80 flex items-center gap-1"><Clock className="h-3 w-3 text-white/40" />{p.leadTimeDays ? `${p.leadTimeDays}d` : '-'}</p></div>
              <div><p className="text-xs text-white/40">Freight</p><p className="text-sm text-white/80">{p.freight || '-'}</p></div>
              <div><p className="text-xs text-white/40">Warranty</p><p className="text-sm text-white/80">{p.warranty || '-'}</p></div>
              <div><p className="text-xs text-white/40">Valid Until</p><p className="text-sm text-white/80">{p.validityDate ? new Date(p.validityDate).toLocaleDateString('en-IN') : '-'}</p></div>
              <div><p className="text-xs text-white/40">Packing</p><p className="text-sm text-white/80">{p.packing || '-'}</p></div>
              <div><p className="text-xs text-white/40">GST</p><p className="text-sm text-white/80">{p.gstType || '-'}</p></div>
            </div>
            {p.specialConditions && <div className="mt-3"><p className="text-xs text-white/40">Special Conditions</p><p className="text-sm text-white/70">{p.specialConditions}</p></div>}
            {p.commercialNotes && <div className="mt-3"><p className="text-xs text-white/40">Commercial Notes</p><p className="text-sm text-white/70">{p.commercialNotes}</p></div>}
          </div>

          {/* Line Items */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-white/60 mb-4">
              <Package className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Line Items</span>
            </div>
            {p.lineItems?.length ? (
              <div className="space-y-2">
                {p.lineItems.map((li: any, i: number) => (
                  <div key={li.id || i} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                    <div>
                      <p className="text-sm font-medium text-white">{li.productName}</p>
                      <p className="text-xs text-white/40">{li.quantity} {li.unit} × {p.currency} {li.unitPrice?.toLocaleString('en-IN')}</p>
                    </div>
                    <p className="text-sm font-bold text-white">{p.currency} {(li.totalPrice || li.unitPrice * (li.quantity || 1)).toLocaleString('en-IN')}</p>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-white/40">No line items</p>}
          </div>

          {/* Reject Dialog */}
          {showReject && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5 backdrop-blur-xl">
              <p className="text-sm font-medium text-red-400 mb-2">Reject Purchase Order</p>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                rows={2} placeholder="Reason for rejection..."
                className="w-full rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-red-500/50" />
              <div className="mt-2 flex gap-2">
                <Button variant="destructive" size="sm" onClick={() => rejectMutation.mutateAsync({ poId: id, reason: rejectReason || undefined }).then(() => setShowReject(false))}>
                  <X className="mr-1 h-3 w-3" />Confirm Reject
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowReject(false)}>Back</Button>
              </div>
            </div>
          )}

          {/* Revision Dialog */}
          {showRevision && (
            <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-5 backdrop-blur-xl">
              <p className="text-sm font-medium text-orange-400 mb-2">Request Revision</p>
              <textarea value={revisionNotes} onChange={(e) => setRevisionNotes(e.target.value)}
                rows={3} placeholder="Describe what needs to be revised..."
                className="w-full rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500/50" />
              <div className="mt-2 flex gap-2">
                <Button variant="accent" size="sm" onClick={() => revisionMutation.mutateAsync({ poId: id, notes: revisionNotes }).then(() => setShowRevision(false))}>
                  Send Revision Request
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowRevision(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-white/60 mb-3">
              <Activity className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Timeline</span>
            </div>
            {Array.isArray(timeline) && timeline.length > 0 ? (
              <div className="space-y-2">
                {[...timeline].reverse().map((e: any) => (
                  <div key={e.id} className="flex items-start gap-2 border-l-2 border-white/[0.06] pl-3 pb-2">
                    <div>
                      <p className="text-xs font-medium text-white capitalize">{e.eventType.replace(/_/g, ' ').toLowerCase()}</p>
                      <p className="text-[10px] text-white/40">{new Date(e.createdAt).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-white/40">No events</p>}
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-white/60 mb-3">
              <History className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Versions</span>
            </div>
            {Array.isArray(versions) && versions.length > 0 ? (
              <div className="space-y-2">
                {[...versions].reverse().map((v: any) => (
                  <div key={v.id} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-white">v{v.version}</span>
                      <span className="text-[10px] text-white/40">{v.status?.replace(/_/g, ' ')}</span>
                    </div>
                    <p className="text-[10px] text-white/40">{v.createdAt ? new Date(v.createdAt).toLocaleString('en-IN') : '-'}</p>
                    {v.notes && <p className="text-[10px] text-white/50 mt-1">{v.notes}</p>}
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-white/40">No versions</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
