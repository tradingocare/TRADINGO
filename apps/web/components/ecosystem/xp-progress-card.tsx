'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { XPProgressBar } from './xp-progress-bar';
import { Sparkles, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface XPProgressCardProps {
  levelName?: string;
  levelNumber?: number;
  totalXp?: number;
  nextLevelXp?: number;
  badgeIcon?: string | null | undefined;
  badgeColor?: string | null;
  loading?: boolean;
}

export function XPProgressCard({ levelName, levelNumber, totalXp = 0, nextLevelXp = 0, badgeIcon, badgeColor, loading }: XPProgressCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle><Sparkles className="mr-2 inline h-4 w-4" />Level Progress</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-6 w-20 rounded" />
          <Skeleton className="h-2.5 w-full rounded-full" />
          <Skeleton className="h-4 w-32 rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-accent-500" />
          Level Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl text-lg"
            style={{ backgroundColor: badgeColor ? `${badgeColor}20` : 'color-mix(in srgb, var(--accent) 10%, transparent)' }}
          >
            <TrendingUp className="h-6 w-6" style={{ color: badgeColor || 'var(--accent)' }} />
          </div>
          <div>
            <p className="text-lg font-bold text-text-primary">{levelName || 'BRONZE'}</p>
            <p className="text-xs text-text-secondary">Level {levelNumber || 1}</p>
          </div>
        </div>
        <XPProgressBar current={totalXp} target={nextLevelXp} label="XP to next level" size="md" />
      </CardContent>
    </Card>
  );
}
