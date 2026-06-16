'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Star, ThumbsUp, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/store/auth-store';
import { createProductReview, markReviewHelpful } from '@/lib/api/products';
import { type ProductDetailReview } from '@/types/product-detail';

interface ReviewStats {
  average: number;
  total: number;
  breakdown: { 5: number; 4: number; 3: number; 2: number; 1: number };
}

interface ReviewsSectionProps {
  reviews: ProductDetailReview[];
  stats: ReviewStats;
  productSlug?: string;
}

const PAGE_SIZE = 5;

function StarRating({ rating, size = 'sm', interactive, onChange }: { rating: number; size?: 'sm' | 'lg'; interactive?: boolean; onChange?: (val: number) => void }) {
  const cls = size === 'lg' ? 'h-5 w-5' : 'h-3.5 w-3.5';
  const [hover, setHover] = useState(0);
  const display = interactive ? (hover || rating) : rating;
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(s)}
          onMouseEnter={() => interactive && setHover(s)}
          onMouseLeave={() => interactive && setHover(0)}
          className={cn(interactive && 'cursor-pointer transition-transform hover:scale-110')}
        >
          <Star
            className={cn(cls, 'transition-colors',
              s <= display
                ? 'fill-amber-400 text-amber-400'
                : 'fill-none text-border dark:text-dark-border',
            )}
          />
        </button>
      ))}
    </span>
  );
}

export function ReviewsSection({
  reviews,
  stats,
  productSlug,
}: ReviewsSectionProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<'recent' | 'highest' | 'lowest'>('recent');
  const [showModal, setShowModal] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const sorted = [...reviews].sort((a, b) => {
    if (sortBy === 'highest') return b.rating - a.rating;
    if (sortBy === 'lowest') return a.rating - b.rating;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const maxBreakdown = Math.max(...Object.values(stats.breakdown));

  const handleWriteReview = () => {
    if (!user) { router.push('/login'); return; }
    setNewRating(0);
    setNewTitle('');
    setNewBody('');
    setShowModal(true);
  };

  const handleSubmitReview = async () => {
    if (!productSlug || newRating === 0) return;
    setSubmitting(true);
    try {
      await createProductReview(productSlug, { rating: newRating, title: newTitle || undefined, review: newBody || undefined });
      toast({ title: 'Review submitted', description: 'Your review will appear after approval.' });
      setShowModal(false);
    } catch {
      toast({ title: 'Failed to submit review', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleHelpful = async (reviewId: string) => {
    if (!productSlug) return;
    if (!user) { router.push('/login'); return; }
    try {
      await markReviewHelpful(productSlug, reviewId);
      toast({ title: 'Marked as helpful' });
    } catch {
      toast({ title: 'Failed to mark helpful', variant: 'destructive' });
    }
  };

  return (
    <>
      <div className="space-y-8">
        <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-6 dark:bg-dark-surface dark:border-dark-border">
            <span className="text-5xl font-bold text-text-primary dark:text-dark-text-primary">
              {stats.average.toFixed(1)}
            </span>
            <StarRating rating={Math.round(stats.average)} size="lg" />
            <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">
              {stats.total} review{stats.total !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="space-y-2">
            {([5, 4, 3, 2, 1] as const).map((star) => {
              const count = stats.breakdown[star];
              const pct = maxBreakdown > 0 ? (count / maxBreakdown) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-sm">
                  <span className="w-8 text-right text-text-secondary dark:text-dark-text-secondary">
                    {star}
                  </span>
                  <Star className="h-3.5 w-3.5 text-amber-400" />
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-tertiary dark:bg-dark-surface-tertiary">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-10 text-text-tertiary dark:text-dark-text-tertiary">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <Button variant="outline" onClick={handleWriteReview}>
            Write a Review
          </Button>
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value as typeof sortBy); setPage(1); }}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary dark:border-dark-border dark:bg-dark-surface dark:text-dark-text-primary"
          >
            <option value="recent">Most Recent</option>
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
          </select>
        </div>

        {paged.length === 0 && (
          <p className="py-8 text-center text-text-secondary dark:text-dark-text-secondary">
            No reviews yet. Be the first to review this product!
          </p>
        )}

        <div className="space-y-4">
          {paged.map((review) => (
            <div
              key={review.id}
              className="rounded-xl border border-border bg-surface p-5 dark:bg-dark-surface dark:border-dark-border"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-500/10 text-sm font-semibold text-primary-700 dark:text-primary-300">
                    {(review.userName || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">
                      {review.userName || 'Anonymous'}
                    </p>
                    <div className="flex items-center gap-2">
                      <StarRating rating={review.rating} />
                      <span className="text-xs text-text-tertiary dark:text-dark-text-tertiary">
                        {new Date(review.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {review.title && (
                <p className="mt-3 text-sm font-semibold text-text-primary dark:text-dark-text-primary">
                  {review.title}
                </p>
              )}
              {review.review && (
                <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed">
                  {review.review}
                </p>
              )}

              <button
                onClick={() => handleHelpful(review.id)}
                className="mt-3 flex items-center gap-1.5 text-xs text-text-tertiary hover:text-primary-600 dark:text-dark-text-tertiary dark:hover:text-primary-400"
              >
                <ThumbsUp className="h-3.5 w-3.5" />
                Helpful ({review.helpfulCount})
              </button>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant={p === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPage(p)}
                className="min-w-[2rem]"
              >
                {p}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-2xl dark:bg-dark-surface">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">Write a Review</h3>
              <button onClick={() => setShowModal(false)} className="rounded-full p-1 hover:bg-surface-secondary dark:hover:bg-dark-surface-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-text-primary dark:text-dark-text-primary">Rating *</label>
                <StarRating rating={newRating} size="lg" interactive onChange={setNewRating} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-text-primary dark:text-dark-text-primary">Title (optional)</label>
                <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Summary of your review" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-text-primary dark:text-dark-text-primary">Review (optional)</label>
                <Textarea value={newBody} onChange={(e) => setNewBody(e.target.value)} placeholder="Share your experience with this product..." rows={4} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button onClick={handleSubmitReview} disabled={newRating === 0 || submitting}>
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
