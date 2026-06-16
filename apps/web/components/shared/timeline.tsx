import { cn } from '@/lib/utils';

interface TimelineStep {
  title: string;
  description: string;
  number: number;
}

interface TimelineProps {
  steps: TimelineStep[];
  className?: string;
}

export function Timeline({ steps, className }: TimelineProps) {
  return (
    <div className={cn('relative', className)}>
      <div className="absolute left-6 top-0 h-full w-0.5 bg-border dark:bg-dark-border" />
      <div className="space-y-12">
        {steps.map((step) => (
          <div key={step.number} className="relative pl-16">
            <div className="absolute left-3 flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white shadow-sm">
              {step.number}
            </div>
            <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">
              {step.title}
            </h3>
            <p className="mt-1 text-text-secondary dark:text-dark-text-secondary">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
