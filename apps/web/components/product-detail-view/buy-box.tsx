'use client';

import {
  ArrowLeftRight,
  BadgeCheck,
  Bookmark,
  CheckCircle2,
  IndianRupee,
  MessageCircle,
  Package,
  RefreshCw,
  Share2,
  Truck,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProductHeroPrice, VolumePricingLadder } from '@/components/product/product-hero-price';
import { ProductHeroGocash } from '@/components/product/product-hero-gocash';
import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import type { ProductDetailPriceSlab } from '@/types/product-detail';
import type { ProductDetailViewData } from '@/types/product-detail-view';

interface BuyBoxProps {
  data: ProductDetailViewData;
  priceSlabs: ProductDetailPriceSlab[];
  price: number;
  quantity: number;
  onQuantityChange: (next: number) => void;
  isWishlisted: boolean;
  isCompared: boolean;
  onBuy: () => void;
  onRFQ: () => void;
  onChat: () => void;
  onSave: () => void;
  onCompare: () => void;
  onShare: () => void;
}

function IconAction({ icon: Icon, label, active, onClick }: {
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'flex flex-col items-center gap-1 rounded-xl border border-border bg-bg-elevated px-2 py-2.5 text-[11px] font-medium text-text-secondary transition-all hover:border-accent/40 hover:text-accent',
        active && 'border-accent/50 bg-accent/10 text-accent',
      )}
    >
      <Icon size={16} className={cn(active && 'text-accent')} />
      {label}
    </button>
  );
}

function DetailRow({ icon: Icon, label, value, colorClass }: {
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  label: string;
  value: string;
  colorClass: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-lg border px-2 py-0.5 text-[10px]', colorClass)}>
      <Icon size={10} />
      <span className="opacity-80">{label}</span>
      <span className="font-semibold">{value}</span>
    </span>
  );
}

const ORDER_GRADIENT_BORDER = 'linear-gradient(90deg, #FF4D00, #F59E0B, #3D8BFF, #9B5DE5)';

export function BuyBox({
  data,
  priceSlabs,
  price,
  quantity,
  onQuantityChange,
  isWishlisted,
  isCompared,
  onBuy,
  onRFQ,
  onChat,
  onSave,
  onCompare,
  onShare,
}: BuyBoxProps) {
  const { stock, moq, leadTime, unit, mrp, seller } = data;
  const maxSlabPrice = priceSlabs.length ? Math.max(...priceSlabs.map((slab) => slab.price)) : price;
  const lowestPrice = priceSlabs.length ? Math.min(...priceSlabs.map((slab) => slab.price)) : price;
  const quantityOptions = Array.from(new Set([moq || 1, 2, 5, 10, 25, 50]))
    .filter((value) => value > 0 && value >= moq)
    .sort((a, b) => a - b);

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-lg lg:sticky lg:top-28">
      <div className="rounded-xl border border-accent/25 bg-accent/5 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">Offer Price</p>
        <div className="mt-1">
          <ProductHeroPrice price={price} originalPrice={mrp} unit={unit} />
        </div>
        <div className="mt-3 border-t border-border/60 pt-3">
          <ProductHeroGocash price={price} goCashEligible={true} />
        </div>
      </div>

      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">Order Details</p>
        <div className="rounded-2xl p-[1.5px]" style={{ background: ORDER_GRADIENT_BORDER }}>
          <div className="rounded-[14px] bg-surface px-3 py-2">
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1.5">
              <span className="inline-flex items-center gap-1.5">
                <span className={cn(
                  'inline-flex items-center gap-1 whitespace-nowrap rounded-lg border px-2 py-0.5 text-[10px] font-bold',
                  stock.inStock
                    ? 'border-status-success/25 bg-status-success/10 text-status-success'
                    : 'border-status-error/25 bg-status-error/10 text-status-error',
                )}>
                  {stock.inStock ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                  {stock.statusLabel}
                </span>
                <VerifiedBadge type="trusted" showLabel={false} size="sm" className="text-blue-500" />
                <span className="inline-flex items-center whitespace-nowrap rounded-lg border border-blue-500/25 bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-500">
                  TradTrust
                </span>
              </span>
              {stock.quantity != null && stock.quantity > 0 && (
                <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-sky-400/25 bg-sky-400/10 px-2 py-0.5 text-[10px] text-sky-400">
                  {stock.quantity} units available
                </span>
              )}
              <DetailRow icon={Package} label="MOQ" value={`${moq} ${moq === 1 ? 'unit' : unit || 'units'}`} colorClass="border-orange-400/25 bg-orange-400/10 text-orange-400" />
              <DetailRow icon={Truck} label="Lead Time" value={leadTime || 'Contact seller'} colorClass="border-red-400/25 bg-red-400/10 text-red-400" />
              <DetailRow icon={RefreshCw} label="Est. Delivery" value={leadTime || 'On request'} colorClass="border-sky-400/25 bg-sky-400/10 text-sky-400" />
              <DetailRow icon={BadgeCheck} label="GST" value={seller.gstVerified ? 'Invoice Available' : 'On request'} colorClass="border-status-success/25 bg-status-success/10 text-status-success" />
            </div>
          </div>
        </div>
      </div>

      {priceSlabs.length > 1 && (
        <VolumePricingLadder
          priceSlabs={priceSlabs}
          maxSlabPrice={maxSlabPrice}
          lowestPrice={lowestPrice}
          unit={unit}
        />
      )}

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-tertiary">Quantity</p>
        <div className="flex flex-wrap gap-2">
          {quantityOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onQuantityChange(option)}
              className={cn(
                'rounded-xl border px-3.5 py-1.5 text-sm font-semibold transition-all',
                quantity === option
                  ? 'border-accent bg-accent text-text-on-accent'
                  : 'border-border bg-bg-elevated text-text-secondary hover:border-accent/40 hover:text-accent',
              )}
            >
              {option}
            </button>
          ))}
          <input
            type="number"
            min={moq}
            value={quantity}
            onChange={(event) => onQuantityChange(Math.max(moq || 1, Number(event.target.value) || moq || 1))}
            className="w-24 rounded-xl border border-border bg-bg-elevated px-3 py-1.5 text-sm font-semibold text-text-primary outline-none transition-colors focus:border-accent"
            aria-label="Custom quantity"
          />
        </div>
        <p className="mt-2 text-xs text-text-tertiary">
          Price per unit at selected quantity:
          <span className="ml-1 inline-flex items-center font-bold text-text-primary">
            <IndianRupee size={11} className="inline" />
            {price.toLocaleString('en-IN')}
          </span>
          {unit ? ` / ${unit}` : ' / unit'}
        </p>
      </div>

      <div className="space-y-2.5">
        <button
          type="button"
          onClick={onBuy}
          disabled={!stock.inStock}
          className="w-full rounded-xl bg-accent py-3 text-sm font-bold text-text-on-accent shadow-lg shadow-accent/20 transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Buy / Place Order
        </button>
        <button
          type="button"
          onClick={onRFQ}
          className="w-full rounded-xl border border-accent/40 bg-accent/10 py-3 text-sm font-bold text-accent transition-all hover:bg-accent/20"
        >
          Request Call / RFQ
        </button>
        <button
          type="button"
          onClick={onChat}
          className="w-full rounded-xl border border-border bg-bg-elevated py-3 text-sm font-bold text-text-primary transition-all hover:border-accent/40 hover:text-accent"
        >
          💬 Chat with Seller
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <IconAction icon={Bookmark} label="Save" active={isWishlisted} onClick={onSave} />
        <IconAction icon={ArrowLeftRight} label="Compare" active={isCompared} onClick={onCompare} />
        <IconAction icon={Share2} label="Share" onClick={onShare} />
        <IconAction icon={MessageCircle} label="Chat" onClick={onChat} />
      </div>
    </div>
  );
}
