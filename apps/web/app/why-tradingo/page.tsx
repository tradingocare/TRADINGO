import type { Metadata } from 'next';
import type { ComponentType } from 'react';
import { Shield, Zap, Award, Globe, Headphones, Cpu, Brain, MapPin, CheckCircle2, XCircle, BarChart3, DollarSign, Clock } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { SectionHeader } from '@/components/shared/section-header';
import { AnimatedSection } from '@/components/shared/animated-section';
import { CTABlock } from '@/components/shared/cta-block';
import { Separator } from '@/components/ui/separator';
import { WHY_DIFFERENTIATORS, WHY_COMPARISON } from '@/data/master-data';

export const metadata: Metadata = {
  title: 'Why TRADINGO | India\'s First TEM E-Marketplace',
  description: 'Discover why thousands of Indian businesses choose TRADINGO for B2B trade — verified suppliers, escrow protection, AI-powered matching, and pan-India logistics.',
};

const ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
  Shield, Zap, Award, Globe, Headphones, Cpu, Brain, MapPin,
};

const differentiators = WHY_DIFFERENTIATORS.map(d => ({
  icon: ICON_MAP[d.icon] || Shield,
  title: d.title,
  description: d.tagline,
  details: d.details,
}));

const comparisonData = WHY_COMPARISON.map(c => ({
  aspect: c.feature,
  traditional: c.others,
  tradingo: c.tradindo,
}));

export default function WhyTradingoPage() {
  return (
    <>
      <PageHeader
        title="Why TRADINGO?"
        description="Discover what makes TRADINGO the most trusted B2B trading platform in India."
      />

      {/* Differentiators */}
      <section className="py-20">
        <div className="container-main">
          <SectionHeader
            title="What Sets Us Apart"
            subtitle="Six reasons why thousands of businesses choose TRADINGO."
          />
          <div className="mx-auto max-w-5xl space-y-16">
            {differentiators.map((item, i) => (
              <AnimatedSection key={item.title} delay={i * 100}>
                <div className="grid gap-8 lg:grid-cols-2">
                  <div className={i % 2 === 1 ? 'lg:order-2' : ''}>
                    <div className="sticky top-24">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                        <item.icon className="h-7 w-7" />
                      </div>
                      <h2 className="mt-4 text-2xl font-bold text-text-primary dark:text-dark-text-primary">{item.title}</h2>
                      <p className="mt-3 text-text-secondary dark:text-dark-text-secondary leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                  <div className={i % 2 === 1 ? 'lg:order-1' : ''}>
                    <div className="space-y-4 rounded-xl border border-border bg-surface p-6 shadow-sm dark:bg-dark-surface dark:border-dark-border">
                      {item.details.map((detail) => (
                        <div key={detail} className="flex items-start gap-3">
                          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                          <span className="text-text-secondary dark:text-dark-text-secondary">{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* Comparison Table */}
      <section className="py-20 bg-surface-secondary/50 dark:bg-dark-surface-secondary/50">
        <div className="container-main">
          <AnimatedSection>
            <SectionHeader
              title="TRADINGO vs Traditional Trading"
              subtitle="See how TRADINGO compares to traditional B2B trading methods."
            />
            <div className="overflow-x-auto rounded-xl border border-border dark:border-dark-border">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-surface-secondary dark:bg-dark-surface-secondary dark:border-dark-border">
                    <th className="px-6 py-4 text-sm font-semibold text-text-primary dark:text-dark-text-primary">Aspect</th>
                    <th className="px-6 py-4 text-sm font-semibold text-red-600 dark:text-red-400">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        Traditional Trading
                      </div>
                    </th>
                    <th className="px-6 py-4 text-sm font-semibold text-green-600 dark:text-green-400">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        TRADINGO
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((row, i) => (
                    <tr
                      key={row.aspect}
                      className={i % 2 === 0 ? 'bg-surface dark:bg-dark-surface' : 'bg-surface-secondary/50 dark:bg-dark-surface-secondary/50'}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-text-primary dark:text-dark-text-primary">{row.aspect}</td>
                      <td className="px-6 py-4 text-sm text-red-600/80 dark:text-red-400/80">{row.traditional}</td>
                      <td className="px-6 py-4 text-sm text-green-600/80 dark:text-green-400/80">{row.tradingo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <Separator />

      {/* Trust Badges */}
      <section className="py-20">
        <div className="container-main">
          <AnimatedSection>
            <div className="mx-auto max-w-4xl text-center">
              <SectionHeader
                title="Built on Trust"
                subtitle="Every aspect of TRADINGO is designed to build and maintain trust between trading partners."
              />
              <div className="mt-8 grid gap-6 sm:grid-cols-3">
                {[
                  { icon: Shield, label: 'Escrow Protection', desc: 'Your funds are safe until you confirm satisfaction' },
                  { icon: Zap, label: 'AI Verification', desc: 'Automated identity and business verification' },
                  { icon: BarChart3, label: 'Transparent Ratings', desc: 'Real seller performance data you can rely on' },
                  { icon: Globe, label: 'Regulatory Compliant', desc: 'Fully compliant with Indian trade regulations' },
                  { icon: DollarSign, label: 'No Hidden Fees', desc: '100% transparent pricing with no surprises' },
                  { icon: Clock, label: '24/7 Monitoring', desc: 'Real-time fraud detection and transaction monitoring' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="rounded-xl border border-border bg-surface p-6 shadow-sm dark:bg-dark-surface dark:border-dark-border">
                      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="font-semibold text-text-primary dark:text-dark-text-primary">{item.label}</h3>
                      <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* CTA */}
      <CTABlock
        title="Start Trading"
        subtitle="Join India's most trusted B2B marketplace. Create your free account and experience the TRADINGO difference."
        primaryLabel="Create Free Account"
        primaryHref="/register"
        secondaryLabel="Learn More"
        secondaryHref="/about-tradingo"
        variant="accent"
      />
    </>
  );
}
