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
        'grid gap-6',
        columns === 2 && 'sm:grid-cols-2',
        columns === 3 && 'sm:grid-cols-2 lg:grid-cols-3',
        columns === 4 && 'sm:grid-cols-2 lg:grid-cols-4',
        className,
      )}
    >
      {features.map((feature) => (
        <div key={feature.title} className="stack-item">
          <div
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface backdrop-blur-xl p-6 transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-xl hover:shadow-[var(--accent)]/20"
            style={{
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
              borderColor: 'color-mix(in srgb, var(--accent) 20%, transparent)',
            }}
          >
            <div
              className="absolute inset-0 opacity-0 transition-all duration-700 group-hover:opacity-100"
              style={{
                background: `linear-gradient(135deg, ${getAccentColor(feature.title)}15, transparent 50%, ${getAccentColor(feature.title)}10)`,
                borderRadius: 'inherit',
              }}
            />

            <div
              className="absolute inset-0 opacity-0 transition-all duration-500 group-hover:opacity-100"
              style={{
                background: `radial-gradient(500px circle at 50% 50%, ${getAccentColor(feature.title)}30, transparent 70%)`,
                filter: `blur(20px) drop-shadow(0 0 30px ${getAccentColor(feature.title)}60)`,
                borderRadius: 'inherit',
              }}
            />

            <div className="relative z-10 flex flex-1 flex-col">
              <span
                className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent)]/15 to-transparent text-xl font-bold shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:shadow-[var(--accent)]/30"
                style={{ border: '1px solid var(--accent)/30' }}
              >
                {feature.icon}
              </span>

              <div className="mt-4 flex items-center gap-2">
                <h3
                  className="text-base font-black transition-colors duration-300 group-hover:text-[var(--accent)]"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {feature.title}
                </h3>
                {feature.badge && (
                  <span className="rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider transition-all duration-300 group-hover:bg-[var(--accent)]/20 group-hover:text-[var(--accent)]"
                    style={{ color: '#DC2626' }}
                  >
                    {feature.badge}
                  </span>
                )}
              </div>

              <p
                className="mt-2 flex-1 text-sm leading-relaxed text-text-secondary transition-colors duration-300 group-hover:text-text-primary"
              >
                {feature.description}
              </p>

              {feature.href && (
                <div className="mt-5 flex items-center justify-center gap-1.5 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-2 text-[11px] font-semibold transition-all duration-300 group-hover:scale-105 group-hover:border-[var(--accent)]/50 group-hover:bg-[var(--accent)]/20 group-hover:text-[var(--accent)] cursor-pointer"
                  style={{
                    color: '#DC2626',
                    backgroundColor: 'rgba(248, 113, 113, 0.1)',
                  }}
                >
                  <Link
                    href={feature.href}
                    className="flex items-center gap-1.5 transition-all duration-300 group-hover:gap-2"
                    style={{ color: '#DC2626' }}
                  >
                    View More <ExternalLink size={11} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </div>
              )}
            </div>

            <div
              className="absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
              style={{
                border: `1px solid ${getAccentColor(feature.title)}60`,
                borderRadius: 'inherit',
                boxShadow: `0 0 20px ${getAccentColor(feature.title)}40`,
              }}
            />

            <div
              className="absolute -top-1 -right-1 w-8 h-8 rounded-full opacity-0 transition-opacity duration-700 group-hover:opacity-100"
              style={{
                background: `radial-gradient(circle, ${getAccentColor(feature.title)}80, transparent 70%)`,
                filter: `blur(8px) drop-shadow(0 0 15px ${getAccentColor(feature.title)}80)`,
              }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function getAccentColor(title: string): string {
  const hash = title.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
  const colors = [
    '#DC2626', // red for danger
    '#059669', // green for success
    '#2563EB', // blue for primary
    '#7C3AED', // purple for glow
    '#D97706', // amber for warning
    '#EF4444', // danger variant
    '#10B981', // success variant
    '#3B82F6', // primary variant
  ];
  return colors[hash % colors.length];
}
