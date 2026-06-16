'use client';

import { cn } from '@/lib/utils';
import { Heart, BarChart3, FileText, MessageCircle, ShoppingCart, Minus, Plus, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ActionButtonsProps {
  onWishlist?: () => void;
  onCompare?: () => void;
  onRFQ?: () => void;
  onChat?: () => void;
  onBuy?: () => void;
  onDownloadBrochure?: () => void;
  quantity: number;
  onQuantityChange: (qty: number) => void;
  isWishlisted?: boolean;
  isCompared?: boolean;
  attachments?: { id: string; url: string; title?: string }[];
  directPurchaseEnabled?: boolean;
  className?: string;
}

export function ActionButtons({
  onWishlist,
  onCompare,
  onRFQ,
  onChat,
  onBuy,
  onDownloadBrochure,
  quantity,
  onQuantityChange,
  isWishlisted,
  isCompared,
  attachments,
  directPurchaseEnabled,
  className,
}: ActionButtonsProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      <div className="flex items-center rounded-lg border border-border dark:border-dark-border">
        <button
          onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
          className="flex h-10 w-10 items-center justify-center text-text-secondary hover:text-text-primary dark:text-dark-text-secondary dark:hover:text-dark-text-primary"
          aria-label="Decrease quantity"
        >
          <Minus className="h-4 w-4" />
        </button>
        <input
          type="number"
          value={quantity}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            if (!isNaN(v) && v >= 1) onQuantityChange(v);
          }}
          className="h-10 w-14 border-x border-border bg-surface text-center text-sm font-medium text-text-primary focus:outline-none dark:border-dark-border dark:bg-dark-surface dark:text-dark-text-primary"
          min={1}
        />
        <button
          onClick={() => onQuantityChange(quantity + 1)}
          className="flex h-10 w-10 items-center justify-center text-text-secondary hover:text-text-primary dark:text-dark-text-secondary dark:hover:text-dark-text-primary"
          aria-label="Increase quantity"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <Button
        variant={isWishlisted ? 'default' : 'outline'}
        size="icon"
        onClick={onWishlist}
        title={isWishlisted ? 'Saved' : 'Add to Wishlist'}
      >
        <Heart className={cn('h-4 w-4', isWishlisted && 'fill-current')} />
      </Button>

      <Button
        variant={isCompared ? 'default' : 'outline'}
        size="icon"
        onClick={onCompare}
        title={isCompared ? 'In Compare' : 'Add to Compare'}
      >
        <BarChart3 className="h-4 w-4" />
      </Button>

      <Button variant="accent" onClick={onRFQ}>
        <FileText className="mr-2 h-4 w-4" />
        Request for Quote
      </Button>

      <Button variant="secondary" onClick={onChat}>
        <MessageCircle className="mr-2 h-4 w-4" />
        Chat with Seller
      </Button>

      {directPurchaseEnabled && (
        <Button variant="default" onClick={onBuy}>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Buy Now
        </Button>
      )}

      {attachments && attachments.length > 0 && (
        <Button variant="ghost" onClick={onDownloadBrochure}>
          <Download className="mr-2 h-4 w-4" />
          Download Brochure
        </Button>
      )}
    </div>
  );
}
