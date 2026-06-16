import type { Metadata } from 'next';
import {
  Shield,
  FileText,
  CheckCircle,
  TrendingDown,
  Globe,
  Package,
  Truck,
  Headphones,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { SectionHeader } from '@/components/shared/section-header';
import { AnimatedSection } from '@/components/shared/animated-section';
import { FeatureCards } from '@/components/shared/feature-cards';
import { CTABlock } from '@/components/shared/cta-block';
import { Timeline } from '@/components/shared/timeline';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'For Buyers | TRADINGO',
  description:
    'Source verified products from trusted sellers. Get competitive quotes and trade with confidence.',
};

const buyerFeatures = [
  {
    icon: CheckCircle,
    title: 'Verified Products',
    description: 'Authenticated listings with detailed specifications, certifications, and seller ratings.',
    href: '/products',
  },
  {
    icon: FileText,
    title: 'RFQ Marketplace',
    description: 'Post your requirements and receive competitive quotes from multiple verified sellers instantly.',
    href: '/rfq',
    badge: 'Popular',
  },
  {
    icon: Shield,
    title: 'Escrow Protection',
    description: 'Your payments are held in escrow. Pay only when you confirm satisfaction with the delivery.',
    href: '/why-tradingo',
  },
  {
    icon: TrendingDown,
    title: 'Price Comparison',
    description: 'Compare quotes side-by-side to find the best price, delivery terms, and seller ratings.',
    href: '/categories',
  },
  {
    icon: Globe,
    title: 'Pan-India Network',
    description: 'Source from sellers across 500+ cities. Find local suppliers to reduce logistics costs.',
    href: '/trading',
  },
  {
    icon: Package,
    title: 'Bulk Ordering',
    description: 'Place bulk orders with ease. Get volume discounts and negotiate directly with suppliers.',
    href: '/products',
  },
  {
    icon: Truck,
    title: 'Track Deliveries',
    description: 'Real-time tracking of your shipments with integrated logistics partners across India.',
    href: '/trading',
  },
  {
    icon: Headphones,
    title: 'Buyer Support',
    description: '24/7 dedicated buyer support team to help with inquiries, disputes, and order management.',
    href: '/contact',
  },
];

const rfqSteps = [
  { number: 1, title: 'Post Your Requirement', description: 'Describe what you need — product details, quantity, delivery location, and budget.' },
  { number: 2, title: 'Receive Quotes', description: 'Verified sellers review your RFQ and submit competitive quotes with pricing and terms.' },
  { number: 3, title: 'Compare & Select', description: 'Compare quotes based on price, delivery time, seller rating, and payment terms.' },
  { number: 4, title: 'Close the Deal', description: 'Finalize terms, place the order, and pay securely through our escrow system.' },
];

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
