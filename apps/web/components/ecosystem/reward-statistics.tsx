'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Zap, Award, Flame, Target } from 'lucide-react';

interface RewardStatisticsProps {
  totalXp?: number;
  badges?: number;
  currentStreak?: number;
  missionsCompleted?: number;
  loading?: boolean;
}

export function RewardStatistics({ totalXp = 0, badges = 0, currentStreak = 0, missionsCompleted = 0, loading }: RewardStatisticsProps) {
  const items = [
    { icon: Zap, label: 'Total XP', value: totalXp.toLocaleString(), color: 'text-accent', bg: 'bg-accent/10' },
    { icon: Award, label: 'Badges', value: String(badges), color: 'text-accent', bg: 'bg-accent/10' },
    { icon: Flame, label: 'Streak', value: `${currentStreak} days`, color: 'text-status-error', bg: 'bg-status-error/10' },
    { icon: Target, label: 'Missions Done', value: String(missionsCompleted), color: 'text-status-success', bg: 'bg-status-success/10' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="flex items-center gap-3 p-3">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${item.bg}`}>
              <item.icon className={`h-4 w-4 ${item.color}`} />
            </div>
            <div>
              <p className="text-xs text-text-secondary">{item.label}</p>
              <p className={`text-sm font-bold ${item.color}`}>
                {loading ? <span className="inline-block h-4 w-12 animate-pulse rounded bg-surface-secondary" /> : item.value}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
