'use client'

import { PageHeader } from '@/components/shared/page-header'
import { Star, MessageSquare, ThumbsUp, Flag } from 'lucide-react'

const reviews = [
  {
    id: 1,
    buyer: 'Rajesh Kumar',
    company: 'Kumar Steel Industries',
    product: 'MS Flat Bars',
    rating: 5,
    comment: 'Excellent quality steel bars. Delivery was on time and packaging was secure. Will order again.',
    date: '2026-06-20',
    verified: true,
  },
  {
    id: 2,
    buyer: 'Priya Sharma',
    company: 'Sharma Constructions',
    product: 'TMT Bars 12mm',
    rating: 4,
    comment: 'Good quality product. Minor delay in delivery but seller communicated proactively.',
    date: '2026-06-18',
    verified: true,
  },
  {
    id: 3,
    buyer: 'Amit Patel',
    company: 'Patel Hardware',
    product: 'Copper Wire 2.5sqmm',
    rating: 5,
    comment: 'Best price online. Genuine copper wires with proper BIS certification.',
    date: '2026-06-15',
    verified: false,
  },
]

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < rating ? 'fill-[#FF4D00] text-[#FF4D00]' : 'text-white/20'}`}
        />
      ))}
    </div>
  )
}

export default function SellerReviewsPage() {
  const avgRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ background: '#1D0001' }}>
      <div className="max-w-6xl mx-auto px-4">
        <PageHeader
          title="Reviews & Ratings"
          description="View and respond to buyer feedback on your products."
        />

        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          <div className="rounded-3xl p-6" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.09)' }}>
            <p className="text-sm text-white/60">Average Rating</p>
            <p className="mt-1 text-3xl font-bold text-white">{avgRating}</p>
            <StarRating rating={Math.round(Number(avgRating))} />
          </div>
          <div className="rounded-3xl p-6" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.09)' }}>
            <p className="text-sm text-white/60">Total Reviews</p>
            <p className="mt-1 text-3xl font-bold text-white">{reviews.length}</p>
            <p className="mt-1 text-xs text-white/40">Across all products</p>
          </div>
          <div className="rounded-3xl p-6" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.09)' }}>
            <p className="text-sm text-white/60">Response Rate</p>
            <p className="mt-1 text-3xl font-bold text-white">100%</p>
            <p className="mt-1 text-xs text-white/40">Average response time: 2h</p>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-3xl p-6"
              style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.09)' }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF4D00]/10 text-[#FF4D00]">
                    <span className="text-sm font-bold">{review.buyer.split(' ').map(n => n[0]).join('')}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">{review.buyer}</p>
                      {review.verified && (
                        <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-400">
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/50">{review.company}</p>
                  </div>
                </div>
                <p className="text-xs text-white/40">{review.date}</p>
              </div>

              <div className="mt-3">
                <p className="text-xs text-white/60">Product: {review.product}</p>
                <StarRating rating={review.rating} />
              </div>

              <p className="mt-3 text-sm text-white/70">{review.comment}</p>

              <div className="mt-4 flex items-center gap-4">
                <button className="flex items-center gap-1.5 text-xs text-white/40 transition-colors hover:text-[#FF4D00]">
                  <ThumbsUp className="h-3.5 w-3.5" />
                  Helpful
                </button>
                <button className="flex items-center gap-1.5 text-xs text-white/40 transition-colors hover:text-[#FF4D00]">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Reply
                </button>
                <button className="flex items-center gap-1.5 text-xs text-white/40 transition-colors hover:text-red-400">
                  <Flag className="h-3.5 w-3.5" />
                  Report
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
