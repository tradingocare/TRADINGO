'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardPageHeader, StatusBadge, TableSkeleton } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { useShipmentDetail, useShipmentTimeline, useUpdateShipmentStatus, useAssignCourier, useCourierProviders } from '@/hooks/use-smart-shipment';
import { AlertCircle, ArrowLeft, Package, Truck, CheckCircle, Clock, MapPin, FileText, Box, Weight } from 'lucide-react';
import Link from 'next/link';

const statusColor: Record<string, string> = {
  PREPARING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  PACKED: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  READY_FOR_PICKUP: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  COURIER_ASSIGNED: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  DISPATCHED: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  IN_TRANSIT: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  OUT_FOR_DELIVERY: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  DELIVERED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  DELIVERY_FAILED: 'bg-red-500/10 text-red-400 border-red-500/30',
  RETURNED: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
};

export default function SellerShipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: shipment, isLoading, error } = useShipmentDetail(id);
  const { data: timeline } = useShipmentTimeline(id);
  const { data: courierProviders } = useCourierProviders();
  const updateStatus = useUpdateShipmentStatus();
  const assignCourier = useAssignCourier();

  const [selectedCourier, setSelectedCourier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [eta, setEta] = useState('');
  const [showCourierForm, setShowCourierForm] = useState(false);

  if (error) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Shipment Detail" description="Manage shipment" />
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04] p-12 backdrop-blur-xl">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="mt-4 text-lg font-medium text-white">Failed to load shipment</p>
        </div>
      </div>
    );
  }

  if (isLoading || !shipment) return <TableSkeleton rows={8} />;

  const canPack = shipment.status === 'PREPARING';
  const canReadyPickup = shipment.status === 'PACKED';
  const needsCourier = shipment.status === 'READY_FOR_PICKUP' && !shipment.courierProviderId;
  const canDispatch = shipment.status === 'COURIER_ASSIGNED';
  const canMarkTransit = shipment.status === 'DISPATCHED';
  const canMarkOutForDelivery = shipment.status === 'IN_TRANSIT';
  const canRetry = shipment.status === 'DELIVERY_FAILED';

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={`Shipment ${shipment.shipmentNumber}`}
        description={`Order: ${shipment.order?.orderNumber ?? '—'}`}
        actions={
          <Button variant="ghost" onClick={() => router.push('/seller/shipment')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-6 backdrop-blur-xl">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/60"><Truck className="h-4 w-4" /> Courier & Tracking</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-white/50">Courier</p>
                <p className="text-sm text-white">{shipment.courierProvider?.name ?? 'Not assigned'}</p>
              </div>
              <div>
                <p className="text-xs text-white/50">Tracking</p>
                <p className="font-mono text-sm text-white">{shipment.trackingNumber ?? '—'}</p>
              </div>
            </div>

            {showCourierForm ? (
              <div className="mt-4 rounded-lg border border-orange-500/20 bg-orange-500/5 p-4">
                <p className="text-sm font-medium text-orange-400 mb-3">Assign Courier</p>
                <div className="space-y-3">
                  <select
                    value={selectedCourier}
                    onChange={(e) => setSelectedCourier(e.target.value)}
                    className="w-full rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-sm text-white"
                  >
                    <option value="">Select courier...</option>
                    {courierProviders?.map((cp: any) => (
                      <option key={cp.id} value={cp.id}>{cp.name}</option>
                    ))}
                  </select>
                  <input
                    type="text" placeholder="Tracking Number *"
                    value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-white/40"
                  />
                  <input
                    type="date" placeholder="Expected Delivery"
                    value={eta} onChange={(e) => setEta(e.target.value)}
                    className="w-full rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-sm text-white"
                  />
                  <div className="flex gap-2">
                    <Button variant="accent" size="sm"
                      onClick={() => {
                        if (!selectedCourier || !trackingNumber) return;
                        assignCourier.mutate({ shipmentId: id, courierProviderId: selectedCourier, trackingNumber, estimatedDeliveryDate: eta || undefined });
                        setShowCourierForm(false);
                      }}
                      disabled={assignCourier.isPending || !selectedCourier || !trackingNumber}>
                      Assign Courier
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowCourierForm(false)}>Cancel</Button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-6 backdrop-blur-xl">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/60"><Box className="h-4 w-4" /> Packages ({shipment.packages?.length ?? 0})</h3>
            {shipment.packages?.length ? (
              <div className="space-y-2">
                {shipment.packages.map((pkg: any) => (
                  <div key={pkg.id} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-white">{pkg.label ?? 'Package'}</p>
                      {pkg.contents && <p className="text-xs text-white/50">{pkg.contents}</p>}
                    </div>
                    <div className="text-right">
                      {pkg.weight && <p className="text-xs text-white/60">{pkg.weight} {pkg.weightUnit}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-white/50">No packages</p>}
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-6 backdrop-blur-xl">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/60"><Clock className="h-4 w-4" /> Timeline</h3>
            {(!timeline || timeline.length === 0) ? (
              <p className="text-sm text-white/50">No timeline events.</p>
            ) : (
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
                      <p className="mt-1 text-xs text-white/50">
                        {new Date(event.createdAt).toLocaleString('en-IN')}
                        {event.changedByRole && ` — by ${event.changedByRole}`}
                      </p>
                      {event.location && <p className="mt-1 text-xs text-white/60"><MapPin className="inline h-3 w-3 mr-1" />{event.location}</p>}
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
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/60"><Package className="h-4 w-4" /> Shipment Info</h3>
            <div className="space-y-3">
              <div><p className="text-xs text-white/50">Status</p><StatusBadge status={shipment.status} /></div>
              <div><p className="text-xs text-white/50">Type</p><p className="text-sm text-white">{shipment.type}</p></div>
              <div><p className="text-xs text-white/50">Order</p><p className="font-mono text-sm text-white">{shipment.order?.orderNumber ?? '—'}</p></div>
              <div><p className="text-xs text-white/50">Buyer</p><p className="text-sm text-white">{shipment.buyerCompany?.name ?? '—'}</p></div>
              <div><p className="text-xs text-white/50">Packages</p><p className="text-sm text-white">{shipment.totalPackages}</p></div>
              {shipment.weight && <div><p className="text-xs text-white/50">Weight</p><p className="text-sm text-white">{Number(shipment.weight)} kg</p></div>}
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-6 backdrop-blur-xl">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/60">Actions</h3>
            <div className="space-y-3">
              {canPack && (
                <Button variant="accent" className="w-full" onClick={() => updateStatus.mutate({ shipmentId: id, status: 'PACKED' })} disabled={updateStatus.isPending}>
                  <Box className="mr-2 h-4 w-4" /> Mark Packed
                </Button>
              )}
              {canReadyPickup && (
                <Button variant="accent" className="w-full" onClick={() => updateStatus.mutate({ shipmentId: id, status: 'READY_FOR_PICKUP' })} disabled={updateStatus.isPending}>
                  <Package className="mr-2 h-4 w-4" /> Ready for Pickup
                </Button>
              )}
              {needsCourier && !showCourierForm && (
                <Button variant="accent" className="w-full" onClick={() => setShowCourierForm(true)}>
                  <Truck className="mr-2 h-4 w-4" /> Assign Courier
                </Button>
              )}
              {canDispatch && (
                <Button variant="accent" className="w-full" onClick={() => updateStatus.mutate({ shipmentId: id, status: 'DISPATCHED' })} disabled={updateStatus.isPending}>
                  <Truck className="mr-2 h-4 w-4" /> Dispatch
                </Button>
              )}
              {canMarkTransit && (
                <Button variant="accent" className="w-full" onClick={() => updateStatus.mutate({ shipmentId: id, status: 'IN_TRANSIT' })} disabled={updateStatus.isPending}>
                  <Clock className="mr-2 h-4 w-4" /> Mark In Transit
                </Button>
              )}
              {canMarkOutForDelivery && (
                <Button variant="accent" className="w-full" onClick={() => updateStatus.mutate({ shipmentId: id, status: 'OUT_FOR_DELIVERY' })} disabled={updateStatus.isPending}>
                  <Truck className="mr-2 h-4 w-4" /> Out for Delivery
                </Button>
              )}
              {canRetry && (
                <Button variant="accent" className="w-full" onClick={() => updateStatus.mutate({ shipmentId: id, status: 'PREPARING', note: 'Retrying delivery' })} disabled={updateStatus.isPending}>
                  Retry Delivery
                </Button>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-6 backdrop-blur-xl">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/60"><FileText className="h-4 w-4" /> Documents</h3>
            {shipment.documents?.length ? (
              <div className="space-y-2">
                {shipment.documents.map((doc: any) => (
                  <a key={doc.id} href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-white/70 hover:text-orange-400">
                    <FileText className="h-4 w-4" /> {doc.fileName}
                  </a>
                ))}
              </div>
            ) : <p className="text-sm text-white/50">No documents uploaded</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
