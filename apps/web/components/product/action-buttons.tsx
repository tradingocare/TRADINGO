'use client';

import { cn } from '@/lib/utils';
import { Heart, BarChart3, FileText, MessageCircle, ShoppingCart, Minus, Plus, Download } from 'lucide-react';

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

const GLASS = {
  bg: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.09)',
  hoverBg: 'rgba(255,255,255,0.08)',
};

export function ActionButtons({
  onWishlist, onCompare, onRFQ, onChat, onBuy, onDownloadBrochure,
  quantity, onQuantityChange, isWishlisted, isCompared, attachments, directPurchaseEnabled, className,
}: ActionButtonsProps) {
  const activeBg = 'rgba(255,77,0,0.2)';
  const activeBorder = '1px solid rgba(255,77,0,0.4)';

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      <div className="flex items-center rounded-xl overflow-hidden"
        style={{ background: GLASS.bg, border: GLASS.border }}>
        <button onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
          className="flex h-10 w-10 items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all" aria-label="Decrease quantity">
          <Minus size={14} />
        </button>
        <input type="number" value={quantity}
          onChange={(e) => { const v = parseInt(e.target.value, 10); if (!isNaN(v) && v >= 1) onQuantityChange(v); }}
          className="h-10 w-14 text-center text-sm font-bold text-white bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          style={{ borderLeft: GLASS.border, borderRight: GLASS.border }} min={1} />
        <button onClick={() => onQuantityChange(quantity + 1)}
          className="flex h-10 w-10 items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all" aria-label="Increase quantity">
          <Plus size={14} />
        </button>
      </div>

      <button onClick={onWishlist}
        className="flex items-center justify-center w-10 h-10 rounded-xl transition-all"
        style={{
          background: isWishlisted ? activeBg : GLASS.bg,
          border: isWishlisted ? activeBorder : GLASS.border,
          color: isWishlisted ? '#FF4D00' : 'rgba(255,255,255,0.6)',
        }} title={isWishlisted ? 'Saved' : 'Add to Wishlist'}>
        <Heart size={15} className={cn(isWishlisted && 'fill-current')} />
      </button>

      <button onClick={onCompare}
        className="flex items-center justify-center w-10 h-10 rounded-xl transition-all"
        style={{
          background: isCompared ? activeBg : GLASS.bg,
          border: isCompared ? activeBorder : GLASS.border,
          color: isCompared ? '#FF4D00' : 'rgba(255,255,255,0.6)',
        }} title={isCompared ? 'In Compare' : 'Add to Compare'}>
        <BarChart3 size={15} />
      </button>

      <button onClick={onRFQ}
        className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-[11px] font-bold transition-all"
        style={{
          background: 'rgba(255,77,0,0.15)',
          border: '1px solid rgba(255,77,0,0.35)',
          color: '#FF4D00',
        }}>
        <FileText size={13} /> RFQ
      </button>

      <button onClick={onChat}
        className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-[11px] font-bold transition-all"
        style={{ background: GLASS.bg, border: GLASS.border, color: 'rgba(255,255,255,0.7)' }}>
        <MessageCircle size={13} /> Chat
      </button>

      {directPurchaseEnabled && (
        <button onClick={onBuy}
          className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all"
          style={{ background: 'linear-gradient(135deg, #FF4D00, #FF7A3D)', color: '#fff', boxShadow: '0 4px 16px rgba(255,77,0,0.3)' }}>
          <ShoppingCart size={14} /> Buy Now
        </button>
      )}

      {attachments && attachments.length > 0 && (
        <button onClick={onDownloadBrochure}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[11px] font-medium transition-all"
          style={{ background: GLASS.bg, border: GLASS.border, color: 'rgba(255,255,255,0.5)' }}>
          <Download size={13} /> Brochure
        </button>
      )}
    </div>
  );
}
