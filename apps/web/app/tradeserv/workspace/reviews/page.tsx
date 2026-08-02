'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Star, MessageSquare, ThumbsUp, Copy, ExternalLink, ChevronDown, ChevronUp,
  CheckCircle, Clock, BarChart3, Quote, Reply,
  Search, X, Save, AlertCircle,
} from 'lucide-react';
import { DashboardPageHeader, StatusBadge } from '@/components/dashboard';
import { GlassCard } from '@/components/tradeserv/glass-card';
import { StatBox } from '@/components/tradeserv/stat-box';
import { StarRating } from '@/components/tradeserv/star-rating';
import { SaveToast } from '@/components/tradeserv/save-toast';
import { useSaveToast } from '@/hooks/use-save-toast';
import { useMyProfile, useReviews } from '@/hooks/use-tradeserv';

interface ReviewDisplay {
  id: string;
  clientName: string;
  clientInitial: string;
  rating: number;
  comment: string;
  serviceName: string;
  date: string;
  status: 'published' | 'pending' | 'archived';
  featured: boolean;
  response?: string;
  responseDate?: string;
  likes: number;
}

export default function ReviewsPage() {
  const { data: profile } = useMyProfile();
  const companyId = (profile as any)?.id || '';
  const { data: apiReviews, isLoading, error } = useReviews(companyId);
  const { saved, handleSave } = useSaveToast();

  const [reviews, setReviews] = useState<ReviewDisplay[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'pending' | 'archived'>('all');

  if (!initialized && apiReviews && Array.isArray(apiReviews)) {
    const mapped: ReviewDisplay[] = apiReviews.map((r: any) => ({
      id: r.id,
      clientName: r.client?.name || 'Client',
      clientInitial: (r.client?.name || 'C').charAt(0).toUpperCase(),
      rating: r.rating || 5,
      comment: r.description || '',
      serviceName: r.service?.name || '',
      date: new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: 'published' as const,
      featured: false,
      likes: 0,
    }));
    setReviews((prev) => prev.length === 0 ? mapped : prev);
    setInitialized(true);
  }

  const toggleSection = (id: string) => setActiveSection(activeSection === id ? null : id);

  const toggleFeatured = (id: string) => setReviews(reviews.map((r) => r.id === id ? { ...r, featured: true } : r));
  const removeFeatured = (id: string) => setReviews(reviews.map((r) => r.id === id ? { ...r, featured: false } : r));
  const toggleArchive = (id: string) => setReviews(reviews.map((r) => r.id === id ? { ...r, status: r.status === 'archived' ? 'published' : 'archived' as const } : r));
  const respondToReview = (id: string, response: string) => {
    if (!response.trim()) return;
    setReviews(reviews.map((r) => r.id === id ? {
      ...r, response,
      responseDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    } : r));
  };

  const total = reviews.length;
  const published = reviews.filter((r) => r.status === 'published').length;
  const pending = reviews.filter((r) => r.status === 'pending').length;
  const archived = reviews.filter((r) => r.status === 'archived').length;
  const avgRating = total > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / total) : 0;
  const fiveStar = reviews.filter((r) => r.rating === 5).length;
  const responded = reviews.filter((r) => r.response).length;
  const responseRate = published > 0 ? Math.round((responded / published) * 100) : 0;
  const featuredCount = reviews.filter((r) => r.featured).length;

  const filtered = reviews.filter((r) => {
    if (filterRating && r.rating !== filterRating) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    return true;
  });

  const breakdown = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length;
    const pct = total > 0 ? (count / total) * 100 : 0;
    return { star, count, pct };
  });

  if (error) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Reviews & Testimonials" description="Manage client reviews and your public reputation" />
        <GlassCard>
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <p className="text-sm text-text-tertiary">Failed to load reviews.</p>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Reviews & Testimonials"
        description="Manage client reviews, testimonials, and your public reputation"
      />

      <GlassCard>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-primary">
          <BarChart3 className="h-5 w-5 text-[#f59e0b]" />
          Reviews Dashboard
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <StatBox label="Total Reviews" value={total} />
          <StatBox label="Average Rating" value={total > 0 ? avgRating.toFixed(1) : '--'} sub={`${fiveStar} five-star`} />
          <StatBox label="5-Star Reviews" value={fiveStar} sub={total > 0 ? `${Math.round((fiveStar / total) * 100)}% of total` : ''} />
          <StatBox label="Featured" value={featuredCount} sub="as testimonials" />
          <StatBox label="Response Rate" value={`${responseRate}%`} sub={`${responded} of ${published} published`} />
        </div>
      </GlassCard>

      <GlassCard>
        <button type="button" onClick={() => toggleSection('breakdown')} className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#f59e0b]" />
            <h3 className="text-sm font-semibold text-text-primary">Rating Breakdown</h3>
          </div>
          {activeSection === 'breakdown' ? <ChevronUp className="h-4 w-4 text-text-tertiary" /> : <ChevronDown className="h-4 w-4 text-text-tertiary" />}
        </button>
        {activeSection === 'breakdown' && (
          <div className="mt-4 space-y-2.5 border-t border-border pt-4">
            {breakdown.map(({ star, count, pct }) => (
              <div key={star} className="flex items-center gap-3">
                <div className="flex w-12 items-center gap-1 text-xs text-text-tertiary">
                  {star} <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                </div>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-secondary">
                  <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-16 text-right text-xs text-text-tertiary">{count} ({Math.round(pct)}%)</span>
              </div>
            ))}
            <div className="mt-3 flex items-center gap-3 rounded-xl bg-surface px-4 py-3">
              <span className="text-sm text-text-tertiary">Average Rating</span>
              <StarRating rating={Math.round(avgRating)} size="md" />
              <span className="text-lg font-bold text-text-primary">{total > 0 ? avgRating.toFixed(1) : '--'}</span>
              <span className="text-xs text-text-tertiary">/ 5.0</span>
            </div>
          </div>
        )}
      </GlassCard>

      <GlassCard>
        <button type="button" onClick={() => toggleSection('list')} className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[#f59e0b]" />
            <h3 className="text-sm font-semibold text-text-primary">All Reviews ({filtered.length})</h3>
          </div>
          {activeSection === 'list' ? <ChevronUp className="h-4 w-4 text-text-tertiary" /> : <ChevronDown className="h-4 w-4 text-text-tertiary" />}
        </button>
        {activeSection === 'list' && (
          <div className="mt-4 border-t border-border pt-4">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {[null, 5, 4, 3, 2, 1].map((r) => (
                <button key={r ?? 'all'} type="button" onClick={() => setFilterRating(r)}
                  className={`rounded-full px-2.5 py-1 text-[10px] transition-all ${filterRating === r ? 'bg-accent text-bg-base' : 'bg-surface-secondary text-text-tertiary hover:bg-surface'}`}>
                  {r ? `${r} Star` : 'All Ratings'}
                </button>
              ))}
              <div className="ml-2 h-4 w-px bg-bg-elevated" />
              {(['all', 'published', 'pending', 'archived'] as const).map((s) => (
                <button key={s} type="button" onClick={() => setFilterStatus(s)}
                  className={`rounded-full px-2.5 py-1 text-[10px] capitalize transition-all ${filterStatus === s ? 'bg-accent text-bg-base' : 'bg-surface-secondary text-text-tertiary hover:bg-surface'}`}>
                  {s}
                </button>
              ))}
            </div>

            {isLoading && !initialized ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-surface-secondary" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((review) => (
                  <ReviewCard key={review.id} review={review}
                    onToggleFeatured={toggleFeatured} onToggleArchive={toggleArchive}
                    onRespond={respondToReview} onRemoveFeatured={removeFeatured} />
                ))}
                {filtered.length === 0 && (
                  <p className="py-6 text-center text-xs text-text-tertiary">No reviews match your filters</p>
                )}
              </div>
            )}
          </div>
        )}
      </GlassCard>

      <GlassCard>
        <button type="button" onClick={() => toggleSection('testimonials')} className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <Quote className="h-5 w-5 text-[#f59e0b]" />
            <h3 className="text-sm font-semibold text-text-primary">Testimonials ({featuredCount})</h3>
          </div>
          {activeSection === 'testimonials' ? <ChevronUp className="h-4 w-4 text-text-tertiary" /> : <ChevronDown className="h-4 w-4 text-text-tertiary" />}
        </button>
        {activeSection === 'testimonials' && (
          <div className="mt-4 border-t border-border pt-4">
            {featuredCount === 0 ? (
              <div className="rounded-xl bg-surface p-6 text-center">
                <Quote className="mx-auto h-8 w-8 text-text-tertiary" />
                <p className="mt-2 text-sm text-text-tertiary">No testimonials selected</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {reviews.filter((r) => r.featured).map((r) => (
                  <div key={r.id} className="relative rounded-xl border border-amber-500/20 bg-amber-500/[0.03] p-4">
                    <button type="button" onClick={() => removeFeatured(r.id)}
                      className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-surface text-text-tertiary hover:bg-red-500/10 hover:text-red-400 transition-all">
                      <X className="h-3 w-3" />
                    </button>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 text-xs font-bold text-amber-400">{r.clientInitial}</div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">{r.clientName}</p>
                        <StarRating rating={r.rating} />
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-text-tertiary leading-relaxed">&ldquo;{r.comment}&rdquo;</p>
                    <p className="mt-1.5 text-[10px] text-text-tertiary">{r.serviceName} &middot; {r.date}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </GlassCard>

      <GlassCard>
        <button type="button" onClick={() => toggleSection('responses')} className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <Reply className="h-5 w-5 text-[#f59e0b]" />
            <h3 className="text-sm font-semibold text-text-primary">Response Overview</h3>
          </div>
          {activeSection === 'responses' ? <ChevronUp className="h-4 w-4 text-text-tertiary" /> : <ChevronDown className="h-4 w-4 text-text-tertiary" />}
        </button>
        {activeSection === 'responses' && (
          <div className="mt-4 border-t border-border pt-4">
            <div className="grid gap-3 sm:grid-cols-3 mb-4">
              <div className="rounded-xl bg-surface p-4 text-center">
                <p className="text-xs text-text-tertiary">Published Reviews</p>
                <p className="mt-1 text-lg font-bold text-text-primary">{published}</p>
              </div>
              <div className="rounded-xl bg-surface p-4 text-center">
                <p className="text-xs text-text-tertiary">Responded</p>
                <p className="mt-1 text-lg font-bold text-emerald-400">{responded}</p>
              </div>
              <div className="rounded-xl bg-surface p-4 text-center">
                <p className="text-xs text-text-tertiary">Response Rate</p>
                <p className="mt-1 text-lg font-bold text-[#f59e0b]">{responseRate}%</p>
              </div>
            </div>
          </div>
        )}
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5 text-[#f59e0b]" />
            <h3 className="text-sm font-semibold text-text-primary">Public Preview</h3>
          </div>
        </div>
        <div className="mt-4 overflow-hidden surface-card-lg">
          <div className="border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <StarRating rating={Math.round(avgRating)} size="md" />
              <span className="text-lg font-bold text-text-primary">{total > 0 ? avgRating.toFixed(1) : '--'}</span>
              <span className="text-xs text-text-tertiary">({total} reviews)</span>
            </div>
          </div>
          <div className="space-y-3 p-4">
            {reviews.filter((r) => r.featured).slice(0, 2).map((r) => (
              <div key={r.id} className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-[#f59e0b]">{r.clientInitial}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium text-text-primary">{r.clientName}</p>
                    <StarRating rating={r.rating} />
                  </div>
                  <p className="mt-0.5 text-[11px] text-text-tertiary">&ldquo;{r.comment.length > 100 ? `${r.comment.slice(0, 100)}...` : r.comment}&rdquo;</p>
                </div>
              </div>
            ))}
            {featuredCount === 0 && (
              <p className="text-xs text-text-tertiary italic py-2">No testimonials selected yet.</p>
            )}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2 text-xs text-text-tertiary transition-all hover:bg-surface">
            <Save className="h-3.5 w-3.5" /> Save Changes
          </button>
        </div>
      </GlassCard>

      <SaveToast show={saved} message="Reviews updated successfully" />
    </div>
  );
}

function ReviewCard({ review, onToggleFeatured, onToggleArchive, onRespond, onRemoveFeatured }: {
  review: ReviewDisplay;
  onToggleFeatured: (id: string) => void;
  onToggleArchive: (id: string) => void;
  onRespond: (id: string, response: string) => void;
  onRemoveFeatured: (id: string) => void;
}) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');

  return (
    <div className={`rounded-xl bg-surface p-3.5 ${review.featured ? 'border border-amber-500/20' : ''} ${review.status === 'archived' ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-[#f59e0b]">
            {review.clientInitial}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-text-primary">{review.clientName}</p>
              <StarRating rating={review.rating} />
              <StatusBadge status={review.status === 'published' ? 'active' : review.status === 'pending' ? 'pending' : 'draft'} />
              {review.featured && (
                <span className="flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] text-amber-400">
                  <Star className="h-2.5 w-2.5 fill-amber-400" /> Testimonial
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[11px] text-text-tertiary">{review.serviceName} &middot; {review.date}</p>
            <p className="mt-1.5 text-xs text-text-tertiary leading-relaxed">&ldquo;{review.comment}&rdquo;</p>
            {review.response && (
              <div className="mt-2 rounded-lg bg-surface px-3 py-2 border-l-2 border-[#f59e0b]/30">
                <p className="flex items-center gap-1 text-[10px] text-text-tertiary"><Reply className="h-3 w-3" /> Your response</p>
                <p className="mt-0.5 text-xs text-text-tertiary">{review.response}</p>
                <p className="mt-0.5 text-[9px] text-text-tertiary">{review.responseDate}</p>
              </div>
            )}
            <div className="mt-1.5 flex items-center gap-3 text-[10px] text-text-tertiary">
              <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> {review.likes}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button type="button" onClick={() => review.featured ? onRemoveFeatured(review.id) : onToggleFeatured(review.id)}
            className={`flex h-7 w-7 items-center justify-center rounded-full transition-all ${review.featured ? 'bg-amber-500/10 text-amber-400' : 'bg-surface text-text-tertiary hover:text-amber-400'}`}
            title="Toggle testimonial">
            <Quote className="h-3.5 w-3.5" />
          </button>
          {review.status !== 'archived' && (
            <button type="button" onClick={() => onToggleArchive(review.id)}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-surface text-text-tertiary transition-all hover:bg-surface hover:text-text-secondary"
              title="Archive">
              <Clock className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      {!review.response && review.status === 'published' && (
        <div className="mt-2 pl-12">
          {showReply ? (
            <div className="space-y-2">
              <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Write your response..."
                rows={2} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-primary placeholder-text-tertiary outline-none transition-all focus:border-[#f59e0b]/40 resize-none" />
              <div className="flex gap-2">
                <button type="button" onClick={() => { onRespond(review.id, replyText); setReplyText(''); setShowReply(false); }}
                  className="rounded-full bg-accent px-3 py-1 text-[10px] font-semibold text-bg-base">Send Reply</button>
                <button type="button" onClick={() => setShowReply(false)} className="rounded-full border border-border px-3 py-1 text-[10px] text-text-tertiary">Cancel</button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setShowReply(true)}
              className="flex items-center gap-1.5 text-[10px] text-text-tertiary hover:text-text-secondary transition-colors">
              <Reply className="h-3 w-3" /> Reply
            </button>
          )}
        </div>
      )}
    </div>
  );
}
