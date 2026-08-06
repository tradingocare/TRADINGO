'use client';

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { EcosystemBadge } from '@/lib/api/ecosystem';

interface BadgeCardProps {
  badge: EcosystemBadge;
  earned?: boolean;
  earnedAt?: string;
  size?: 'sm' | 'md' | 'lg';
}

const BadgeCard = memo(function BadgeCard({ badge, earned = false, earnedAt, size = 'md' }: BadgeCardProps) {
  const isSm = size === 'sm';
  const isLg = size === 'lg';
  return (
    <Card className={cn(
      'transition-all duration-200',
      earned ? 'border-accent-500/20' : 'opacity-50 grayscale',
    )}>
      <CardContent className={cn('flex items-center gap-3', isSm ? 'p-3' : 'p-4')}>
        <div className={cn(
          'flex items-center justify-center rounded-xl',
          earned ? 'bg-accent-500/10' : 'bg-surface-secondary',
          isSm ? 'h-8 w-8 text-sm' : isLg ? 'h-14 w-14 text-2xl' : 'h-10 w-10 text-lg',
        )}>
          {badge.icon || '🏅'}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('font-medium text-text-primary truncate', isSm ? 'text-xs' : 'text-sm')}>{badge.name}</p>
          {badge.description && (
            <p className={cn('text-text-secondary truncate', isSm ? 'text-[10px]' : 'text-xs')}>{badge.description}</p>
          )}
          {earned && earnedAt && (
            <p className="text-[10px] text-accent-500/60">Earned {new Date(earnedAt).toLocaleDateString()}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
})

export { BadgeCard }
