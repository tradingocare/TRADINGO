'use client';

import { useState, memo } from 'react';
import { MessageCircle, Bookmark, Share2, Trash2, Clock } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LikeButton } from '@/components/social/like-button';
import { CommentThread } from '@/components/social/comment-thread';
import { FollowButton } from '@/components/social/follow-button';
import type { SocialPost } from '@/lib/api/tradetalk';

interface PostCardProps {
  post: SocialPost;
  isLiked: boolean;
  isBookmarked: boolean;
  onLike: () => void;
  onBookmark: () => void;
  onDelete?: () => void;
  isLikeLoading?: boolean;
  isBookmarkLoading?: boolean;
  isOwner?: boolean;
}

const PostCard = memo(function PostCard({ post, isLiked, isBookmarked, onLike, onBookmark, onDelete, isLikeLoading, isBookmarkLoading, isOwner }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const timeAgo = getTimeAgo(post.publishedAt);
  const postTypeLabel = post.type === 'TEXT' ? null : post.type;

  return (
    <Card className="overflow-hidden border-border bg-surface transition-colors hover:border-accent/20">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
              {post.author?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text-primary">{post.author?.name || 'Unknown'}</span>
                {!isOwner && post.author && (
                  <FollowButton followingId={post.author.id} followingType="USER" />
                )}
                {postTypeLabel && (
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wider">{postTypeLabel}</Badge>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
                <Clock className="h-3 w-3" />
                <span>{timeAgo}</span>
              </div>
            </div>
          </div>
          {isOwner && onDelete && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-text-tertiary hover:text-status-error" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-2">
        {post.title && (
          <h3 className="mb-1.5 text-base font-semibold text-text-primary">{post.title}</h3>
        )}
        <p className="whitespace-pre-wrap text-sm text-text-secondary leading-relaxed">{post.content}</p>

        {post.mediaUrls && post.mediaUrls.length > 0 && (
          <div className={`mt-3 grid gap-2 ${post.mediaUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {post.mediaUrls.slice(0, 4).map((url, i) => (
              <div key={i} className="relative aspect-video overflow-hidden rounded-lg border border-border bg-bg-elevated">
                <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        )}

        {post.linkUrl && (
          <a
            href={post.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-start gap-3 rounded-lg border border-border bg-bg-elevated p-3 transition-colors hover:border-accent/50"
          >
            {post.linkImage && (
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md">
                <img src={post.linkImage} alt="" className="h-full w-full object-cover" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{post.linkTitle || post.linkUrl}</p>
              {post.linkDescription && <p className="text-xs text-text-tertiary line-clamp-2">{post.linkDescription}</p>}
              <p className="mt-0.5 text-[10px] text-text-tertiary">{new URL(post.linkUrl).hostname}</p>
            </div>
          </a>
        )}
      </CardContent>

      <CardFooter className="flex items-center gap-1 border-t border-border pt-2">
        <LikeButton isLiked={isLiked} likeCount={post.likeCount} isLoading={isLikeLoading || false} onToggle={onLike} />
        <Button variant="ghost" size="sm" className={`gap-1.5 px-2 text-xs ${showComments ? 'text-accent' : 'text-text-tertiary'}`} onClick={() => setShowComments(!showComments)}>
          <MessageCircle className="h-3.5 w-3.5" />
          {post.commentCount > 0 && <span>{post.commentCount}</span>}
        </Button>
        <Button variant="ghost" size="sm" className="gap-1.5 px-2 text-xs text-text-tertiary">
          <Share2 className="h-3.5 w-3.5" />
          {post.shareCount > 0 && <span>{post.shareCount}</span>}
        </Button>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="sm"
          className={`px-2 text-xs ${isBookmarked ? 'text-accent' : 'text-text-tertiary'}`}
          onClick={onBookmark}
          disabled={isBookmarkLoading}
        >
          <Bookmark className={`h-3.5 w-3.5 ${isBookmarked ? 'fill-accent' : ''}`} />
        </Button>
      </CardFooter>
      {showComments && (
        <div className="px-4 pb-3">
          <CommentThread postId={post.id} postOwnerId={post.author?.id ?? ''} />
        </div>
      )}
    </Card>
  );
})

function getTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}h ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export { PostCard }
