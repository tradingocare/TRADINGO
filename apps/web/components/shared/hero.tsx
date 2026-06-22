'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  gradient = true,
}: HeroProps) {
  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-24 sm:pb-28 sm:pt-32">
      {gradient && (
        <div className="absolute inset-0 -z-10">
          <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-accent-500/10 blur-3xl" />
          <div className="absolute -right-40 -top-20 h-80 w-80 rounded-full bg-accent-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 h-60 w-full -translate-x-1/2 bg-gradient-to-t from-accent-50/30 to-transparent dark:from-accent-900/10" />
        </div>
      )}

      <AnimatedSection className="container-main">
        <div className="mx-auto max-w-4xl text-center">
          {badges && badges.length > 0 && (
            <div className="mb-6 flex flex-wrap justify-center gap-2">
              {badges.map((badge) => (
                <Badge key={badge} variant="default" className="px-4 py-1.5 text-sm">
                  {badge}
                </Badge>
              ))}
            </div>
          )}

          <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-5xl md:text-6xl lg:text-7xl dark:text-dark-text-primary">
            {title}
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary sm:text-xl dark:text-dark-text-secondary">
            {subtitle}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href={ctaPrimary.href}>
              <Button size="xl" className="w-full sm:w-auto">
                {ctaPrimary.label}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href={ctaSecondary.href}>
              <Button variant="outline" size="xl" className="w-full sm:w-auto">
                {ctaSecondary.label}
              </Button>
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-text-secondary dark:text-dark-text-secondary">
            <span className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-accent-500" /> Secure Trading
            </span>
            <span className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-accent-500" /> Instant Matching
            </span>
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent-500" /> GOCASH Rewards
            </span>
          </div>
        </div>
      </AnimatedSection>
    </section>
  );
}
