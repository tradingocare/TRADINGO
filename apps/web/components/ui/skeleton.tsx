import { cn } from '@/lib/utils';

const shimmer = 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shimmer?: boolean;
}

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('rounded-md bg-surface-tertiary dark:bg-dark-surface-tertiary', className)}
      {...props}
    />
  );
}

export function ShimmerSkeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(`rounded-2xl bg-surface ${shimmer}`, className)}
      {...props}
    />
  );
}

export { Skeleton, shimmer };
