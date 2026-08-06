'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Users, ShoppingBag, DollarSign, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { getPlatformStats, PlatformStats } from '@/lib/api/homepage';

interface LiveStat {
  icon: React.ReactNode;
  value: string;
  label: string;
  change: string;
  positive: boolean;
}

const STAT_LABELS = ['Products Listed', 'Active Traders', 'Live RFQs', 'Orders Completed'];

function formatNum(n: number): string {
  if (n >= 10000000) return (n / 10000000).toFixed(1) + 'Cr';
  if (n >= 100000) return (n / 100000).toFixed(1) + 'L';
  if (n >= 1000) return n.toLocaleString('en-IN');
  return String(n);
}

export function LiveStats({ className }: { className?: string }) {
  const [data, setData] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPlatformStats()
      .then(setData)
      .catch(() => {/* fallback to null */})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  const values = data
    ? [
        formatNum(data.productsListed),
        formatNum(data.activeTraders),
        formatNum(data.liveRfqs),
        formatNum(data.ordersCompleted),
      ]
    : ['--', '--', '--', '--'];

  const icons = [
    <ShoppingBag className="h-5 w-5" key="0" />,
    <Users className="h-5 w-5" key="1" />,
    <DollarSign className="h-5 w-5" key="2" />,
    <TrendingUp className="h-5 w-5" key="3" />,
  ];

  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-4', className)}>
      {STAT_LABELS.map((label, i) => (
        <div
          key={label}
          className="glass-card-lg p-5 transition-all duration-300 hover:border-accent-500/20 hover:shadow-[0_0_30px_-5px_rgba(0, 255, 255, 0.15)]"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500/10 text-accent-500">
              {icons[i]}
            </div>
            <Badge variant="success" className="gap-0.5 px-2 py-0.5 text-[10px] backdrop-blur-md">
              Live
            </Badge>
          </div>
          <p className="mt-3 text-2xl font-bold text-text-primary">{values[i]}</p>
          <p className="mt-0.5 text-sm text-text-secondary">{label}</p>
        </div>
      ))}
    </div>
  );
}
