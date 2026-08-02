'use client';

import Link from 'next/link';
import { ArrowRight, Shield, Zap, Sparkles } from 'lucide-react';
import { AnimatedSection } from './animated-section';

interface HeroProps {
  title: string;
  subtitle: string;
  ctaPrimary?: { label: string; href: string };
  ctaSecondary?: { label: string; href: string };
  badges?: string[];
  gradient?: boolean;
}

export function Hero({
  title,
  subtitle,
  ctaPrimary = { label: 'Get Started', href: '/register' },
  ctaSecondary = { label: 'Learn More', href: '/trading' },
  badges,
}: HeroProps) {
  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-24 sm:pb-28 sm:pt-32" style={{ background: 'var(--bg-base)' }}>
      {/* Deep space ambient glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full blur-[120px]"
          style={{ background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15), transparent 70%)' }} />
        <div className="absolute -right-40 -top-20 h-80 w-80 rounded-full blur-[100px]"
          style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12), transparent 70%)' }} />
        <div className="absolute bottom-0 left-1/2 h-60 w-full -translate-x-1/2"
          style={{ background: 'linear-gradient(to top, rgba(34, 211, 238, 0.08), transparent)' }} />
      </div>

      <AnimatedSection className="container-main relative z-10">
        <div className="mx-auto max-w-4xl text-center">
          {badges && badges.length > 0 && (
            <div className="mb-6 flex flex-wrap justify-center gap-2">
              {badges.map((badge) => (
                <span key={badge}
                  className="inline-flex items-center rounded-full border border-border bg-surface px-4 py-1.5 text-sm font-medium text-text-tertiary backdrop-blur-md">
                  {badge}
                </span>
              ))}
            </div>
          )}

          <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-5xl md:text-6xl lg:text-7xl">
            {title}
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary sm:text-xl">
            {subtitle}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href={ctaPrimary.href}>
              <div
                className="flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-text-on-accent transition-all duration-200 hover:brightness-110 hover:shadow-[0_0_32px_rgba(59,130,246,0.4)]"
                style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(99, 102, 241, 0.9))', boxShadow: '0 4px 20px rgba(59, 130, 246, 0.35)' }}
              >
                {ctaPrimary.label}
                <ArrowRight className="h-5 w-5" />
              </div>
            </Link>
            <Link href={ctaSecondary.href}>
              <div
                className="flex items-center gap-2 rounded-2xl border border-border bg-surface px-6 py-3 text-sm font-semibold text-text-primary backdrop-blur-md transition-all duration-200 hover:border-border hover:bg-surface-secondary"
              >
                {ctaSecondary.label}
              </div>
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-text-muted">
            <span className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-400" /> Secure Trading
            </span>
            <span className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-400" /> Instant Matching
            </span>
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-400" /> GOCASH Rewards
            </span>
          </div>
        </div>
      </AnimatedSection>
    </section>
  );
}
