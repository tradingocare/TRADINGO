'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardPageHeader, StatusBadge, TableSkeleton } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMyPurchaseOrders } from '@/hooks/use-smart-po';
import { Search, FileText, ArrowRight, DollarSign, AlertCircle } from 'lucide-react';

const fmtStatus = (s: string) => s.replace(/_/g, ' ').toLowerCase();

export default function SellerPoPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const { data: pos, isLoading } = useMyPurchaseOrders(filter || undefined);
  const list = Array.isArray(pos) ? pos : [];

  const tabs = [
    { label: 'All', value: '' },
    { label: 'Pending Review', value: 'SELLER_PENDING' },
    { label: 'Accepted', value: 'SELLER_ACCEPTED' },
    { label: 'Locked', value: 'LOCKED' },
  ];

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Incoming Purchase Orders" description="Review and respond to purchase orders from buyers" />

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {tabs.map((t) => (
          <button key={t.value} onClick={() => setFilter(t.value)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === t.value ? 'bg-orange-500/20 text-orange-400' : 'bg-white/[0.04] text-white/60 hover:text-white/80'
            }`}>{t.label}</button>
        ))}
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
        <Input placeholder="Search POs..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-white/[0.04] border-white/[0.06] text-white" />
      </div>

      {isLoading ? <TableSkeleton /> : list.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04] p-12 backdrop-blur-xl">
          <FileText className="h-12 w-12 text-white/30" />
          <p className="mt-4 text-lg font-medium text-white">No purchase orders yet</p>
          <p className="mt-1 text-sm text-white/60">When buyers generate purchase orders, they will appear here.</p>
          <Button variant="accent" className="mt-4" onClick={() => router.push('/seller/quote')}>View My Quotes</Button>
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl">
          <div className="hidden grid-cols-12 gap-4 border-b border-white/[0.06] px-6 py-3 text-xs font-medium uppercase text-white/40 lg:grid">
            <div className="col-span-2">PO Number</div>
            <div className="col-span-3">Buyer</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Amount</div>
            <div className="col-span-1 text-center">Items</div>
            <div className="col-span-2">Action</div>
          </div>
          {list.map((po: any) => (
            <div key={po.id} className="grid grid-cols-1 gap-3 border-b border-white/[0.06] px-6 py-4 last:border-0 lg:grid-cols-12 lg:items-center hover:bg-white/[0.02] cursor-pointer"
              onClick={() => router.push(`/seller/po/${po.id}`)}>
              <p className="text-sm font-bold text-orange-400 lg:col-span-2">{po.poNumber}</p>
              <p className="text-sm text-white lg:col-span-3">{po.buyerCompany?.name || 'N/A'}</p>
              <div className="lg:col-span-2"><StatusBadge status={fmtStatus(po.status)} /></div>
              <p className="text-sm text-white/80 lg:col-span-2">
                {po.currency || 'INR'} {(po.totalAmount || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-center text-sm text-white/60 lg:col-span-1">{po._count?.lineItems || 0}</p>
              <div className="lg:col-span-2">
                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/seller/po/${po.id}`); }}>
                  <ArrowRight className="mr-1 h-3 w-3" />Review
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
