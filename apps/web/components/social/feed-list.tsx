'use client';

import { useState, useEffect } from 'react';
import { EmptyState } from '@/components/ui/empty-state';
import { ShimmerSkeleton } from '@/components/ui/skeleton';
import { PostCard } from '@/components/social/post-card';
import { Button } from '@/components/ui/button';
import { Loader2, MessageCircle } from 'lucide-react';
import { useCommunityPosts, useToggleLike, useToggleBookmark, useDeletePost } from '@/hooks/use-tradetalk';
import { useTracking } from '@/hooks/use-tracking';
import { TrackingEvent } from '@/lib/tracking/events';
import { toast } from '@/components/ui/use-toast';
import type { SocialPost } from '@/lib/api/tradetalk';

interface FeedListProps {
  communityId: string;
  params?: Record<string, unknown>;
}

export function FeedList({ communityId, params }: FeedListProps) {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useCommunityPosts(communityId, { ...params, page, limit: 20 });
  const likeMutation = useToggleLike();
  const bookmarkMutation = useToggleBookmark();
  const deleteMutation = useDeletePost();
  const { track } = useTracking();

  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (data?.data) {
      const liked = new Set(data.data.filter((p) => p.isLiked).map((p) => p.id));
      const saved = new Set(data.data.filter((p) => p.isBookmarked).map((p) => p.id));
      setLikedPosts(liked);
      setSavedPosts(saved);
    }
  }, [data]);

  useEffect(() => {
    track(TrackingEvent.POST_VIEWED, { properties: { communityId, postCount: data?.data?.length ?? 0 } });
  }, [communityId, data?.data?.length]);

  const handleLike = (postId: string, isLiked: boolean) => {
    const event = isLiked ? TrackingEvent.POST_UNLIKED : TrackingEvent.POST_LIKED;
    setLikedPosts((prev) => { const next = new Set(prev); isLiked ? next.delete(postId) : next.add(postId); return next; });
    likeMutation.mutate(postId, {
      onSuccess: () => track(event, { properties: { postId, communityId } }),
      onError: (err: Error) => {
        setLikedPosts((prev) => { const next = new Set(prev); isLiked ? next.add(postId) : next.delete(postId); return next; });
        toast({ title: 'Failed to like', description: err.message, variant: 'destructive' });
      },
    });
  };

  const handleBookmark = (postId: string, isSaved: boolean) => {
    const event = isSaved ? TrackingEvent.POST_UNSAVED : TrackingEvent.POST_SAVED;
    setSavedPosts((prev) => { const next = new Set(prev); isSaved ? next.delete(postId) : next.add(postId); return next; });
    bookmarkMutation.mutate(postId, {
      onSuccess: () => track(event, { properties: { postId, communityId } }),
      onError: (err: Error) => {
        setSavedPosts((prev) => { const next = new Set(prev); isSaved ? next.add(postId) : next.delete(postId); return next; });
        toast({ title: 'Failed to bookmark', description: err.message, variant: 'destructive' });
      },
    });
  };

  const handleDelete = (postId: string) => {
    deleteMutation.mutate(postId, {
      onSuccess: () => {
        track(TrackingEvent.POST_DELETED, { properties: { postId, communityId } });
        toast({ title: 'Post deleted' });
      },
      onError: (err: Error) => toast({ title: 'Failed to delete', description: err.message, variant: 'destructive' }),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-surface p-5">
            <ShimmerSkeleton className="mb-3 h-10 w-48" />
            <ShimmerSkeleton className="mb-2 h-20 w-full" />
            <ShimmerSkeleton className="h-8 w-32" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        variant="error"
        title="Failed to load posts"
        description="Something went wrong. Please try again."
      />
    );
  }

  const posts = data?.data || [];
  const meta = data?.meta;

  if (posts.length === 0) {
    return (
      <EmptyState
        variant="empty"
        icon={MessageCircle}
        title="No posts yet"
        description="Be the first to share something with this community."
      />
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          isLiked={likedPosts.has(post.id)}
          isBookmarked={savedPosts.has(post.id)}
          onLike={() => handleLike(post.id, likedPosts.has(post.id))}
          onBookmark={() => handleBookmark(post.id, savedPosts.has(post.id))}
          onDelete={() => handleDelete(post.id)}
          isLikeLoading={likeMutation.isPending}
          isBookmarkLoading={bookmarkMutation.isPending}
        />
      ))}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-text-tertiary">
            Page {meta.page} of {meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!meta.hasNext}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
