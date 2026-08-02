'use client';

import { ThumbsUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LikeButtonProps {
  isLiked: boolean;
  likeCount: number;
  isLoading: boolean;
  onToggle: () => void;
}

export function LikeButton({ isLiked, likeCount, isLoading, onToggle }: LikeButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      disabled={isLoading}
      className={`gap-1.5 px-2 text-xs ${isLiked ? 'text-accent' : 'text-text-tertiary hover:text-text-secondary'}`}
    >
      {isLoading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <ThumbsUp className={`h-3.5 w-3.5 ${isLiked ? 'fill-accent' : ''}`} />
      )}
      {likeCount > 0 && <span>{likeCount}</span>}
    </Button>
  );
}
