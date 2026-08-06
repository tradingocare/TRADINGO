'use client';

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Trophy } from 'lucide-react';

interface LevelCardProps {
  name: string;
  levelNumber: number;
  minXP: number;
  maxXP: number;
  badgeIcon?: string | null | undefined;
  badgeColor?: string | null | undefined;
  isCurrent?: boolean;
  isUnlocked?: boolean;
  onClick?: () => void;
}

const LevelCard = memo(function LevelCard({ name, levelNumber, minXP, maxXP, badgeIcon, badgeColor, isCurrent, isUnlocked = false, onClick }: LevelCardProps) {
  const color = badgeColor || 'var(--accent)';
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200 hover:border-accent-500/20',
        isCurrent && 'border-accent-500/30 ring-1 ring-accent-500/20',
        !isUnlocked && 'opacity-50',
      )}
      onClick={onClick}
    >
      <CardContent className="flex items-center gap-4 p-4">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl text-lg"
          style={{ backgroundColor: `${color}20` }}
        >
          {badgeIcon || <Trophy className="h-6 w-6" style={{ color }} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-text-primary">{name}</p>
          <p className="text-xs text-text-secondary">Level {levelNumber} &middot; {minXP.toLocaleString()} - {maxXP.toLocaleString()} XP</p>
        </div>
        {isCurrent && (
          <Badge variant="warning" className="px-2 py-0.5 text-[10px] font-medium">Current</Badge>
        )}
      </CardContent>
    </Card>
  );
})

export { LevelCard }
