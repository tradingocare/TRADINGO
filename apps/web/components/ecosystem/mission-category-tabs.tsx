'use client';

import { cn } from '@/lib/utils';
import { Sun, CalendarDays, Calendar } from 'lucide-react';

const tabs = [
  { value: 'DAILY', label: 'Daily', icon: Sun },
  { value: 'WEEKLY', label: 'Weekly', icon: CalendarDays },
  { value: 'MONTHLY', label: 'Monthly', icon: Calendar },
];

interface MissionCategoryTabsProps {
  active: string;
  onChange: (value: string) => void;
}

export function MissionCategoryTabs({ active, onChange }: MissionCategoryTabsProps) {
  return (
    <div className="flex gap-2">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
              active === tab.value
                ? 'bg-accent-500/10 text-accent-500'
                : 'bg-surface-secondary text-text-secondary hover:bg-surface hover:text-text-primary',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
