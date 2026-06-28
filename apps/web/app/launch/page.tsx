import type { Metadata } from 'next';
import { ArrowRight } from 'lucide-react';
import { SectionHeader } from '@/components/shared/section-header';
import { AnimatedSection } from '@/components/shared/animated-section';
import { FeatureCards } from '@/components/shared/feature-cards';
import { PricingCards } from '@/components/shared/pricing-cards';
import { Testimonials } from '@/components/shared/testimonials';
import { CTABlock } from '@/components/shared/cta-block';
import { StatisticsCards } from '@/components/shared/statistics-cards';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LAUNCH_FEATURES, LAUNCH_PRICING_PLANS, LAUNCH_TESTIMONIALS, LAUNCH_STATS } from '@/data/master-data';

export const metadata: Metadata = {
  title: 'Launch Campaign | TRADINGO',
  description:
    'India\'s Premier B2B Trade Platform Has Arrived. Join the beta — limited slots available. Start your 30-day free trial today.',
};

const launchFeatures = LAUNCH_FEATURES;

const launchPlans = LAUNCH_PRICING_PLANS;

const launchTestimonials = LAUNCH_TESTIMONIALS;

const launchStats = LAUNCH_STATS;

export default function LaunchPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 pb-20 pt-32 text-white">
        <div className="absolute inset-0 bg-[url(/grid.svg)] bg-center opacity-10" />
        <div className="container-main relative">
          <AnimatedSection>
            <div className="mx-auto max-w-4xl text-center">
              <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm">
                Limited Beta — Slots Available
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                India&apos;s Premier B2B Trade Platform Has Arrived
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-primary-100">
                Join 10,000+ businesses already trading on TRADINGO. AI-powered matching, secure escrow,
                and rewards that multiply your success.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button size="xl" variant="secondary" className="w-full sm:w-auto gap-2 bg-white text-primary-700 hover:bg-primary-50">
                  Join Now <ArrowRight className="h-5 w-5" />
                </Button>
                <Button size="xl" variant="outline" className="w-full sm:w-auto gap-2 border-white/30 text-white hover:bg-white/10">
                  Explore Features
                </Button>
              </div>
              <p className="mt-6 text-sm text-primary-200">
                No credit card required. Free forever Starter plan available.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <section className="py-20 bg-surface-secondary/50 dark:bg-dark-surface-secondary/50">
        <div className="container-main">
          <AnimatedSection>
            <StatisticsCards stats={launchStats} />
          </AnimatedSection>
        </div>
      </section>

      <Separator />

      <section className="py-20">
        <div className="container-main">
          <AnimatedSection>
            <SectionHeader
              title="Platform Features"
              subtitle="Everything you need to trade smarter, faster, and more securely."
            />
            <FeatureCards features={launchFeatures} columns={3} />
          </AnimatedSection>
        </div>
      </section>

      <Separator />

      <section className="py-20 bg-surface-secondary/50 dark:bg-dark-surface-secondary/50">
        <div className="container-main">
          <AnimatedSection>
            <SectionHeader
              title="Launch Pricing"
              subtitle="Special beta pricing locked in for early adopters."
            />
            <PricingCards plans={launchPlans} />
          </AnimatedSection>
        </div>
      </section>

      <Separator />

      <section className="py-20">
        <div className="container-main">
          <AnimatedSection>
            <SectionHeader
              title="What Beta Users Say"
              subtitle="Hear from the businesses already trading on TRADINGO."
            />
            <Testimonials testimonials={launchTestimonials} />
          </AnimatedSection>
        </div>
      </section>

      <Separator />

      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-800 dark:to-primary-900">
        <div className="container-main">
          <div className="mx-auto max-w-3xl text-center text-white">
            <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-sm">
              Limited Slots Available — Join Before July
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Limited Beta Slots Available
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-100">
              We are onboarding companies in batches. Secure your spot now to get early access,
              discounted pricing, and priority support.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="xl" variant="secondary" className="w-full sm:w-auto gap-2 bg-white text-primary-700 hover:bg-primary-50">
                Reserve Your Spot <ArrowRight className="h-5 w-5" />
              </Button>
              <Button size="xl" variant="outline" className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10">
                Learn About Beta
              </Button>
            </div>
          </div>
        </div>
      </section>

      <CTABlock
        title="Start Your 30-Day Free Trial"
        subtitle="Try the full Business plan free for 30 days. No credit card required. Cancel anytime."
        primaryLabel="Start Free Trial"
        primaryHref="/register?ref=launch-trial"
        secondaryLabel="See Plans"
        secondaryHref="#plans"
        variant="simple"
      />
    </>
  );
}
