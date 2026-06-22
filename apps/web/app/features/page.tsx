import type { Metadata } from 'next';

import { PageHeader } from '@/components/shared/page-header';
import { SectionHeader } from '@/components/shared/section-header';
import { AnimatedSection } from '@/components/shared/animated-section';
import { FeatureCards } from '@/components/shared/feature-cards';
import { CTABlock } from '@/components/shared/cta-block';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'Powerful Features for Global Trade | TRADINGO',
  description:
    'Explore TRADINGO platform features — TRADBUY, RFQ, GOCASH, TRADGO, Escrow, Trade Matching, and more for sellers and buyers.',
};

const sellerFeatures = [
  {
    icon: '🌐',
    title: 'Pan-India Reach',
    description: 'List products to millions of buyers across 500+ cities with tools for multi-currency and multi-language support.',
    href: '/products',
  },
  {
    icon: '📦',
    title: 'TRADBUY Listings',
    description: 'Create rich product listings with AI-powered categorization, bulk upload, and dynamic pricing controls.',
    href: '/tradbuy',
    badge: 'AI',
  },
  {
    icon: '⚡',
    title: 'RFQ Matching',
    description: 'Receive AI-matched RFQs from qualified buyers. Respond with competitive quotes and close deals faster.',
    href: '/rfq',
  },
  {
    icon: '📊',
    title: 'Seller Analytics',
    description: 'Real-time insights on product views, inquiries, conversion rates, revenue trends, and competitor benchmarking.',
    href: '/for-sellers',
  },
  {
    icon: '🏆',
    title: 'GOCASH Rewards',
    description: 'Earn GOCASH on every completed sale. Redeem for listing boosts, premium features, and platform discounts.',
    href: '/gocash',
  },
  {
    icon: '🚚',
    title: 'Logistics Integration',
    description: 'Integrated shipping partners for pan-India fulfillment. Track orders, generate labels, and manage returns.',
    href: '/tradgo',
  },
];

const buyerFeatures = [
  {
    icon: '🔍',
    title: 'Smart Product Search',
    description: 'AI-powered search with filters for category, price, location, minimum order, and seller verification level.',
    href: '/products',
  },
  {
    icon: '💬',
    title: 'RFQ & Negotiation',
    description: 'Post RFQs and receive competitive quotes from multiple sellers. Negotiate pricing and terms in real time.',
    href: '/rfq',
  },
  {
    icon: '🛡️',
    title: 'Escrow Protection',
    description: 'Payments held securely in escrow until goods are delivered and confirmed. Risk-free transactions guaranteed.',
    href: '/why-tradingo',
  },
  {
    icon: '👁️',
    title: 'Transparent Pricing',
    description: 'Compare prices across sellers, view historical price trends, and make informed purchasing decisions.',
    href: '/for-buyers',
  },
  {
    icon: '🏢',
    title: 'Verified Suppliers',
    description: 'Source from KYC-verified suppliers with trust scores, transaction history, and real user reviews.',
    href: '/companies',
  },
  {
    icon: '💳',
    title: 'Flexible Payments',
    description: 'Pay via UPI, net banking, credit cards, or trade credit. Multiple payment options with instant confirmation.',
    href: '/order',
  },
];

const platformFeatures = [
  {
    icon: '🤖',
    title: 'AI Trade Assistant',
    description: 'Intelligent assistant for product recommendations, pricing suggestions, and market insights.',
    badge: 'AI',
  },
  {
    icon: '📄',
    title: 'Automated Documentation',
    description: 'Auto-generated invoices, purchase orders, and GST-compliant tax documents for every transaction.',
  },
  {
    icon: '🔔',
    title: 'Smart Notifications',
    description: 'Real-time alerts for RFQs, quotes, orders, payments, and platform updates via email, SMS, and in-app.',
  },
  {
    icon: '🎧',
    title: '24/7 Support',
    description: 'Multi-channel support with live chat, email, phone, and dedicated relationship managers for enterprise clients.',
  },
  {
    icon: '📈',
    title: 'Trade Matching Engine',
    description: 'Proprietary algorithm matching buyer requirements with seller catalogs for optimal trade pairings.',
    badge: 'New',
  },
  {
    icon: '🌐',
    title: 'Multi-Currency Support',
    description: 'Trade in INR, USD, EUR, and more. Real-time currency conversion with competitive exchange rates.',
  },
  {
    icon: '📦',
    title: 'Bulk Operations',
    description: 'API access for bulk product upload, order processing, inventory syncing, and catalog management.',
  },
  {
    icon: '📊',
    title: 'Market Intelligence',
    description: 'Industry trends, pricing benchmarks, demand forecasts, and competitive analysis powered by AI.',
  },
];

const trustFeatures = [
  {
    icon: '🔒',
    title: 'Enterprise-Grade Security',
    description: '256-bit SSL encryption, SOC 2 compliance, and regular third-party security audits. Your data stays protected.',
  },
  {
    icon: '✅',
    title: 'KYC-Verified Ecosystem',
    description: 'Every company undergoes thorough KYC verification. Trust scores and transaction history visible to all partners.',
  },
  {
    icon: '🛡️',
    title: 'Dispute Resolution',
    description: 'Structured dispute resolution process with neutral mediators. Escrow ensures fair outcomes for both parties.',
  },
];

export default function FeaturesPage() {
  return (
    <>
      <PageHeader
        title="Powerful Features for Global Trade"
        description="Everything you need to buy and sell across borders — from AI-powered matching to secure escrow payments."
      />

      <section className="py-20 bg-surface-secondary/50 dark:bg-dark-surface-secondary/50">
        <div className="container-main">
          <AnimatedSection>
            <SectionHeader
              title="For Sellers"
              subtitle="Grow your business with tools designed to help you list, match, and sell at scale."
            />
            <FeatureCards features={sellerFeatures} columns={3} />
          </AnimatedSection>
        </div>
      </section>

      <Separator />

      <section className="py-20">
        <div className="container-main">
          <AnimatedSection>
            <SectionHeader
              title="For Buyers"
              subtitle="Source products smarter with transparent pricing, verified suppliers, and secure transactions."
            />
            <FeatureCards features={buyerFeatures} columns={3} />
          </AnimatedSection>
        </div>
      </section>

      <Separator />

      <section className="py-20 bg-surface-secondary/50 dark:bg-dark-surface-secondary/50">
        <div className="container-main">
          <AnimatedSection>
            <SectionHeader
              title="Platform Features"
              subtitle="The technology powering India's most trusted B2B trading platform."
            />
            <FeatureCards features={platformFeatures} columns={4} />
          </AnimatedSection>
        </div>
      </section>

      <Separator />

      <section className="py-20">
        <div className="container-main">
          <AnimatedSection>
            <SectionHeader
              title="Security & Trust"
              subtitle="Built on a foundation of security, transparency, and verified trust."
            />
            <FeatureCards features={trustFeatures} columns={3} />
          </AnimatedSection>
        </div>
      </section>

      <CTABlock
        variant="accent"
        title="Ready to get started?"
        subtitle="Join thousands of businesses already trading on TRADINGO. Create your free account today."
        primaryLabel="Create Free Account"
        primaryHref="/register"
        secondaryLabel="Explore Features"
        secondaryHref="/for-sellers"
      />
    </>
  );
}
