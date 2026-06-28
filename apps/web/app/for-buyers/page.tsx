import type { Metadata } from 'next';
import { Shield, FileText, CheckCircle } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { SectionHeader } from '@/components/shared/section-header';
import { AnimatedSection } from '@/components/shared/animated-section';
import { FeatureCards } from '@/components/shared/feature-cards';
import { CTABlock } from '@/components/shared/cta-block';
import { Timeline } from '@/components/shared/timeline';
import { Separator } from '@/components/ui/separator';
import { FEATURES_BUYER, BUYER_ONBOARDING_STEPS } from '@/data/master-data';

export const metadata: Metadata = {
  title: 'For Buyers | TRADINGO',
  description:
    'Source verified products from trusted sellers. Get competitive quotes and trade with confidence.',
};

const buyerFeatures = FEATURES_BUYER;

const rfqSteps = BUYER_ONBOARDING_STEPS.map(s => ({ number: s.step, title: s.title, description: s.description }));

export default function ForBuyersPage() {
  return (
    <>
      <PageHeader
        title="Buy on TRADINGO"
        description="Source verified products from trusted sellers. Get competitive quotes and trade with confidence."
      />

      <section className="py-20">
        <div className="container-main">
          <AnimatedSection>
            <div className="mx-auto max-w-5xl text-center">
              <SectionHeader
                title="Why Buy on TRADINGO?"
                subtitle="India's most trusted B2B marketplace for quality sourcing."
              />
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { value: '25,000+', label: 'Registered Buyers' },
                  { value: '50,000+', label: 'Products Available' },
                  { value: '15,000+', label: 'Verified Sellers' },
                  { value: '500+', label: 'Cities Served' },
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
            title="Buyer Features"
            subtitle="Tools and features designed to make your sourcing experience seamless."
          />
          <FeatureCards features={buyerFeatures} columns={4} />
        </div>
      </section>

      <Separator />

      <section className="py-20">
        <div className="container-main">
          <SectionHeader
            title="How RFQ Works for Buyers"
            subtitle="Post requirements and let sellers compete for your business."
          />
          <div className="mx-auto max-w-2xl">
            <Timeline steps={rfqSteps} />
          </div>
        </div>
      </section>

      <Separator />

      <section className="py-20 bg-surface-secondary/50 dark:bg-dark-surface-secondary/50">
        <div className="container-main">
          <AnimatedSection>
            <div className="mx-auto max-w-4xl text-center">
              <SectionHeader
                title="Security & Trust"
                subtitle="Every transaction is protected by our multi-layer security framework."
              />
              <div className="mt-8 grid gap-6 sm:grid-cols-3">
                {[
                  { icon: Shield, title: 'Escrow Protection', description: 'Funds held securely until you confirm delivery satisfaction.' },
                  { icon: CheckCircle, title: 'Seller Verification', description: 'All sellers undergo KYC verification and background checks.' },
                  { icon: FileText, title: 'Dispute Resolution', description: 'Dedicated team ensures fair resolution for any issues.' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="rounded-xl border border-border bg-surface p-6 shadow-sm dark:bg-dark-surface dark:border-dark-border">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent-50 text-accent-600 dark:bg-accent-900/30 dark:text-accent-400">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="font-semibold text-text-primary dark:text-dark-text-primary">{item.title}</h3>
                      <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">{item.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <CTABlock
        title="Start Sourcing on TRADINGO"
        subtitle="Create your free buyer account and access India's largest B2B marketplace."
        primaryLabel="Create Free Account"
        primaryHref="/register"
        secondaryLabel="Post an RFQ"
        secondaryHref="/rfq"
        variant="accent"
      />
    </>
  );
}
