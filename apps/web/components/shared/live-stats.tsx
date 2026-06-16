'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Users, ShoppingBag, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LiveStat {
  icon: React.ReactNode;
  value: string;
  label: string;
  change: string;
  positive: boolean;
}

const defaultStats: LiveStat[] = [
  { icon: <ShoppingBag className="h-5 w-5" />, value: '12,847', label: 'Products Listed', change: '+12%', positive: true },
  { icon: <Users className="h-5 w-5" />, value: '8,432', label: 'Active Traders', change: '+8%', positive: true },
  { icon: <DollarSign className="h-5 w-5" />, value: '₹2.4Cr', label: 'Trading Volume (24h)', change: '+15%', positive: true },
  { icon: <TrendingUp className="h-5 w-5" />, value: '156', label: 'Live RFQs', change: '+23%', positive: true },
];

export function LiveStats({ className }: { className?: string }) {
  const [stats] = useState(defaultStats);

  useEffect(() => {
    const interval = setInterval(() => {
      // In production, this would poll the API
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-4', className)}>
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm dark:bg-dark-surface dark:border-dark-border"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
            {stat.icon}
          </div>
          <div className="flex-1">
            <p className="text-lg font-bold text-text-primary dark:text-dark-text-primary">{stat.value}</p>
            <p className="text-xs text-text-secondary dark:text-dark-text-secondary">{stat.label}</p>
          </div>
          <span
            className={cn(
              'text-xs font-medium',
              stat.positive ? 'text-accent-600' : 'text-red-600',
            )}
          >
            {stat.change}
          </span>
        </div>
      ))}
    </div>
  );
}
