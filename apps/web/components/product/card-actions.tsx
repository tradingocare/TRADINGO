'use client'

import {
  ShoppingCart, FileQuestion, MessageCircle,
  Bookmark, ArrowLeftRight, Info, Flag,
} from 'lucide-react'
import Link from 'next/link'
import type { ProductCardModel } from '@/types/product-card'

interface CardActionsProps {
  product: ProductCardModel
  inCompare: boolean
  isSaved: boolean
  qty?: number
  onBuy: () => void
  onRFQ: () => void
  onChat: () => void
  onSave: () => void
  onCompare: () => void
  onReport?: () => void
  showReport?: boolean
}

export function CardActions({
  product, inCompare, isSaved, qty,
  onBuy, onRFQ, onChat, onSave, onCompare, onReport, showReport = false,
}: CardActionsProps) {
  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
        <button onClick={onRFQ}
          className="flex items-center justify-center gap-1 px-1 py-1.5 sm:py-2 rounded-lg text-[11px] font-bold text-btn-primary-text transition-all cursor-pointer"
          style={{ background: 'linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 70%, #ffaa00))' }}>
          <FileQuestion size={13} /> <span className="hidden sm:inline">RFQ</span>
        </button>
        <button onClick={onBuy} disabled={!product.inStock}
          className="flex items-center justify-center gap-1 px-1 py-1.5 sm:py-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer disabled:opacity-50"
          style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent-light)', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)' }}>
          <ShoppingCart size={13} /> <span className="hidden sm:inline">Buy{qty ? ` ${qty.toLocaleString('en-IN')}` : ''}</span>
        </button>
        <button onClick={onChat}
          className="flex items-center justify-center gap-1 px-1 py-1.5 sm:py-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer"
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
          <MessageCircle size={13} /> <span className="hidden sm:inline">Chat</span>
        </button>
        <button onClick={onSave}
          className="flex items-center justify-center gap-1 px-1 py-1.5 sm:py-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer"
          style={{
            background: isSaved ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'var(--bg-elevated)',
            color: isSaved ? 'var(--accent-light)' : 'var(--text-secondary)',
            border: isSaved ? '1px solid color-mix(in srgb, var(--accent) 30%, transparent)' : '1px solid var(--border-color)',
          }}>
          <Bookmark size={13} /> <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
        </button>
        <button onClick={onCompare}
          className="flex items-center justify-center gap-1 px-1 py-1.5 sm:py-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer"
          style={{
            background: inCompare ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'var(--bg-elevated)',
            color: inCompare ? 'var(--accent-light)' : 'var(--text-secondary)',
            border: inCompare ? '1px solid color-mix(in srgb, var(--accent) 30%, transparent)' : '1px solid var(--border-color)',
          }}>
          <ArrowLeftRight size={13} /> <span className="hidden sm:inline">{inCompare ? 'Added' : 'Cmp'}</span>
        </button>
        <Link href={`/products/${product.slug}`}
          className="flex items-center justify-center gap-1 px-1 py-1.5 sm:py-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer"
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
          <Info size={13} /> <span className="hidden sm:inline">Info</span>
        </Link>
      </div>
      {showReport && onReport && (
        <button onClick={onReport}
          className="flex items-center gap-0.5 mt-1 ml-auto text-[9px] hover:text-accent transition-colors cursor-pointer"
          style={{ color: 'var(--text-tertiary)' }}>
          <Flag size={10} /> Report
        </button>
      )}
    </div>
  )
}
