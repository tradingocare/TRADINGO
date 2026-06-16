import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-surface-tertiary dark:bg-dark-surface-tertiary', className)}
      {...props}
    />
  );
}

export { Skeleton };
