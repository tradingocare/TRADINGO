'use client';

import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { CheckCircle, Zap, Flame } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface DailyCheckinCardProps {
  checkedIn: boolean;
  currentStreak: number;
  loading?: boolean;
  checkingIn?: boolean;
  onCheckin?: () => void;
}

const DailyCheckinCard = memo(function DailyCheckinCard({ checkedIn, currentStreak, loading, checkingIn, onCheckin }: DailyCheckinCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Flame className="h-4 w-4 text-accent-500" />Daily Check-in</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-4 w-24 rounded" />
        </CardContent>
      </Card>
    );
  }

  const streakMilestone = currentStreak > 0 && currentStreak % 7 === 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Flame className={cn('h-4 w-4', checkedIn ? 'text-accent-500' : 'text-text-tertiary')} />
          Daily Check-in
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          variant={checkedIn ? 'outline' : 'default'}
          className={cn(
            'w-full transition-all',
            checkedIn && 'border-status-success/30 text-status-success',
            !checkedIn && 'bg-gradient-to-r from-accent-500 to-accent-500 text-btn-primary-text hover:from-accent-500/80 hover:to-accent-500/80',
          )}
          disabled={checkedIn || checkingIn}
          onClick={onCheckin}
        >
          {checkingIn ? <LoadingSpinner size="sm" color="accent" className="mr-2" />
            : checkedIn ? <CheckCircle className="mr-2 h-4 w-4" />
            : <Zap className="mr-2 h-4 w-4" />}
          {checkedIn ? 'Checked In Today' : 'Check In'}
        </Button>
        <div className="flex items-center justify-center gap-2 text-xs">
          <Flame className={cn('h-3.5 w-3.5', currentStreak > 0 ? 'text-accent-500' : 'text-text-tertiary')} />
          <span className={currentStreak > 0 ? 'text-text-primary font-medium' : 'text-text-tertiary'}> 
            {currentStreak} day streak
          </span>
        </div>
        {streakMilestone && (
          <p className="text-center text-[10px] text-accent-500/60">Bonus streak reward available!</p>
        )}
      </CardContent>
    </Card>
  );
})

export { DailyCheckinCard }
