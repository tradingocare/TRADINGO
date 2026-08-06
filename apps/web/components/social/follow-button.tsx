'use client';

import { memo } from 'react';
import { useCheckFollow, useFollow, useUnfollow } from '@/hooks/use-tradetalk';
import { useTracking } from '@/hooks/use-tracking';
import { TrackingEvent } from '@/lib/tracking/events';
import { Button } from '@/components/ui/button';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';

interface FollowButtonProps {
  followingId: string;
  followingType?: 'USER' | 'COMPANY';
  onFollowChange?: (following: boolean) => void;
}

const FollowButton = memo(function FollowButton({ followingId, followingType = 'USER', onFollowChange }: FollowButtonProps) {
  const { data: check, isLoading: checkLoading } = useCheckFollow(followingId, followingType);
  const followMutation = useFollow();
  const unfollowMutation = useUnfollow();
  const { track } = useTracking();

  const isFollowing = check?.following ?? false;
  const loading = checkLoading || followMutation.isPending || unfollowMutation.isPending;

  const followEvent = followingType === 'COMPANY' ? TrackingEvent.COMPANY_FOLLOWED : TrackingEvent.USER_FOLLOWED;
  const unfollowEvent = followingType === 'COMPANY' ? TrackingEvent.COMPANY_UNFOLLOWED : TrackingEvent.USER_UNFOLLOWED;

  const handleToggle = () => {
    if (isFollowing) {
      unfollowMutation.mutate(
        { followingId, followingType },
        {
          onSuccess: () => {
            track(unfollowEvent, { properties: { followingId, followingType } });
            onFollowChange?.(false);
          },
        },
      );
    } else {
      followMutation.mutate(
        { followingId, followingType },
        {
          onSuccess: () => {
            track(followEvent, { properties: { followingId, followingType } });
            onFollowChange?.(true);
          },
        },
      );
    }
  };

  if (checkLoading) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-1.5 text-xs px-3">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      </Button>
    );
  }

  if (isFollowing) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleToggle}
        disabled={loading}
        className="gap-1.5 text-xs px-3 border-accent/30 text-accent hover:bg-accent/10"
      >
        <UserCheck className="w-3.5 h-3.5" />
        Following
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      disabled={loading}
      className="gap-1.5 text-xs px-3"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
      Follow
    </Button>
  );
})

export { FollowButton }
