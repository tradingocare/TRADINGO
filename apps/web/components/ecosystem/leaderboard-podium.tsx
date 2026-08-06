'use client';

import { cn } from '@/lib/utils';
import { Trophy, Medal, Award } from 'lucide-react';

interface LeaderboardEntry {
  entityId?: string;
  entityName?: string;
  score: number;
  rank: number;
}

interface LeaderboardPodiumProps {
  entries: LeaderboardEntry[];
}

const rankConfig = [
  { icon: Trophy, color: 'text-status-warning', bg: 'bg-status-warning/10', label: '1st', height: 'h-24' },
  { icon: Medal, color: 'text-text-tertiary', bg: 'bg-surface-tertiary', label: '2nd', height: 'h-20' },
  { icon: Award, color: 'text-accent', bg: 'bg-accent/10', label: '3rd', height: 'h-16' },
];

export function LeaderboardPodium({ entries }: LeaderboardPodiumProps) {
  const top3 = entries.filter((e) => e.rank >= 1 && e.rank <= 3).sort((a, b) => a.rank - b.rank);
  if (!top3.length) return null;

  return (
    <div className="flex items-end justify-center gap-3 pt-4">
      {top3.map((entry, i) => {
        const config = rankConfig[entry.rank - 1] || rankConfig[0];
        const Icon = config.icon;
        return (
          <div key={entry.rank} className="flex flex-col items-center gap-2">
            <div className={cn('flex h-8 w-8 items-center justify-center rounded-full', config.bg)}>
              <Icon className={cn('h-4 w-4', config.color)} />
            </div>
            <div className="text-center">
              <p className="text-xs font-medium text-text-primary truncate max-w-[80px]">{entry.entityName || 'Unknown'}</p>
              <p className={cn('text-xs font-bold', config.color)}>{entry.score.toLocaleString()} XP</p>
            </div>
            <div className={cn(
              'w-16 rounded-t-lg bg-gradient-to-t',
              entry.rank === 1 ? 'from-status-warning/20 to-transparent h-24' : entry.rank === 2 ? 'from-text-tertiary/20 to-transparent h-20' : 'from-accent/20 to-transparent h-16',
            )}>
              <div className="flex h-full items-center justify-center">
                <span className={cn('text-xs font-bold', config.color)}>{config.label}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
