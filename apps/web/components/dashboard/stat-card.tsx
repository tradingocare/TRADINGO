import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  className?: string;
  variant?: 'default' | 'clean';
}

export function StatCard({ icon: Icon, label, value, change, changeType = 'neutral', className }: StatCardProps) {
  return (
    <div className="stacked-card-wrapper">
    <div
      className={cn(
        'group rounded-2xl border border-border bg-surface p-5 transition-all duration-300 hover:border-accent-500/40 hover:bg-surface-secondary hover:shadow-lg hover:shadow-black/10',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500/10 text-accent-500">
          <Icon className="h-5 w-5" />
        </div>
        {change && (
          <Badge variant="outline" className="border-border bg-surface-secondary text-text-tertiary backdrop-blur-md">
            {changeType === 'positive' && <TrendingUp className="h-3 w-3" />}
            {changeType === 'negative' && <TrendingDown className="h-3 w-3" />}
            {change}
          </Badge>
        )}
      </div>
      <p className="mt-4 text-2xl font-bold text-text-primary">{value}</p>
      <p className="mt-1 text-sm text-text-secondary">{label}</p>
    </div>
    </div>
  );
}
