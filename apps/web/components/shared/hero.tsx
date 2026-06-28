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
    <section className="relative overflow-hidden px-4 pb-20 pt-24 sm:pb-28 sm:pt-32" style={{ background: '#1D0001' }}>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(255,77,0,0.15), transparent 70%)' }} />
        <div className="absolute -right-40 -top-20 h-80 w-80 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(255,77,0,0.1), transparent 70%)' }} />
        <div className="absolute bottom-0 left-1/2 h-60 w-full -translate-x-1/2"
          style={{ background: 'linear-gradient(to top, rgba(255,77,0,0.05), transparent)' }} />
      </div>

      <AnimatedSection className="container-main relative z-10">
        <div className="mx-auto max-w-4xl text-center">
          {badges && badges.length > 0 && (
            <div className="mb-6 flex flex-wrap justify-center gap-2">
              {badges.map((badge) => (
                <span key={badge}
                  className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 text-sm font-medium text-white/60 backdrop-blur-md">
                  {badge}
                </span>
              ))}
            </div>
          )}

          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            {title}
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/60 sm:text-xl">
            {subtitle}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href={ctaPrimary.href}>
              <div
                className="flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-white transition-all duration-200 hover:brightness-110"
                style={{ background: 'linear-gradient(135deg, #FF4D00, #FF7A3D)', boxShadow: '0 4px 20px rgba(255,77,0,0.3)' }}
              >
                {ctaPrimary.label}
                <ArrowRight className="h-5 w-5" />
              </div>
            </Link>
            <Link href={ctaSecondary.href}>
              <div
                className="flex items-center gap-2 rounded-2xl border border-white/[0.12] bg-white/[0.06] px-6 py-3 text-sm font-semibold text-white/80 backdrop-blur-md transition-all duration-200 hover:bg-white/[0.1]"
              >
                {ctaSecondary.label}
              </div>
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-white/50">
            <span className="flex items-center gap-2">
              <Shield className="h-4 w-4" style={{ color: '#FF4D00' }} /> Secure Trading
            </span>
            <span className="flex items-center gap-2">
              <Zap className="h-4 w-4" style={{ color: '#FF4D00' }} /> Instant Matching
            </span>
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" style={{ color: '#FF4D00' }} /> GOCASH Rewards
            </span>
          </div>
        </div>
      </AnimatedSection>
    </section>
  );
}
