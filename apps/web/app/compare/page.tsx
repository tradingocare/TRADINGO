'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { X, ShoppingCart, ArrowLeft } from 'lucide-react';
import { useCompareStore } from '@/store/compare-store';
import { COMPARE_ROWS } from '@/data/master-data';
import SellerBadge, { resolveSellerInfo } from '@/components/shared/SellerBadge';

const ROW_GETTERS: Record<string, (p: any) => ReactNode> = {
  Price: p => `₹${(p.price ?? 0).toLocaleString('en-IN')} / ${p.unit ?? '—'}`,
  Seller: p => (
    <SellerBadge
      seller={resolveSellerInfo(p)}
      size="xs"
      showLocation={false}
      showStats={false}
      showLogo={false}
      linkToProfile={true}
    />
  ),
  'Trust Score': p => `${p.seller?.trustScore ?? '—'}/100`,
  Rating: p => `${(p.rating ?? 0).toFixed(1)} (${p.reviewCount ?? 0})`,
  Reviews: p => `${p.reviewCount ?? 0}`,
  Location: p => p.seller?.city ?? p.city ?? '—',
  'Geo Ring': p => `Ring ${p.geoRing ?? '—'}`,
  'Delivery ETA': p => p.deliveryEta || '—',
  MOQ: p => `${p.moq ?? '—'} ${p.unit ?? ''}`,
  'Payment Terms': p => p.paymentTerms || '—',
  'GOCASH Earn': p => p.gocashEligible ? '✓ Yes' : '✗ No',
  Verified: p => p.seller?.isVerified ? '✓ Yes' : '✗ No',
  'TRADGO Elite': p => p.seller?.isTradgoElite ? '✓ Yes' : '✗ No',
  'Response Time': p => p.seller?.responseTime || '—',
};

export default function ComparePage() {
  const { items, remove, clear } = useCompareStore();

  const glassCard = {
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.09)',
  };

  return (
    <div className="min-h-screen pt-24 pb-20" style={{ background: '#1D0001' }}>
      <div className="mx-auto max-w-5xl px-4">
        <Link href="/browse" className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-[#FF4D00] transition-colors">
          <ArrowLeft size={14} /> Back to Browse
        </Link>

        <h1 className="mb-6 text-2xl font-black text-white">
          Compare <span className="text-[#FF4D00]">Products</span>
        </h1>

        {items.length === 0 ? (
          <div className="rounded-3xl p-10 text-center" style={glassCard}>
            <p className="mb-4 text-white/50">
              Compare list is empty. Select products and click &quot;Compare&quot; to add them here.
            </p>
            <Link href="/browse"
              className="inline-flex rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #FF4D00, #FF7A3D)', boxShadow: '0 4px 16px rgba(255,77,0,0.3)' }}>
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl" style={glassCard}>
            <table className="min-w-[600px] w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.07]">
                  <th className="sticky left-0 px-4 py-3 text-left text-xs text-white/50" style={{ background: 'rgba(255,255,255,0.04)' }}>Feature</th>
                  {items.map(p => (
                    <th key={p._id} className="min-w-[180px] px-4 py-3">
                      <div className="relative">
                        <button onClick={() => remove(p._id)} className="absolute -right-1 -top-1 text-white/30 hover:text-white transition-colors">
                          <X size={14} />
                        </button>
                        <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-xl bg-white/[0.06] text-2xl">
                          {p.images?.[0] ? <img src={p.images[0]} alt={p.title} className="h-full w-full rounded-xl object-cover" /> : '📦'}
                        </div>
                        <p className="mb-2 line-clamp-2 text-center text-xs font-semibold text-white">{p.title}</p>
                        <Link href={`/checkout?productId=${p._id}&qty=${p.moq}`}
                          className="flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-[10px] font-semibold text-white transition-all hover:opacity-90"
                          style={{ background: 'linear-gradient(135deg, #FF4D00, #FF7A3D)' }}>
                          <ShoppingCart size={11} /> Buy
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row, i) => (
                  <tr key={row.field} className={`border-b border-white/[0.07] last:border-0 ${i % 2 ? 'bg-white/[0.02]' : ''}`}>
                    <td className="sticky left-0 px-4 py-3 text-xs font-medium text-white/50" style={{ background: i % 2 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.04)' }}>{row.field}</td>
                    {items.map(p => (
                      <td key={p._id} className="px-4 py-3 text-center text-xs text-white/80">{ROW_GETTERS[row.field]?.(p) ?? '—'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-4 text-center">
              <button onClick={clear} className="text-xs text-white/30 hover:text-white/60 transition-colors">Clear all</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
