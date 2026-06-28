'use client';

import { useParams, useRouter } from 'next/navigation';
import { DashboardPageHeader, StatusBadge, TableSkeleton } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useShipmentDetail, useShipmentTimeline, useUpdateShipmentStatus } from '@/hooks/use-smart-shipment';
import { AlertCircle, ArrowLeft, Package, Truck, CheckCircle, Clock, MapPin, FileText, Box, Hash, Calendar, Weight, ExternalLink } from 'lucide-react';

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

export default function BuyerShipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: shipment, isLoading, error } = useShipmentDetail(id);
  const { data: timeline } = useShipmentTimeline(id);
  const updateStatus = useUpdateShipmentStatus();

  if (error) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Shipment Detail" description="View shipment information" />
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04] p-12 backdrop-blur-xl">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="mt-4 text-lg font-medium text-white">Failed to load shipment</p>
        </div>
      </div>
    );
  }

  if (isLoading || !shipment) return <TableSkeleton rows={8} />;

  const trackingUrl = shipment.courierProvider?.trackingUrl?.replace('{tracking}', shipment.trackingNumber ?? '');
  const canConfirmDelivery = shipment.status === 'OUT_FOR_DELIVERY';

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={`Shipment ${shipment.shipmentNumber}`}
        description="Track your shipment"
        actions={
          <Button variant="ghost" onClick={() => router.push('/buyer/shipment')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        }
      />

      {/* Live Tracking Banner */}
      <div className="rounded-xl border border-orange-500/20 bg-gradient-to-r from-orange-500/5 to-amber-500/5 p-6 backdrop-blur-xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Truck className="h-8 w-8 text-orange-400" />
            <div>
              <p className="text-lg font-semibold text-white">Live Tracking</p>
              <p className="text-sm text-white/60">Current status: <StatusBadge status={shipment.status} /></p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {shipment.courierProvider && (
              <Badge variant="outline" className="border-white/[0.08] text-white/70">
                {shipment.courierProvider.name}
              </Badge>
            )}
            {trackingUrl && (
              <Button variant="accent" size="sm" onClick={() => window.open(trackingUrl, '_blank')}>
                <ExternalLink className="mr-2 h-4 w-4" /> Track on Courier Site
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Status Progress */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-6 backdrop-blur-xl">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/60">Progress</h3>
        <div className="flex flex-wrap gap-2">
          {['PREPARING', 'PACKED', 'COURIER_ASSIGNED', 'DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].map((s) => {
            const isActive = shipment.status === s;
            const isPast = ['PREPARING', 'PACKED', 'COURIER_ASSIGNED', 'DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].indexOf(s) <= ['PREPARING', 'PACKED', 'COURIER_ASSIGNED', 'DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].indexOf(shipment.status);
            return (
              <div key={s} className={`rounded-lg px-3 py-1.5 text-xs font-medium border ${
                isActive ? 'border-orange-500/40 bg-orange-500/10 text-orange-400' :
                isPast ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' :
                'border-white/[0.06] text-white/40'
              }`}>
                {s.split('_').map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Courier & Tracking */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-6 backdrop-blur-xl">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/60"><Truck className="h-4 w-4" /> Courier & Tracking</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-white/50">Courier Provider</p>
                <p className="text-sm text-white">{shipment.courierProvider?.name ?? 'Not assigned'}</p>
              </div>
              <div>
                <p className="text-xs text-white/50">Tracking Number</p>
                <p className="font-mono text-sm text-white">{shipment.trackingNumber ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-white/50">Estimated Delivery</p>
                <p className="text-sm text-white">{shipment.estimatedDeliveryDate ? new Date(shipment.estimatedDeliveryDate).toLocaleDateString('en-IN') : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-white/50">Dispatched On</p>
                <p className="text-sm text-white">{shipment.dispatchDate ? new Date(shipment.dispatchDate).toLocaleDateString('en-IN') : '—'}</p>
              </div>
            </div>
          </div>

          {/* Packages */}
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
                      {pkg.weight && <p className="text-xs text-white/60"><Weight className="inline h-3 w-3 mr-1" />{pkg.weight} {pkg.weightUnit}</p>}
                      {pkg.declaredValue && <p className="text-xs text-white/60">₹{Number(pkg.declaredValue).toLocaleString('en-IN')}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/50">No package details</p>
            )}
          </div>

          {/* Timeline */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-6 backdrop-blur-xl">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/60"><Clock className="h-4 w-4" /> Timeline</h3>
            {(!timeline || timeline.length === 0) ? (
              <p className="text-sm text-white/50">No timeline events yet.</p>
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
          {/* Info Card */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-6 backdrop-blur-xl">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/60"><Package className="h-4 w-4" /> Shipment Info</h3>
            <div className="space-y-3">
              <div><p className="text-xs text-white/50">Status</p><StatusBadge status={shipment.status} /></div>
              <div><p className="text-xs text-white/50">Type</p><p className="text-sm text-white">{shipment.type}</p></div>
              <div><p className="text-xs text-white/50">Order</p><p className="font-mono text-sm text-white">{shipment.order?.orderNumber ?? '—'}</p></div>
              <div><p className="text-xs text-white/50">Total Packages</p><p className="text-sm text-white">{shipment.totalPackages}</p></div>
              {shipment.weight && <div><p className="text-xs text-white/50">Weight</p><p className="text-sm text-white">{Number(shipment.weight)} kg</p></div>}
            </div>
          </div>

          {/* Documents */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-6 backdrop-blur-xl">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/60"><FileText className="h-4 w-4" /> Documents</h3>
            {shipment.documents?.length ? (
              <div className="space-y-2">
                {shipment.documents.map((doc: any) => (
                  <a key={doc.id} href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-white/70 hover:text-orange-400 transition-colors">
                    <FileText className="h-4 w-4" />
                    <span>{doc.fileName}</span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/50">No documents</p>
            )}
          </div>

          {/* Actions */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-6 backdrop-blur-xl">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/60">Actions</h3>
            {canConfirmDelivery && (
              <Button variant="accent" className="w-full" onClick={() => updateStatus.mutate({ shipmentId: id, status: 'DELIVERED' })} disabled={updateStatus.isPending}>
                <CheckCircle className="mr-2 h-4 w-4" /> Confirm Delivery
              </Button>
            )}
            {!canConfirmDelivery && shipment.status !== 'DELIVERED' && (
              <p className="text-xs text-white/50">Awaiting delivery confirmation</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
