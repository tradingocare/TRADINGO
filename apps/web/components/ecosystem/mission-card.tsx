'use client';

import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Target, Zap, Gift, Clock, CheckCircle } from 'lucide-react';
import type { EcosystemMission, UserMission } from '@/lib/api/ecosystem';

interface MissionCardProps {
  mission: EcosystemMission;
  userProgress?: UserMission | null;
  compact?: boolean;
}

const periodColors: Record<string, string> = {
  DAILY: 'bg-accent/10 text-accent',
  WEEKLY: 'bg-accent/10 text-accent',
  MONTHLY: 'bg-accent-500/10 text-accent-500',
};

const MissionCard = memo(function MissionCard({ mission, userProgress, compact }: MissionCardProps) {
  const progress = userProgress?.progress ?? 0;
  const target = mission.targetCount;
  const pct = target > 0 ? Math.min(Math.round((progress / target) * 100), 100) : 0;
  const isCompleted = userProgress?.status === 'COMPLETED';

  if (compact) {
    return (
      <Card className={cn(isCompleted && 'border-green-500/20 opacity-60')}>
        <CardContent className="flex items-center gap-3 p-3">
          <div className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg',
            isCompleted ? 'bg-green-500/10' : 'bg-accent-500/10',
          )}>
            {isCompleted ? <CheckCircle className="h-4 w-4 text-green-400" /> : <Target className="h-4 w-4 text-accent-500" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-text-primary truncate">{mission.name}</p>
            <p className="text-[10px] text-text-secondary">{progress}/{target}</p>
          </div>
          <span className="rounded bg-surface-secondary px-1.5 py-0.5 text-[10px] font-medium text-text-secondary">{mission.period}</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      'transition-all duration-200 hover:border-accent-500/20',
      isCompleted && 'border-green-500/20 opacity-70',
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4 text-accent-500" />
            {mission.name}
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', periodColors[mission.period] || 'bg-surface text-text-secondary')}>
              {mission.period}
            </span>
            {isCompleted && <CheckCircle className="h-4 w-4 text-green-400" />}
          </div>
        </div>
        {mission.description && (
          <p className="text-xs text-text-secondary mt-1">{mission.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between text-xs text-text-secondary">
          <span>Progress</span>
          <span className="font-medium text-text-primary">{progress}/{target}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-secondary">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              isCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-accent-500 to-accent-500',
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center gap-3 text-[10px] text-text-tertiary">
          {mission.xpReward > 0 && (
            <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-accent-500" />{mission.xpReward} XP</span>
          )}
          {mission.gocashReward && (
            <span className="flex items-center gap-1"><Gift className="h-3 w-3 text-status-success" />{mission.gocashReward} GOCASH</span>
          )}
          {mission.badgeId && (
            <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-accent" />Badge reward</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
})

export { MissionCard }
