import type { Metadata } from 'next';
import { Globe, Zap, Shield } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { SectionHeader } from '@/components/shared/section-header';
import { AnimatedSection } from '@/components/shared/animated-section';
import { FeatureCards } from '@/components/shared/feature-cards';
import { PricingCards } from '@/components/shared/pricing-cards';
import { CTABlock } from '@/components/shared/cta-block';
import { Timeline } from '@/components/shared/timeline';
import { Separator } from '@/components/ui/separator';
import { FEATURES_SELLER, SELLER_PRICING_PLANS, SELLER_ONBOARDING_STEPS } from '@/data/master-data';

export const metadata: Metadata = {
  title: 'For Sellers | TRADINGO',
  description:
    'Reach millions of buyers across India. List your products, get AI-matched leads, and grow your business.',
};

const sellerFeatures = FEATURES_SELLER;

const sellerPlans = SELLER_PRICING_PLANS.map(p => ({
  name: p.name,
  price: p.price === '₹0' ? 'Free' : p.price,
  period: p.period === 'forever' ? 'month' : p.period.replace('/', ''),
  description: p.description,
  features: p.features,
  popular: p.popular,
  href: '/register',
  ...(p.name === 'Enterprise' ? { highlight: 'Best Value' } : {}),
}));

const onboardingSteps = SELLER_ONBOARDING_STEPS.map(s => ({ number: s.step, title: s.title, description: s.description }));

export default function ForSellersPage() {
  return (
    <>
      <PageHeader
        title="Sell on TRADINGO"
        description="Reach millions of buyers across India. List your products, get AI-matched leads, and grow your business."
      />

      <section className="py-20">
        <div className="container-main">
          <AnimatedSection>
            <div className="mx-auto max-w-5xl text-center">
              <SectionHeader
                title="Why Sell on TRADINGO?"
                subtitle="India's fastest-growing B2B marketplace with tools designed to help sellers succeed."
              />
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { value: '50,000+', label: 'Products Listed' },
                  { value: '15,000+', label: 'Active Sellers' },
                  { value: '500+', label: 'Cities Covered' },
                  { value: '₹500Cr+', label: 'Trading Volume' },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-border bg-surface p-6 shadow-sm dark:bg-dark-surface dark:border-dark-border">
                    <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">{item.value}</p>
                    <p className="mt-2 text-sm text-text-secondary dark:text-dark-text-secondary">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <Separator />

      <section className="py-20 bg-surface-secondary/50 dark:bg-dark-surface-secondary/50">
        <div className="container-main">
          <SectionHeader
            title="Seller Features"
            subtitle="Everything you need to grow your B2B sales in one platform."
          />
          <FeatureCards features={sellerFeatures} columns={4} />
        </div>
      </section>

      <Separator />

      <section className="py-20">
        <div className="container-main">
          <SectionHeader
            title="Seller Onboarding"
            subtitle="Get started in four simple steps."
          />
          <div className="mx-auto max-w-2xl">
            <Timeline steps={onboardingSteps} />
          </div>
        </div>
      </section>

      <Separator />

      <section className="py-20 bg-surface-secondary/50 dark:bg-dark-surface-secondary/50">
        <div className="container-main">
          <SectionHeader
            title="Choose Your Plan"
            subtitle="Start free and upgrade as your business grows."
            viewMoreHref="/seller-plans"
            viewMoreLabel="Compare All Plans"
          />
          <PricingCards plans={sellerPlans} />
        </div>
      </section>

      <Separator />

      <section className="py-20">
        <div className="container-main">
          <AnimatedSection>
            <div className="mx-auto max-w-4xl text-center">
              <SectionHeader
                title="Trusted by Thousands of Sellers"
                subtitle="Join India's fastest-growing B2B seller community."
              />
              <div className="mt-8 grid gap-6 sm:grid-cols-3">
                {[
                  { icon: Shield, title: 'Secure Payments', desc: 'Escrow-protected transactions with timely settlements.' },
                  { icon: Globe, title: 'Pan-India Logistics', desc: 'Integrated logistics partners for seamless delivery.' },
                  { icon: Zap, title: 'AI-Powered Growth', desc: 'Smart recommendations to optimize your listings.' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="rounded-xl border border-border bg-surface p-6 shadow-sm dark:bg-dark-surface dark:border-dark-border">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="font-semibold text-text-primary dark:text-dark-text-primary">{item.title}</h3>
                      <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <CTABlock
        title="Start Selling on TRADINGO Today"
        subtitle="Create your free seller account and reach millions of buyers across India."
        primaryLabel="Start Selling"
        primaryHref="/register"
        secondaryLabel="Learn More"
        secondaryHref="/seller-plans"
        variant="accent"
      />
    </>
  );
}
