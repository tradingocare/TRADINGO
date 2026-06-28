import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  className?: string;
}

export function StatCard({ icon: Icon, label, value, change, changeType = 'neutral', className }: StatCardProps) {
  return (
    <div
      className={cn(
        'group rounded-2xl border border-white/[0.06] bg-white/[0.04] p-5 backdrop-blur-xl transition-all duration-300 hover:border-orange-500/20 hover:shadow-[0_0_30px_-5px_rgba(255,77,0,0.15)]',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-[#FF4D00]">
          <Icon className="h-5 w-5" />
        </div>
        {change && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-full border border-white/[0.06] bg-white/[0.04] px-2.5 py-0.5 text-xs font-medium text-white/60 backdrop-blur-md',
            )}
          >
            {changeType === 'positive' && <TrendingUp className="h-3 w-3" />}
            {changeType === 'negative' && <TrendingDown className="h-3 w-3" />}
            {change}
          </span>
        )}
      </div>
      <p className="mt-4 text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-sm text-white/60">{label}</p>
    </div>
  );
}
