'use client'

import { PageHeader } from '@/components/shared/page-header';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Star, ThumbsUp, Loader2 } from 'lucide-react';

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-4 w-4 ${i < rating ? 'fill-[#FF4D00] text-[#FF4D00]' : 'text-white/20'}`} />
      ))}
    </div>
  );
}

export default function SellerReviewsPage() {
  const { data: company } = useQuery({
    queryKey: ['my-company'],
    queryFn: () => apiClient.get('/companies/my-company').then(r => r.data),
  });
  const slug = company?.slug;

  const { data: reviewsData, isLoading, error } = useQuery({
    queryKey: ['company-reviews', slug],
    queryFn: () => apiClient.get(`/companies/${slug}/reviews`).then(r => r.data),
    enabled: !!slug,
  });

  const reviews = reviewsData?.reviews || [];
  const avgRating = reviewsData?.average?.toFixed(1) || '0.0';
  const totalReviews = reviewsData?.total || 0;

  if (isLoading) return <div className="min-h-screen pt-24 pb-16" style={{ background: '#1D0001' }}><div className="max-w-6xl mx-auto px-4"><div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-white/40" /></div></div></div>;

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ background: '#1D0001' }}>
      <div className="max-w-6xl mx-auto px-4">
        <PageHeader title="Reviews & Ratings" description="View buyer feedback on your products." />

        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          <div className="rounded-3xl p-6" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.09)' }}>
            <p className="text-sm text-white/60">Average Rating</p>
            <p className="mt-1 text-3xl font-bold text-white">{avgRating}</p>
            <StarRating rating={Math.round(Number(avgRating))} />
          </div>
          <div className="rounded-3xl p-6" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.09)' }}>
            <p className="text-sm text-white/60">Total Reviews</p>
            <p className="mt-1 text-3xl font-bold text-white">{totalReviews}</p>
            <p className="mt-1 text-xs text-white/40">Across all products</p>
          </div>
          <div className="rounded-3xl p-6" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.09)' }}>
            <p className="text-sm text-white/60">Response Rate</p>
            <p className="mt-1 text-3xl font-bold text-white">--</p>
            <p className="mt-1 text-xs text-white/40">Coming soon</p>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {error && <p className="text-sm text-white/40 text-center py-8">Failed to load reviews.</p>}
          {!error && reviews.length === 0 && <p className="text-sm text-white/40 text-center py-8">No reviews yet.</p>}
          {reviews.map((review: any) => (
            <div key={review.id}
              className="rounded-3xl p-6"
              style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.09)' }}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF4D00]/10 text-[#FF4D00]">
                    <span className="text-sm font-bold">{(review.userName || 'A').charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{review.userName || 'Anonymous'}</p>
                  </div>
                </div>
                <p className="text-xs text-white/40">{review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-IN') : ''}</p>
              </div>
              <div className="mt-3">
                <StarRating rating={review.rating} />
              </div>
              <p className="mt-2 text-sm text-white/70">{review.review || review.comment}</p>
              <div className="mt-3 flex items-center gap-2 text-xs text-white/40">
                <ThumbsUp className="h-3.5 w-3.5" />
                <span>{review.helpfulCount || 0} helpful</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
