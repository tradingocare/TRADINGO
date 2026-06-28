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
      <div className="absolute left-6 top-0 h-full w-0.5 bg-white/[0.06]" />
      <div className="space-y-12">
        {steps.map((step) => (
          <div key={step.number} className="relative pl-16">
            <div className="absolute left-3 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm"
              style={{ background: 'linear-gradient(135deg, #FF4D00, #FF7A3D)' }}>
              {step.number}
            </div>
            <h3 className="text-lg font-semibold text-white">
              {step.title}
            </h3>
            <p className="mt-1 text-white/60">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
