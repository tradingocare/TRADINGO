import { cn } from '@/lib/utils';

interface XPProgressBarProps {
  current: number;
  target: number;
  label?: string;
  showLabel?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function XPProgressBar({ current, target, label, showLabel = true, className, size = 'md' }: XPProgressBarProps) {
  const pct = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
  return (
    <div className={cn('space-y-1', className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-secondary">{label || 'Progress'}</span>
          <span className="text-text-primary font-medium">{current.toLocaleString()} / {target.toLocaleString()} XP</span>
        </div>
      )}
      <div className={cn(
        'overflow-hidden rounded-full bg-surface-secondary',
        size === 'sm' && 'h-1.5', size === 'md' && 'h-2.5', size === 'lg' && 'h-3.5',
      )}>
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-accent-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-text-tertiary">{pct}% to next level</p>
    </div>
  );
}
