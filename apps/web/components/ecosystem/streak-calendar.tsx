'use client';

import { cn } from '@/lib/utils';

interface StreakCalendarProps {
  checkins: { checkinDate: string; streakCount: number; bonusEarned: boolean }[];
  year: number;
  month: number;
  loading?: boolean;
}

export function StreakCalendar({ checkins, year, month, loading }: StreakCalendarProps) {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const daysInMonth = lastDay.getDate();
  const startOffset = firstDay.getDay();
  const checkinDates = new Set(checkins.map((c) => new Date(c.checkinDate).getDate()));

  if (loading) {
    return (
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="h-8 animate-pulse rounded bg-surface-secondary" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-text-tertiary">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startOffset }).map((_, i) => <div key={`empty-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, day) => {
          const date = day + 1;
          const checkedIn = checkinDates.has(date);
          const checkin = checkins.find((c) => new Date(c.checkinDate).getDate() === date);
          return (
            <div
              key={date}
              className={cn(
                'flex h-8 items-center justify-center rounded text-xs transition-all',
                checkedIn ? 'bg-accent-500/20 font-medium text-accent-500' : 'text-text-tertiary',
                checkin?.bonusEarned && 'ring-1 ring-accent',
              )}
              title={checkin ? `Streak: ${checkin.streakCount}${checkin.bonusEarned ? ' (Bonus!)' : ''}` : undefined}
            >
              {date}
            </div>
          );
        })}
      </div>
    </div>
  );
}
