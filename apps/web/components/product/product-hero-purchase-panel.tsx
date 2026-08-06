'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  ShoppingCart,
  FileText,
  MessageCircle,
  Bookmark,
  ArrowLeftRight,
  Share2,
  BadgeCheck,
  Truck,
} from 'lucide-react';
import type { ProductDetail, ProductDetailMedia } from '@/types/product-detail';

const panelEase = [0.25, 0.1, 0.25, 1] as [number, number, number, number];

interface ProductHeroPurchasePanelProps {
  product: ProductDetail;
  quantity: number;
  onQuantityChange: (qty: number) => void;
  price: number;
  inStock: boolean;
  stockStatus: string;
  documents: ProductDetailMedia[];
  isWishlisted: boolean;
  isCompared: boolean;
  onBuy: () => void;
  onRFQ: () => void;
  onChat: () => void;
  onWishlist: () => void;
  onCompare: () => void;
  onShare: () => void;
  onSampleOrder?: () => void;
}

export function ProductHeroPurchasePanel({
  product,
  quantity,
  onQuantityChange,
  price,
  inStock,
  stockStatus,
  documents,
  isWishlisted,
  isCompared,
  onBuy,
  onRFQ,
  onChat,
  onWishlist,
  onCompare,
  onShare,
  onSampleOrder,
}: ProductHeroPurchasePanelProps) {
  void documents;
  void price;

  const unitLabel = product.unit || 'Unit';
  const availabilityLabel = inStock
    ? (stockStatus === 'LOW_STOCK' ? 'Low Stock' : 'In Stock')
    : 'Out of Stock';
  const leadTime = product.deliveryEta || 'Contact seller';
  const moqLabel = `${product.moq || 1} ${product.moq === 1 ? 'Unit' : unitLabel}`;
  const quantityOptions = Array.from(new Set([product.moq || 1, 2, 5, 10, 25, 50])).filter((value) => value > 0).sort((a, b) => a - b);

  const setQuantity = (next: number) => onQuantityChange(Math.max(product.moq || 1, next));

  return (
    <motion.aside
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.2, ease: panelEase }}
      className="rounded-2xl border border-border bg-surface/95 p-4 shadow-lg shadow-black/10 lg:sticky lg:top-24"
    >
      <div className="space-y-4">
        <div className="grid gap-2 text-sm">
          <div className="flex items-center justify-between rounded-xl border border-border bg-bg-elevated px-3 py-2.5">
            <span className="text-text-secondary">Availability</span>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 font-semibold',
                inStock ? 'text-status-success' : 'text-status-error',
              )}
            >
              <span className={cn('h-2 w-2 rounded-full', inStock ? 'bg-status-success' : 'bg-status-error')} />
              {availabilityLabel}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-bg-elevated px-3 py-2.5">
            <span className="text-text-secondary">MOQ</span>
            <span className="font-semibold text-text-primary">{moqLabel}</span>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-bg-elevated px-3 py-2.5">
            <span className="text-text-secondary">Lead Time</span>
            <span className="inline-flex items-center gap-1 font-semibold text-text-primary">
              <Truck size={13} className="text-accent" />
              {leadTime}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-bg-elevated px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-text-primary">Quantity</span>
            <span className="text-xs text-text-secondary">
              {quantity} {quantity === 1 ? unitLabel.replace(/s$/i, '') : unitLabel}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {quantityOptions.map((value) => {
              const active = value === quantity;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setQuantity(value)}
                  className={cn(
                    'min-w-0 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-all',
                    active
                      ? 'border-accent bg-accent text-text-on-accent shadow-sm shadow-accent/20'
                      : 'border-border bg-surface text-text-secondary hover:border-accent/30 hover:text-text-primary',
                  )}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={onBuy}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-text-on-accent shadow-lg shadow-accent/20 transition-all hover:brightness-110 active:scale-[0.99]"
        >
          <ShoppingCart size={16} />
          Buy Now
        </button>

        <button
          type="button"
          onClick={onRFQ}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-accent/40 bg-transparent px-4 text-sm font-bold text-accent transition-colors hover:border-accent hover:bg-accent/10"
        >
          <FileText size={16} />
          Request for Quote (RFQ)
        </button>

        <div className="grid grid-cols-4 gap-2 pt-1">
          <button
            type="button"
            onClick={onChat}
            className="flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-bg-elevated px-2 py-2 text-text-secondary transition-colors hover:border-accent/30 hover:text-text-primary"
          >
            <MessageCircle size={15} />
            <span className="text-[11px] font-medium">Chat</span>
          </button>
          <button
            type="button"
            onClick={onWishlist}
            className={cn(
              'flex flex-col items-center justify-center gap-1 rounded-xl border bg-bg-elevated px-2 py-2 transition-colors',
              isWishlisted ? 'border-accent/40 text-accent' : 'border-border text-text-secondary hover:border-accent/30 hover:text-text-primary',
            )}
          >
            <Bookmark size={15} className={cn(isWishlisted && 'fill-current')} />
            <span className="text-[11px] font-medium">Save</span>
          </button>
          <button
            type="button"
            onClick={onCompare}
            className={cn(
              'flex flex-col items-center justify-center gap-1 rounded-xl border bg-bg-elevated px-2 py-2 transition-colors',
              isCompared ? 'border-accent/40 text-accent' : 'border-border text-text-secondary hover:border-accent/30 hover:text-text-primary',
            )}
          >
            <ArrowLeftRight size={15} />
            <span className="text-[11px] font-medium">Compare</span>
          </button>
          <button
            type="button"
            onClick={onShare}
            className="flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-bg-elevated px-2 py-2 text-text-secondary transition-colors hover:border-accent/30 hover:text-text-primary"
          >
            <Share2 size={15} />
            <span className="text-[11px] font-medium">Share</span>
          </button>
        </div>

        {product.isSampleOrder && onSampleOrder && (
          <button
            type="button"
            onClick={onSampleOrder}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:border-accent/30 hover:text-text-primary"
          >
            <BadgeCheck size={15} className="text-accent" />
            Request Sample
          </button>
        )}
      </div>
    </motion.aside>
  );
}
