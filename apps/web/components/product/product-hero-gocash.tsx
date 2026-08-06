'use client';

import { Wallet, IndianRupee } from 'lucide-react';
import { gocashFromPrice } from './product-hero-price';

interface ProductHeroGocashProps {
  price?: number;
  goCashEligible?: boolean;
}

export function ProductHeroGocash({ price, goCashEligible }: ProductHeroGocashProps) {
  if (!goCashEligible || price == null || price <= 0) return null;

  const earn = gocashFromPrice(price);
  if (earn <= 0) return null;

  return (
    <div className="inline-flex items-center gap-3 rounded-2xl border border-accent-amber/25 bg-bg-elevated px-4 py-3 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent-amber/25 bg-accent-amber/10 text-accent-amber">
        <Wallet size={16} />
      </div>
      <div className="leading-tight">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent-amber/80">
          GOCASH
        </p>
        <p className="flex items-center gap-1 text-sm font-bold text-accent-amber">
          +<IndianRupee size={12} className="inline" />
          {earn.toLocaleString('en-IN')} GOCASH
        </p>
        <p className="text-xs text-text-secondary">on this purchase</p>
      </div>
    </div>
  );
}
