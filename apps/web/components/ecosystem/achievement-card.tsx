'use client';

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CheckCircle, Lock } from 'lucide-react';
import type { EcosystemAchievement } from '@/lib/api/ecosystem';

interface AchievementCardProps {
  achievement: EcosystemAchievement;
  progress?: number;
  targetCount?: number;
  status?: string | null;
  completedAt?: string | null;
}

const AchievementCard = memo(function AchievementCard({ achievement, progress = 0, targetCount = 1, status, completedAt }: AchievementCardProps) {
  const isCompleted = status === 'COMPLETED';
  const isActive = status === 'ACTIVE';
  const pct = targetCount > 0 ? Math.min(Math.round((progress / targetCount) * 100), 100) : 0;

  return (
    <Card className={cn(
      'transition-all duration-200',
      isCompleted && 'border-status-success/20',
      isActive && 'border-accent-500/20',
      !isCompleted && !isActive && 'opacity-50',
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
            isCompleted ? 'bg-status-success/10' : isActive ? 'bg-accent-500/10' : 'bg-surface-secondary',
          )}>
            {isCompleted ? <CheckCircle className="h-5 w-5 text-status-success" />
              : achievement.icon ? <span className="text-lg">{achievement.icon}</span>
              : <Lock className="h-5 w-5 text-text-tertiary" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary">{achievement.name}</p>
            {achievement.description && (
              <p className="text-xs text-text-secondary mt-0.5">{achievement.description}</p>
            )}
            {isActive && targetCount > 1 && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-[10px] text-text-tertiary mb-1">
                  <span>Progress</span>
                  <span>{progress}/{targetCount}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-secondary">
                  <div className="h-full rounded-full bg-gradient-to-r from-accent to-accent-400 transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )}
            {isCompleted && completedAt && (
              <p className="text-[10px] text-status-success/60 mt-1">Completed {new Date(completedAt).toLocaleDateString()}</p>
            )}
          </div>
          {isCompleted && <CheckCircle className="h-4 w-4 shrink-0 text-status-success" />}
        </div>
      </CardContent>
    </Card>
  );
})

export { AchievementCard }
