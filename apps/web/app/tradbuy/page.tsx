import type { Metadata } from 'next';
import { ShoppingCart, ArrowRight, CheckCircle } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { SectionHeader } from '@/components/shared/section-header';
import { AnimatedSection } from '@/components/shared/animated-section';
import { FeatureCards } from '@/components/shared/feature-cards';
import { CTABlock } from '@/components/shared/cta-block';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TRADING_FEATURES, TRADING_RFQ_STEPS, FEATURES_BUYER } from '@/data/master-data';

export const metadata: Metadata = {
  title: 'TRADBUY — Instant Purchase | TRADINGO',
  description:
    'Buy products instantly at listed prices with secure payment processing and automated order matching on TRADINGO.',
};

const features = TRADING_FEATURES;

const steps = TRADING_RFQ_STEPS;

const benefits = FEATURES_BUYER;

export default function TradbuyPage() {
  return (
    <>
      <PageHeader
        title="TRADBUY"
        description="Buy products instantly at listed prices with secure payment processing and automated order matching."
      />

      {/* About TRADBUY */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10">
        <div className="container-main">
          <AnimatedSection>
            <div className="mx-auto max-w-4xl text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-xl">
                <ShoppingCart className="h-10 w-10" />
              </div>
              <h2 className="mt-8 text-3xl font-bold sm:text-4xl dark:text-dark-text-primary">
                Buy Instantly, Trade Confidently
              </h2>
              <p className="mt-4 text-lg text-text-secondary dark:text-dark-text-secondary">
                TRADBUY is TRADINGO&apos;s instant purchase engine — the fastest way to buy products on the
                TEM marketplace. Skip the negotiation, avoid the delays, and purchase directly at listed
                prices. Every transaction is processed through our secure escrow system, so your funds are
                always protected until you confirm satisfaction. Whether you need industrial machinery,
                electronics, textiles, or raw materials, TRADBUY makes purchasing as simple as a click.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <Separator />

      {/* Features */}
      <section className="py-20">
        <div className="container-main">
          <SectionHeader
            title="Why Use TRADBUY?"
            subtitle="Six powerful features that make instant purchasing the smart choice."
          />
          <FeatureCards features={features} columns={3} />
        </div>
      </section>

      <Separator />

      {/* How It Works */}
      <section className="py-20 bg-surface-secondary/50 dark:bg-dark-surface-secondary/50">
        <div className="container-main">
          <SectionHeader
            title="How TRADBUY Works"
            subtitle="Five simple steps from browsing to delivery."
          />
          <div className="mx-auto max-w-3xl space-y-8">
            {steps.map((step, index) => (
              <AnimatedSection key={step.step} delay={index * 100}>
                <div className="flex gap-6">
                  <div className="flex flex-shrink-0 flex-col items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-lg font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                      {step.step}
                    </div>
                    {index < steps.length - 1 && (
                      <div className="mt-2 h-full w-0.5 bg-border dark:bg-dark-border" />
                    )}
                  </div>
                  <div className="pb-8">
                    <h3 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary">{step.title}</h3>
                    <p className="mt-2 text-text-secondary dark:text-dark-text-secondary">{step.description}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* Benefits */}
      <section className="py-20">
        <div className="container-main">
          <SectionHeader
            title="Why Buyers Love TRADBUY"
            subtitle="Instant purchasing with zero risk and full transparency."
          />
          <div className="mx-auto max-w-5xl">
            <FeatureCards features={benefits} columns={4} />
          </div>
        </div>
      </section>

      <Separator />

      {/* Comparison Section */}
      <section className="py-20 bg-surface-secondary/50 dark:bg-dark-surface-secondary/50">
        <div className="container-main">
          <AnimatedSection>
            <div className="mx-auto max-w-4xl">
              <SectionHeader
                title="TRADBUY vs Traditional Buying"
                subtitle="See how TRADBUY compares to traditional procurement methods."
              />
              <div className="grid gap-6 sm:grid-cols-2">
                <Card className="border-accent-200 bg-accent-50/50 dark:border-accent-800 dark:bg-accent-900/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-accent-700 dark:text-accent-400">
                      <CheckCircle className="h-5 w-5" />
                      TRADBUY
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {['Instant purchase at fixed prices', 'Escrow-protected payments', 'Auto-matching with sellers', 'Real-time order tracking', 'GOCASH rewards on every purchase', 'Complete in under 2 minutes'].map(
                        (item) => (
                          <li key={item} className="flex items-start gap-2 text-sm text-text-secondary dark:text-dark-text-secondary">
                            <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent-500" />
                            {item}
                          </li>
                        ),
                      )}
                    </ul>
                  </CardContent>
                </Card>
                <Card className="border-border dark:border-dark-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-text-tertiary dark:text-dark-text-tertiary">
                      <ArrowRight className="h-5 w-5" />
                      Traditional Buying
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {['Lengthy negotiation process', 'Payment security concerns', 'Manual seller matching', 'Limited order visibility', 'No rewards or incentives', 'Takes days or weeks'].map(
                        (item) => (
                          <li key={item} className="flex items-start gap-2 text-sm text-text-secondary dark:text-dark-text-secondary">
                            <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-text-tertiary" />
                            {item}
                          </li>
                        ),
                      )}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <CTABlock
        title="Start Shopping"
        subtitle="Browse thousands of products and buy instantly with TRADBUY. Your first purchase is protected by our escrow guarantee."
        primaryLabel="Browse Products"
        primaryHref="/products"
        secondaryLabel="Learn About RFQ"
        secondaryHref="/rfq"
        variant="accent"
      />
    </>
  );
}
