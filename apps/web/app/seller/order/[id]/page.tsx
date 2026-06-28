'use client';

import { useParams, useRouter } from 'next/navigation';
import { DashboardPageHeader, StatusBadge, TableSkeleton } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { useOrderDetail, useUpdateOrderStatus, useCancelOrder, useOrderTimeline } from '@/hooks/use-smart-order';
import { AlertCircle, ArrowLeft, Package, Truck, CheckCircle, XCircle, Clock, Box, Send } from 'lucide-react';

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const statusColor: Record<string, string> = {
  PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  CONFIRMED: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  PROCESSING: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  PACKED: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  READY_FOR_DISPATCH: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  DISPATCHED: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  IN_TRANSIT: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  DELIVERED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  COMPLETED: 'bg-green-500/10 text-green-400 border-green-500/30',
  CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/30',
  RETURNED: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
};

export default function SellerOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: order, isLoading, error } = useOrderDetail(id);
  const { data: timeline } = useOrderTimeline(id);
  const updateStatus = useUpdateOrderStatus();
  const cancelOrder = useCancelOrder();

  if (error) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Order Detail" description="View order information" />
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04] p-12 backdrop-blur-xl">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="mt-4 text-lg font-medium text-white">Failed to load order</p>
          <p className="mt-1 text-sm text-white/60">{(error as any).message}</p>
        </div>
      </div>
    );
  }

  if (isLoading || !order) return <TableSkeleton rows={8} />;

  const canConfirm = order.status === 'PENDING';
  const canProcess = order.status === 'CONFIRMED';
  const canPack = order.status === 'PROCESSING';
  const canReadyDispatch = order.status === 'PACKED';
  const canDispatch = order.status === 'READY_FOR_DISPATCH';
  const canMarkTransit = order.status === 'DISPATCHED';
  const canCancel = ['PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'READY_FOR_DISPATCH'].includes(order.status);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={`Order ${order.orderNumber}`}
        description="Manage customer order"
        actions={
          <Button variant="ghost" onClick={() => router.push('/seller/order')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-6 backdrop-blur-xl">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/60">Order Items</h3>
            <div className="space-y-3">
              {order.items?.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-white">{item.productName}</p>
                    <p className="text-xs text-white/50">Qty: {item.quantity} × {formatINR(Number(item.unitPrice))}</p>
                  </div>
                  <p className="text-sm font-semibold text-white">{formatINR(Number(item.totalPrice))}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between border-t border-white/[0.06] pt-4">
              <span className="text-sm font-semibold text-white">Total</span>
              <span className="text-lg font-bold text-orange-400">{formatINR(Number(order.totalAmount))}</span>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-6 backdrop-blur-xl">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/60">Timeline</h3>
            {(!timeline || timeline.length === 0) ? (
              <p className="text-sm text-white/50">No timeline events yet.</p>
            ) : (
              <div className="space-y-4">
                {timeline.map((event: any) => (
                  <div key={event.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`h-3 w-3 rounded-full ${statusColor[event.toStatus] || 'bg-white/20'}`} />
                      <div className="mt-1 h-full w-px bg-white/[0.06]" />
                    </div>
                    <div className="pb-4">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={event.toStatus} />
                        {event.fromStatus && (
                          <span className="text-xs text-white/40">from <StatusBadge status={event.fromStatus} /></span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-white/50">
                        {new Date(event.createdAt).toLocaleString('en-IN')}
                        {event.changedByRole && ` — by ${event.changedByRole}`}
                      </p>
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
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/60"><Package className="h-4 w-4" /> Order Info</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-white/50">Status</p>
                <StatusBadge status={order.status} />
              </div>
              <div>
                <p className="text-xs text-white/50">Order Number</p>
                <p className="font-mono text-sm text-white">{order.orderNumber}</p>
              </div>
              <div>
                <p className="text-xs text-white/50">Buyer</p>
                <p className="text-sm text-white">{order.buyerCompany?.name ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-white/50">Total Amount</p>
                <p className="text-lg font-bold text-orange-400">{formatINR(Number(order.totalAmount))}</p>
              </div>
              <div>
                <p className="text-xs text-white/50">Created</p>
                <p className="text-sm text-white/70">{new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-6 backdrop-blur-xl">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/60">Actions</h3>
            <div className="space-y-3">
              {canConfirm && (
                <Button variant="accent" className="w-full" onClick={() => updateStatus.mutate({ orderId: id, status: 'CONFIRMED' })} disabled={updateStatus.isPending}>
                  <CheckCircle className="mr-2 h-4 w-4" /> Confirm Order
                </Button>
              )}
              {canProcess && (
                <Button variant="accent" className="w-full" onClick={() => updateStatus.mutate({ orderId: id, status: 'PROCESSING' })} disabled={updateStatus.isPending}>
                  <Clock className="mr-2 h-4 w-4" /> Start Processing
                </Button>
              )}
              {canPack && (
                <Button variant="accent" className="w-full" onClick={() => updateStatus.mutate({ orderId: id, status: 'PACKED' })} disabled={updateStatus.isPending}>
                  <Box className="mr-2 h-4 w-4" /> Mark Packed
                </Button>
              )}
              {canReadyDispatch && (
                <Button variant="accent" className="w-full" onClick={() => updateStatus.mutate({ orderId: id, status: 'READY_FOR_DISPATCH' })} disabled={updateStatus.isPending}>
                  <Package className="mr-2 h-4 w-4" /> Ready for Dispatch
                </Button>
              )}
              {canDispatch && (
                <Button variant="accent" className="w-full" onClick={() => updateStatus.mutate({ orderId: id, status: 'DISPATCHED' })} disabled={updateStatus.isPending}>
                  <Send className="mr-2 h-4 w-4" /> Dispatch Order
                </Button>
              )}
              {canMarkTransit && (
                <Button variant="accent" className="w-full" onClick={() => updateStatus.mutate({ orderId: id, status: 'IN_TRANSIT' })} disabled={updateStatus.isPending}>
                  <Truck className="mr-2 h-4 w-4" /> Mark In Transit
                </Button>
              )}
              {canCancel && (
                <Button variant="outline" className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={() => cancelOrder.mutate({ orderId: id, reason: 'SELLER_CANCELLED', reasonText: 'Cancelled by seller' })} disabled={cancelOrder.isPending}>
                  <XCircle className="mr-2 h-4 w-4" /> Cancel Order
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
