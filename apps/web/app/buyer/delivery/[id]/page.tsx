'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardPageHeader, StatusBadge, TableSkeleton } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDeliveryDetail, useDeliveryTimeline, useConfirmDelivery, useRejectDelivery } from '@/hooks/use-smart-delivery';
import { AlertCircle, ArrowLeft, Package, Truck, CheckCircle, XCircle, Clock, MapPin, FileText, User, Phone, Camera, Map, Shield } from 'lucide-react';

const statusColor: Record<string, string> = {
  OUT_FOR_DELIVERY: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  DELIVERED: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  DELIVERY_CONFIRMED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  DELIVERY_FAILED: 'bg-red-500/10 text-red-400 border-red-500/30',
  PARTIALLY_DELIVERED: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  REJECTED: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  RETURNED: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  COMPLETED: 'bg-green-500/10 text-green-400 border-green-500/30',
};

export default function BuyerDeliveryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: delivery, isLoading, error } = useDeliveryDetail(id);
  const { data: timeline } = useDeliveryTimeline(id);
  const confirmMutation = useConfirmDelivery();
  const rejectMutation = useRejectDelivery();

  const [receiverName, setReceiverName] = useState('');
  const [receiverMobile, setReceiverMobile] = useState('');
  const [buyerNotes, setBuyerNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectNote, setRejectNote] = useState('');
  const [showReject, setShowReject] = useState(false);

  if (error) return (<div className="space-y-6"><DashboardPageHeader title="Delivery Detail" /><div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04] p-12"><AlertCircle className="h-12 w-12 text-red-500" /><p className="mt-4 text-lg font-medium text-white">Failed to load delivery</p></div></div>);
  if (isLoading || !delivery) return <TableSkeleton rows={8} />;

  const canConfirm = delivery.status === 'DELIVERED';
  const canReject = ['DELIVERED', 'DELIVERY_CONFIRMED'].includes(delivery.status);
  const hasPOD = !!delivery.proofOfDelivery;

  return (
    <div className="space-y-6">
      <DashboardPageHeader title={`Delivery ${delivery.deliveryNumber}`} description={`Order: ${delivery.order?.orderNumber ?? '—'}`}
        actions={<Button variant="ghost" onClick={() => router.push('/buyer/delivery')}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>} />

      {/* Status Banner */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-6 backdrop-blur-xl flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Truck className="h-8 w-8 text-orange-400" />
          <div><p className="text-lg font-semibold text-white">Delivery Status</p><p className="text-sm text-white/60"><StatusBadge status={delivery.status} /></p></div>
        </div>
        {delivery.shipment?.trackingNumber && (
          <div className="text-right">
            <p className="text-xs text-white/50">Tracking</p>
            <p className="font-mono text-sm text-white">{delivery.shipment.trackingNumber}</p>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* POD Section */}
          {hasPOD && (
            <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 to-green-500/5 p-6 backdrop-blur-xl">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-emerald-400"><Shield className="h-4 w-4" /> Proof of Delivery</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><p className="text-xs text-white/50">Receiver</p><p className="text-sm text-white">{delivery.proofOfDelivery!.receiverName ?? '—'}</p></div>
                <div><p className="text-xs text-white/50">Mobile</p><p className="text-sm text-white">{delivery.proofOfDelivery!.receiverMobile ?? '—'}</p></div>
                <div><p className="text-xs text-white/50">Delivered At</p><p className="text-sm text-white">{delivery.proofOfDelivery!.deliveredAt ? new Date(delivery.proofOfDelivery!.deliveredAt).toLocaleString('en-IN') : '—'}</p></div>
                <div><p className="text-xs text-white/50">OTP Verified</p><p className="text-sm text-white">{delivery.proofOfDelivery!.otpVerified ? 'Yes' : 'No'}</p></div>
                {delivery.proofOfDelivery!.geoLatitude && (
                  <div className="sm:col-span-2"><p className="text-xs text-white/50">Geo Location</p><p className="text-sm text-white">{delivery.proofOfDelivery!.geoLatitude}, {delivery.proofOfDelivery!.geoLongitude}</p></div>
                )}
              </div>
            </div>
          )}

          {/* Confirm / Reject Form */}
          {canConfirm && !hasPOD && (
            <div className="rounded-xl border border-orange-500/20 bg-gradient-to-r from-orange-500/5 to-amber-500/5 p-6 backdrop-blur-xl">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-orange-400">Confirm Delivery</h3>
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="mb-1 text-xs text-white/50">Receiver Name</p>
                    <Input placeholder="Receiver name" value={receiverName} onChange={(e) => setReceiverName(e.target.value)} />
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-white/50">Receiver Mobile</p>
                    <Input placeholder="Mobile number" value={receiverMobile} onChange={(e) => setReceiverMobile(e.target.value)} />
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-xs text-white/50">Notes</p>
                  <textarea value={buyerNotes} onChange={(e) => setBuyerNotes(e.target.value)} rows={2} placeholder="Any delivery notes..."
                    className="w-full rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500/50" />
                </div>
                <div className="flex gap-2">
                  <Button variant="accent" onClick={() => confirmMutation.mutate({ deliveryId: id, receiverName: receiverName || undefined, receiverMobile: receiverMobile || undefined, buyerNotes: buyerNotes || undefined })} disabled={confirmMutation.isPending}>
                    <CheckCircle className="mr-2 h-4 w-4" /> Confirm Delivery
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-6 backdrop-blur-xl">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/60"><Clock className="h-4 w-4" /> Timeline</h3>
            {(!timeline || timeline.length === 0) ? <p className="text-sm text-white/50">No events yet.</p> : (
              <div className="space-y-4">
                {[...timeline].reverse().map((event: any) => (
                  <div key={event.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`h-3 w-3 rounded-full ${statusColor[event.toStatus] || 'bg-white/20'}`} />
                      <div className="mt-1 h-full w-px bg-white/[0.06]" />
                    </div>
                    <div className="pb-4">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={event.toStatus} />
                        {event.fromStatus && <span className="text-xs text-white/40">from <StatusBadge status={event.fromStatus} /></span>}
                      </div>
                      <p className="mt-1 text-xs text-white/50">{new Date(event.createdAt).toLocaleString('en-IN')}{event.changedByRole && ` — by ${event.changedByRole}`}</p>
                      {event.note && <p className="mt-1 text-xs text-white/60">{event.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-6 backdrop-blur-xl">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/60"><Package className="h-4 w-4" /> Delivery Info</h3>
            <div className="space-y-3">
              <div><p className="text-xs text-white/50">Status</p><StatusBadge status={delivery.status} /></div>
              <div><p className="text-xs text-white/50">Delivery Number</p><p className="font-mono text-sm text-white">{delivery.deliveryNumber}</p></div>
              <div><p className="text-xs text-white/50">Order</p><p className="text-sm text-white">{delivery.order?.orderNumber ?? '—'}</p></div>
              <div><p className="text-xs text-white/50">Shipment</p><p className="text-sm text-white">{delivery.shipment?.shipmentNumber ?? '—'}</p></div>
              <div><p className="text-xs text-white/50">Seller</p><p className="text-sm text-white">{delivery.sellerCompany?.name ?? '—'}</p></div>
              {delivery.receiverName && <div><p className="text-xs text-white/50">Receiver</p><p className="text-sm text-white">{delivery.receiverName}</p></div>}
              {delivery.deliveredAt && <div><p className="text-xs text-white/50">Delivered</p><p className="text-sm text-white">{new Date(delivery.deliveredAt).toLocaleString('en-IN')}</p></div>}
              {delivery.confirmedAt && <div><p className="text-xs text-white/50">Confirmed</p><p className="text-sm text-white">{new Date(delivery.confirmedAt).toLocaleString('en-IN')}</p></div>}
              {delivery.rejectionReason && <div><p className="text-xs text-white/50">Rejection Reason</p><p className="text-sm text-red-400">{delivery.rejectionReason}</p></div>}
            </div>
          </div>

          {/* Actions */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-6 backdrop-blur-xl">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/60">Actions</h3>
            <div className="space-y-3">
              {canConfirm && (
                <Button variant="accent" className="w-full" onClick={() => confirmMutation.mutate({ deliveryId: id })} disabled={confirmMutation.isPending}>
                  <CheckCircle className="mr-2 h-4 w-4" /> Confirm Delivery
                </Button>
              )}
              {canReject && !showReject && (
                <Button variant="outline" className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={() => setShowReject(true)}>
                  <XCircle className="mr-2 h-4 w-4" /> Reject Delivery
                </Button>
              )}
              {showReject && (
                <div className="space-y-2 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                  <p className="text-xs font-medium text-red-400">Rejection Reason</p>
                  <select value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="w-full rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-sm text-white">
                    <option value="">Select reason...</option>
                    <option value="DAMAGED">Damaged goods</option>
                    <option value="WRONG_ITEM">Wrong item</option>
                    <option value="INCOMPLETE">Incomplete delivery</option>
                    <option value="QUALITY_ISSUE">Quality issue</option>
                    <option value="OTHER">Other</option>
                  </select>
                  <textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} rows={2} placeholder="Additional notes..."
                    className="w-full rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-white/40" />
                  <div className="flex gap-2">
                    <Button variant="destructive" size="sm" onClick={() => rejectMutation.mutate({ deliveryId: id, reason: rejectReason || 'OTHER', note: rejectNote || undefined })} disabled={rejectMutation.isPending || !rejectReason}>Confirm Reject</Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowReject(false)}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Documents */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-6 backdrop-blur-xl">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/60"><FileText className="h-4 w-4" /> Documents</h3>
            {delivery.documents?.length ? delivery.documents.map((doc: any) => (
              <a key={doc.id} href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-white/70 hover:text-orange-400 mb-2">
                <FileText className="h-4 w-4" /> {doc.fileName}
              </a>
            )) : <p className="text-sm text-white/50">No documents</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
