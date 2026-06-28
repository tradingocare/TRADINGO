'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardPageHeader } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSellerOrders } from '@/hooks/use-smart-order';
import { useCreateShipment } from '@/hooks/use-smart-shipment';
import { ArrowLeft, Search, Package } from 'lucide-react';

export default function CreateShipmentPage() {
  const router = useRouter();
  const { data } = useSellerOrders();
  const createMutation = useCreateShipment();
  const orders = data?.data ?? [];

  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [weight, setWeight] = useState('');
  const [totalPackages, setTotalPackages] = useState('1');
  const [specialInstructions, setSpecialInstructions] = useState('');

  const validOrders = orders.filter((o: any) =>
    ['CONFIRMED', 'PROCESSING', 'PACKED', 'READY_FOR_DISPATCH', 'DISPATCHED', 'IN_TRANSIT'].includes(o.status)
  );

  const handleCreate = async () => {
    if (!selectedOrderId) return;
    createMutation.mutateAsync({
      orderId: selectedOrderId,
      weight: weight ? Number(weight) : undefined,
      totalPackages: Number(totalPackages),
      specialInstructions: specialInstructions || undefined,
    }).then((s) => {
      router.push(`/seller/shipment/${s.id}`);
    });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <DashboardPageHeader
        title="Create Shipment"
        description="Create a shipment from a confirmed order"
        actions={
          <Button variant="ghost" onClick={() => router.push('/seller/shipment')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        }
      />

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-6 backdrop-blur-xl space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium text-white">Select Order</p>
          <select
            value={selectedOrderId}
            onChange={(e) => setSelectedOrderId(e.target.value)}
            className="w-full rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-sm text-white"
          >
            <option value="">Choose an order...</option>
            {validOrders.map((o: any) => (
              <option key={o.id} value={o.id}>
                {o.orderNumber} — {o.buyerCompany?.name ?? 'N/A'} — ₹{Number(o.totalAmount).toLocaleString('en-IN')}
              </option>
            ))}
          </select>
          {validOrders.length === 0 && (
            <p className="mt-2 text-xs text-white/50">No orders available for shipment. Orders must be CONFIRMED or later.</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium text-white">Total Weight (kg)</p>
            <Input type="number" placeholder="e.g. 5.5" value={weight} onChange={(e) => setWeight(e.target.value)} />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-white">Total Packages</p>
            <Input type="number" min="1" value={totalPackages} onChange={(e) => setTotalPackages(e.target.value)} />
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-white">Special Instructions</p>
          <textarea
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            rows={3}
            placeholder="Fragile, handle with care..."
            className="w-full rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
          />
        </div>

        <Button
          variant="accent"
          className="w-full"
          onClick={handleCreate}
          disabled={!selectedOrderId || createMutation.isPending}
        >
          <Package className="mr-2 h-4 w-4" /> Create Shipment
        </Button>
      </div>
    </div>
  );
}
