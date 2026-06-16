import type { Metadata } from 'next';
import {
  Globe,
  Zap,
  Shield,
  BarChart3,
  Award,
  Headphones,
  Package,
  Trophy,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { SectionHeader } from '@/components/shared/section-header';
import { AnimatedSection } from '@/components/shared/animated-section';
import { FeatureCards } from '@/components/shared/feature-cards';
import { PricingCards } from '@/components/shared/pricing-cards';
import { CTABlock } from '@/components/shared/cta-block';
import { Timeline } from '@/components/shared/timeline';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'For Sellers | TRADINGO',
  description:
    'Reach millions of buyers across India. List your products, get AI-matched leads, and grow your business.',
};

const sellerFeatures = [
  {
    icon: Globe,
    title: 'Pan-India Reach',
    description: 'List your products to millions of buyers across 500+ cities with zero upfront investment.',
    href: '/products',
  },
  {
    icon: Zap,
    title: 'AI Lead Matching',
    description: 'Get matched with serious buyers through our AI-powered RFQ engine that understands your products.',
    href: '/rfq',
    badge: 'AI',
  },
  {
    icon: Shield,
    title: 'Escrow Payments',
    description: 'Get paid securely through our escrow system. Funds are released only on successful delivery confirmation.',
    href: '/why-tradingo',
  },
  {
    icon: BarChart3,
    title: 'Seller Analytics',
    description: 'Real-time dashboard with insights on views, inquiries, conversions, and revenue metrics.',
    href: '/for-sellers',
  },
  {
    icon: Award,
    title: 'GOCASH Rewards',
    description: 'Earn GOCASH on every sale. Redeem for listing boosts, premium analytics, and platform discounts.',
    href: '/gocash',
  },
  {
    icon: Headphones,
    title: 'Dedicated Support',
    description: 'Priority support with dedicated relationship managers to help you grow your business.',
    href: '/contact',
  },
  {
    icon: Package,
    title: 'Easy Listing',
    description: 'Bulk upload products with AI-assisted categorization. List in minutes, not hours.',
    href: '/products',
  },
  {
    icon: Trophy,
    title: 'TRADGO Races',
    description: 'Compete in trading races, earn badges, climb leaderboards, and unlock exclusive seller perks.',
    href: '/tradgo',
  },
];

const sellerPlans = [
  {
    name: 'Free Starter',
    price: 'Free',
    period: 'month',
    description: 'Perfect for new sellers exploring the marketplace.',
    features: [
      'List up to 10 products',
      'Standard analytics',
      'Email support',
      'Basic RFQ access',
      'Community forum access',
    ],
    href: '/register',
  },
  {
    name: 'Business',
    price: '₹999',
    period: 'month',
    description: 'For growing businesses ready to scale across India.',
    features: [
      'Unlimited product listings',
      'Advanced analytics dashboard',
      'Priority chat & phone support',
      'AI-powered RFQ matching',
      'GOCASH multiplier (2x)',
      'TRADGO race access',
      'Bulk listing tools',
    ],
    href: '/seller-plans',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '₹2,499',
    period: 'month',
    description: 'For large enterprises with high-volume trading needs.',
    features: [
      'Everything in Business',
      'Dedicated account manager',
      'API access for bulk operations',
      'Custom integrations',
      'GOCASH multiplier (3x)',
      'Exclusive TRADGO events',
      'White-label catalog options',
      'Priority dispute resolution',
    ],
    href: '/seller-plans',
    highlight: 'Best Value',
  },
];

const onboardingSteps = [
  { number: 1, title: 'Create Your Account', description: 'Sign up for free and complete your seller profile with business details and KYC verification.' },
  { number: 2, title: 'List Your Products', description: 'Upload product catalogs with descriptions, prices, and images. Use bulk upload for large inventories.' },
  { number: 3, title: 'Get Verified', description: 'Complete the verification process to build trust with buyers and unlock all platform features.' },
  { number: 4, title: 'Start Selling', description: 'Receive inquiries, respond to RFQs, and close deals. Get paid securely through our escrow system.' },
];

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
