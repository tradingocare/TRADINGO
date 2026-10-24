'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Bookmark } from 'lucide-react'

interface CardImageProps {
  images: string[]
  slug: string
  title: string
  isSaved: boolean
  onSave: () => void
  discountPct: number
  isBestseller?: boolean
  isPremium?: boolean
  variant: 'default' | 'compact' | 'minimal'
}

export function CardImage({
  images, slug, title, isSaved, onSave,
  discountPct, isBestseller, isPremium, variant,
}: CardImageProps) {
  const allImages = images?.length ? images : ['/placeholder-product.jpg']
  const [imgIdx, setImgIdx] = useState(0)

  const imgClasses = variant === 'minimal'
    ? 'aspect-[4/3]'
    : variant === 'compact'
    ? 'aspect-[4/3]'
    : 'w-full md:w-[35%] min-h-[180px] max-h-[420px]'

  return (
    <div className={`relative overflow-hidden flex-shrink-0 bg-surface ${imgClasses}`}>
      <Link href={`/products/${slug}`}>
        <img
          src={allImages[imgIdx]}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
          loading="lazy"
        />
      </Link>

      {allImages.length > 1 && variant !== 'minimal' && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setImgIdx(i => (i - 1 + allImages.length) % allImages.length) }}
            aria-label="Previous image"
            className="absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-surface shadow-sm text-text-secondary hover:text-text-primary opacity-0 hover:opacity-100 transition-opacity"
          >
            <ChevronLeft size={12} />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setImgIdx(i => (i + 1) % allImages.length) }}
            aria-label="Next image"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-surface shadow-sm text-text-secondary hover:text-text-primary opacity-0 hover:opacity-100 transition-opacity"
          >
            <ChevronRight size={12} />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5" role="tablist" aria-label="Image navigation">
            {allImages.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setImgIdx(i) }}
                aria-label={`Image ${i + 1} of ${allImages.length}`}
                className={`h-1.5 rounded-full transition-all ${i === imgIdx ? 'w-4 bg-accent' : 'w-1.5 bg-white/60'}`}
              />
            ))}
          </div>
        </>
      )}

      {allImages.length > 1 && variant !== 'minimal' && (
        <div className="absolute bottom-2 right-2 flex items-center gap-1">
          {allImages.slice(0, 3).map((img, i) => (
            <button
              key={i}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setImgIdx(i) }}
              aria-label={`Thumbnail ${i + 1}`}
              className={`w-6 h-6 rounded-md overflow-hidden transition-all ${i === imgIdx ? 'opacity-100 ring-2 ring-accent' : 'opacity-70 hover:opacity-100'}`}
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}
            >
              <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
          {allImages.length > 3 && (
            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-md"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
              +{allImages.length - 3}
            </span>
          )}
        </div>
      )}

      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSave() }}
        aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
        className="absolute top-2 right-2 flex items-center justify-center w-7 h-7 rounded-full transition-all hover:scale-105"
        style={{
          background: isSaved ? 'color-mix(in srgb, var(--accent) 20%, transparent)' : 'var(--bg-elevated)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        <Bookmark size={13} className={isSaved ? 'fill-accent text-accent' : 'text-text-secondary'} />
      </button>

      <div className="absolute bottom-2 left-2 flex flex-col gap-1">
        {isBestseller && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold"
            style={{ background: 'color-mix(in srgb, var(--accent) 8%, transparent)', color: 'var(--accent)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)' }}>
            Bestseller
          </span>
        )}
        {discountPct > 0 && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold"
            style={{ background: 'color-mix(in srgb, var(--status-error) 8%, transparent)', color: 'var(--status-error)', border: '1px solid color-mix(in srgb, var(--status-error) 20%, transparent)' }}>
            -{discountPct}%
          </span>
        )}
        {isPremium && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold"
            style={{ background: 'color-mix(in srgb, var(--accent-gold) 15%, transparent)', color: 'var(--accent-gold)', border: '1px solid color-mix(in srgb, var(--accent-gold) 30%, transparent)' }}>
            PREMIUM
          </span>
        )}
      </div>
    </div>
  )
}
