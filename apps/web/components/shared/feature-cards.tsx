import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Feature {
  icon: string;
  title: string;
  description: string;
  href?: string;
  badge?: string;
}

interface FeatureCardsProps {
  features: Feature[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export function FeatureCards({ features, columns = 3, className }: FeatureCardsProps) {
  return (
    <div
      className={cn(
        'grid gap-5',
        columns === 2 && 'sm:grid-cols-2',
        columns === 3 && 'sm:grid-cols-2 lg:grid-cols-3',
        columns === 4 && 'sm:grid-cols-2 lg:grid-cols-4',
        className,
      )}
    >
      {features.map((feature) => (
        <div
          key={feature.title}
          className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6 transition-all duration-500 hover:border-[rgba(212,175,55,0.2)]"
          style={{
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{
              background: 'radial-gradient(600px circle at 50% 50%, rgba(212,175,55,0.06), transparent 40%)',
            }}
          />

          <div className="relative z-10 flex flex-1 flex-col">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[rgba(212,175,55,0.15)] to-[rgba(212,175,55,0.05)] text-xl"
              style={{ border: '1px solid rgba(212,175,55,0.1)' }}>
              {feature.icon}
            </span>

            <div className="mt-4 flex items-center gap-2">
              <h3 className="text-base font-black text-white">{feature.title}</h3>
              {feature.badge && (
                <span className="rounded-full bg-[rgba(212,175,55,0.1)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#D4AF37]">
                  {feature.badge}
                </span>
              )}
            </div>

            <p className="mt-2 flex-1 text-sm leading-relaxed text-white/45">
              {feature.description}
            </p>

            {feature.href && (
              <div className="mt-5 flex items-center justify-center gap-1.5 rounded-xl border border-[rgba(212,175,55,0.12)] bg-gradient-to-r from-[rgba(212,175,55,0.06)] to-[rgba(212,175,55,0.02)] px-4 py-2 text-[11px] font-semibold text-[#D4AF37]/70 transition-all group-hover:from-[rgba(212,175,55,0.1)] group-hover:to-[rgba(212,175,55,0.04)] group-hover:text-[#D4AF37]">
                <Link href={feature.href} className="flex items-center gap-1.5">
                  View More <ExternalLink size={11} />
                </Link>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
