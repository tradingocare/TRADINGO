import type { Metadata } from 'next';
import {
  Zap,
  Shield,
  Award,
  Package,
  Search,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
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

export const metadata: Metadata = {
  title: 'Launch Campaign | TRADINGO',
  description:
    'India\'s Premier B2B Trade Platform Has Arrived. Join the beta — limited slots available. Start your 30-day free trial today.',
};

const launchFeatures = [
  {
    icon: Package,
    title: 'TRADBUY',
    description: 'AI-powered product listings with dynamic pricing, bulk upload, and smart categorization for maximum visibility.',
    badge: 'Live',
  },
  {
    icon: MessageSquare,
    title: 'RFQ Engine',
    description: 'Intelligent quote request system that matches buyers with the right sellers using proprietary algorithms.',
    badge: 'Live',
  },
  {
    icon: Award,
    title: 'GOCASH Rewards',
    description: 'Earn rewards on every transaction. Redeem for listing boosts, premium features, and platform discounts.',
    badge: 'Live',
  },
  {
    icon: Zap,
    title: 'TRADGO Races',
    description: 'Gamified trading competitions with leaderboards, badges, and exclusive prizes for top performers.',
    badge: 'Beta',
  },
  {
    icon: Shield,
    title: 'Escrow Protection',
    description: 'Every transaction secured by escrow. Funds released only when both parties confirm successful delivery.',
    badge: 'Live',
  },
  {
    icon: Search,
    title: 'Trade Matching',
    description: 'Proprietary matching engine connecting buyer requirements with seller catalogs in real time.',
    badge: 'AI',
  },
];

const launchPlans = [
  {
    name: 'Beta Starter',
    price: 'Free',
    period: 'month',
    description: 'For businesses exploring B2B trading on TRADINGO.',
    features: [
      'List up to 10 products',
      'Standard analytics dashboard',
      'Email support',
      'Basic RFQ access',
      '1x GOCASH earning rate',
      'Community access',
    ],
    href: '/register?ref=launch',
  },
  {
    name: 'Beta Business',
    price: '₹0',
    period: 'first 30 days',
    description: 'Free 30-day trial of Business plan. Unlimited potential.',
    features: [
      'Unlimited product listings',
      'Advanced analytics with trends',
      'Priority 24/7 chat support',
      'AI-powered RFQ matching',
      '2x GOCASH earning rate',
      'TRADGO race access',
      'Listing boost credits (monthly)',
      'Bulk product upload tools',
    ],
    href: '/register?plan=business&ref=launch',
    popular: true,
    highlight: 'Limited Beta Offer',
  },
  {
    name: 'Beta Enterprise',
    price: '₹1,999',
    period: 'month',
    description: 'For high-volume trading businesses.',
    features: [
      'Everything in Business',
      'Dedicated account manager',
      'API access for bulk operations',
      '3x GOCASH earning rate',
      'Custom integrations',
      'White-label storefront',
      'Zero platform fees during beta',
      'Exclusive TRADGO events',
      'SLA guarantee',
    ],
    href: '/register?plan=enterprise&ref=launch',
    highlight: 'Best Value',
  },
];

const launchTestimonials = [
  {
    quote: 'TRADINGO transformed how we source raw materials. The RFQ matching saved us weeks of vendor discovery time.',
    author: 'Suresh Kumar',
    role: 'Procurement Head',
    company: 'Mumbai Electronics Co.',
    rating: 5,
  },
  {
    quote: 'The escrow system gave us the confidence to trade with new partners. Payment security was our biggest concern.',
    author: 'Neha Agarwal',
    role: 'CEO',
    company: 'Delhi Textiles Pvt. Ltd.',
    rating: 5,
  },
  {
    quote: 'GOCASH rewards are a game changer. We\'ve already earned enough to offset our entire first month\'s subscription.',
    author: 'Rahul Joshi',
    role: 'Owner',
    company: 'Pune Industrial Supplies',
    rating: 5,
  },
  {
    quote: 'Being part of the beta has given us early access to features that our competitors don\'t have yet.',
    author: 'Ankit Patel',
    role: 'Director of Operations',
    company: 'Gujarat Chemicals Ltd.',
    rating: 4,
  },
];

const launchStats = [
  { value: 50, suffix: '+', label: 'Beta Companies', prefix: '' },
  { value: 10000, suffix: '+', label: 'Products Listed', prefix: '' },
  { value: 500, suffix: '+', label: 'Categories', prefix: '' },
  { value: 95, suffix: '%', label: 'Platform Uptime', prefix: '' },
];

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
