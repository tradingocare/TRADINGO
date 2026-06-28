'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Users, ShoppingBag, DollarSign } from 'lucide-react';
import { MASTER_PLATFORM_STATS } from '@/data/master-data';
import { cn } from '@/lib/utils';

interface LiveStat {
  icon: React.ReactNode;
  value: string;
  label: string;
  change: string;
  positive: boolean;
}

const defaultStats: LiveStat[] = [
  { icon: <ShoppingBag className="h-5 w-5" />, ...MASTER_PLATFORM_STATS.liveStats[0] },
  { icon: <Users className="h-5 w-5" />, ...MASTER_PLATFORM_STATS.liveStats[1] },
  { icon: <DollarSign className="h-5 w-5" />, ...MASTER_PLATFORM_STATS.liveStats[2] },
  { icon: <TrendingUp className="h-5 w-5" />, ...MASTER_PLATFORM_STATS.liveStats[3] },
];

export function LiveStats({ className }: { className?: string }) {
  const [stats] = useState(defaultStats);

  useEffect(() => {
    const interval = setInterval(() => {}, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-4', className)}>
      {stats.map((stat, i) => (
        <div
          key={i}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-5 backdrop-blur-xl transition-all duration-300 hover:border-orange-500/20 hover:shadow-[0_0_30px_-5px_rgba(255,77,0,0.15)]"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10" style={{ color: '#FF4D00' }}>
              {stat.icon}
            </div>
            <span
              className={`inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-[10px] font-medium backdrop-blur-md ${
                stat.positive
                  ? 'border-green-500/30 bg-green-500/10 text-green-400'
                  : 'border-red-500/30 bg-red-500/10 text-red-400'
              }`}
            >
              {stat.change}
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold text-white">{stat.value}</p>
          <p className="mt-0.5 text-sm text-white/60">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
