import type { Metadata } from 'next';
import { Zap, Shield, TrendingDown, Clock, MessageSquare, Users } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { SectionHeader } from '@/components/shared/section-header';
import { AnimatedSection } from '@/components/shared/animated-section';
import { FeatureCards } from '@/components/shared/feature-cards';
import { CTABlock } from '@/components/shared/cta-block';
import { Timeline } from '@/components/shared/timeline';
import { MarketplaceCounters } from '@/components/shared/marketplace-counters';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'RFQ Marketplace | TRADINGO',
  description:
    'Post your requirements and receive competitive quotes from verified sellers in real-time.',
};

const rfqFeatures = [
  {
    icon: Zap,
    title: 'Real-Time Quotes',
    description: 'Receive competitive quotes from multiple verified sellers within hours of posting your requirement.',
    href: '/for-buyers',
  },
  {
    icon: Shield,
    title: 'Verified Sellers',
    description: 'All participating sellers are KYC verified with proven track records and ratings.',
    href: '/why-tradingo',
  },
  {
    icon: TrendingDown,
    title: 'Best Price Discovery',
    description: 'Let sellers compete for your business. Get the best market price through competitive bidding.',
    href: '/for-buyers',
    badge: 'Save',
  },
  {
    icon: Clock,
    title: 'Quick Turnaround',
    description: 'Streamlined process from requirement posting to deal closure in record time.',
    href: '/for-buyers',
  },
  {
    icon: MessageSquare,
    title: 'Direct Negotiation',
    description: 'Chat directly with sellers to negotiate terms, samples, and delivery schedules.',
    href: '/for-buyers',
  },
  {
    icon: Users,
    title: 'Pan-India Sellers',
    description: 'Access sellers from 500+ cities. Find local suppliers to optimize your logistics.',
    href: '/trading',
  },
];

const rfqFlow = [
  { number: 1, title: 'Post Your Requirement', description: 'Fill in product details, quantity, delivery location, budget, and timeline.' },
  { number: 2, title: 'Sellers Review & Quote', description: 'Verified sellers review your RFQ and submit their best offers with pricing and terms.' },
  { number: 3, title: 'Compare Proposals', description: 'Review and compare quotes side-by-side based on price, delivery, and seller ratings.' },
  { number: 4, title: 'Negotiate & Finalize', description: 'Chat with shortlisted sellers, negotiate terms, and finalize the deal.' },
  { number: 5, title: 'Pay Securely', description: 'Complete payment through our escrow system. Funds released only on delivery confirmation.' },
];

const rfqCounters = [
  { value: 15000, suffix: '+', label: 'Active RFQs' },
  { value: 8500, suffix: '+', label: 'Verified Sellers' },
  { value: 50000, suffix: '+', label: 'Quotes Generated' },
  { value: 97, suffix: '%', label: 'Satisfaction Rate' },
];

export default function RFQPage() {
  return (
    <>
      <PageHeader
        title="RFQ Marketplace"
        description="Post your requirements and receive competitive quotes from verified sellers in real-time."
      />

      <section className="py-20">
        <div className="container-main">
          <AnimatedSection>
            <div className="mx-auto max-w-4xl text-center">
              <SectionHeader
                title="How RFQ Works"
                subtitle="A simple, transparent process to get the best prices from verified sellers."
              />
              <div className="mt-8 grid gap-6 sm:grid-cols-3">
                {[
                  { label: 'Post Once', desc: 'Describe your requirement once and reach multiple sellers' },
                  { label: 'Compare Offers', desc: 'Review quotes, ratings, and terms side-by-side' },
                  { label: 'Trade Safe', desc: 'Escrow-protected payments for zero-risk transactions' },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-border bg-surface p-6 shadow-sm dark:bg-dark-surface dark:border-dark-border">
                    <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{item.label}</p>
                    <p className="mt-2 text-sm text-text-secondary dark:text-dark-text-secondary">{item.desc}</p>
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
            title="RFQ Process Flow"
            subtitle="From posting to delivery — a seamless five-step process."
          />
          <div className="mx-auto max-w-2xl">
            <Timeline steps={rfqFlow} />
          </div>
        </div>
      </section>

      <Separator />

      <section className="py-20">
        <div className="container-main">
          <SectionHeader
            title="Why Use RFQ Marketplace?"
            subtitle="Save time, money, and effort with smart requirement posting."
          />
          <FeatureCards features={rfqFeatures} columns={3} />
        </div>
      </section>

      <Separator />

      <section className="py-20 bg-surface-secondary/50 dark:bg-dark-surface-secondary/50">
        <div className="container-main">
          <SectionHeader
            title="RFQ Marketplace Stats"
            subtitle="Real-time activity on our RFQ marketplace."
          />
          <MarketplaceCounters items={rfqCounters} />
        </div>
      </section>

      <CTABlock
        title="Ready to Get the Best Quotes?"
        subtitle="Post your first RFQ and receive competitive offers from verified sellers."
        primaryLabel="Post Your RFQ"
        primaryHref="/register"
        secondaryLabel="Learn More"
        secondaryHref="/for-buyers"
        variant="accent"
      />
    </>
  );
}
