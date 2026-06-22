import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Zap, Globe, Search, BarChart3, Truck, Award } from 'lucide-react';
import { Hero } from '@/components/shared/hero';
import { SectionHeader } from '@/components/shared/section-header';
import { AnimatedSection } from '@/components/shared/animated-section';
import { FeatureCards } from '@/components/shared/feature-cards';
import { StatisticsCards } from '@/components/shared/statistics-cards';
import { CTABlock } from '@/components/shared/cta-block';
import { Timeline } from '@/components/shared/timeline';
import { LiveStats } from '@/components/shared/live-stats';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'TEM E-Marketplace',
  description:
    'Explore TRADINGO TEM — India\'s first Trusted Electronic Marketplace. Browse products, connect with sellers, and trade securely.',
};

const features = [
  {
    icon: '🔍',
    title: 'Smart Product Discovery',
    description: 'Find exactly what you need with AI-powered search and intelligent filters.',
    href: '/products',
  },
  {
    icon: '📊',
    title: 'Categories & Niches',
    description: 'Browse thousands of products across carefully organized categories and subcategories.',
    href: '/categories',
  },
  {
    icon: '🌐',
    title: 'City-Wise Trading',
    description: 'Discover local suppliers and buyers in your city. Optimize logistics and reduce costs.',
    href: '/trading',
    badge: 'New',
  },
  {
    icon: '👥',
    title: 'Seller Marketplace',
    description: 'List your products and reach buyers across India with zero upfront investment.',
    href: '/for-sellers',
  },
  {
    icon: '🛡️',
    title: 'Buyer Protection',
    description: 'Source verified products from trusted sellers. Escrow-protected payments ensure zero risk.',
    href: '/for-buyers',
  },
  {
    icon: '⚡',
    title: 'RFQ Marketplace',
    description: 'Post requirements and receive competitive bids from multiple sellers in real-time.',
    href: '/rfq',
  },
];

const rfqSteps = [
  { number: 1, title: 'Post Your Requirement', description: 'Describe what you need — product, quantity, location, and budget.' },
  { number: 2, title: 'Receive Competitive Bids', description: 'Verified sellers review your RFQ and submit their best offers.' },
  { number: 3, title: 'Compare & Select', description: 'Compare quotes based on price, delivery time, seller rating, and terms.' },
  { number: 4, title: 'Trade Securely', description: 'Complete the transaction through our escrow system. Pay only when satisfied.' },
];

const stats = [
  { value: 50000, suffix: '+', label: 'Products Listed' },
  { value: 15000, suffix: '+', label: 'Active Sellers' },
  { value: 25000, suffix: '+', label: 'Registered Buyers' },
  { value: 500, suffix: '+', label: 'Cities Covered' },
];

export default function TradingPage() {
  return (
    <>
      <Hero
        title="TEM E-Marketplace"
        subtitle="India's first Trusted Electronic Marketplace. Discover products, connect with verified sellers, and trade with confidence across 500+ cities."
        badges={['TEM', 'Pan-India', 'Escrow Protected']}
        ctaPrimary={{ label: 'Browse Products', href: '/products' }}
        ctaSecondary={{ label: 'How It Works', href: '#about-tem' }}
      />

      {/* 1. About TEM */}
      <section id="about-tem" className="scroll-mt-20 py-20">
        <div className="container-main">
          <AnimatedSection>
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold sm:text-4xl dark:text-dark-text-primary">
                What is TEM?
              </h2>
              <p className="mt-4 text-lg text-text-secondary dark:text-dark-text-secondary">
                TEM (Trusted Electronic Marketplace) is TRADINGO&apos;s proprietary marketplace framework
                that combines AI-powered matching, secure escrow payments, verified listings, and
                gamified rewards into a single, seamless trading experience.
              </p>
              <div className="mt-8 grid gap-6 sm:grid-cols-3">
                {[
                  { label: 'Trust', desc: 'Verified sellers & escrow protection' },
                  { label: 'Efficiency', desc: 'AI-powered matching & smart RFQ' },
                  { label: 'Marketplace', desc: 'Pan-India B2B trading network' },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-border bg-surface p-6 dark:bg-dark-surface dark:border-dark-border">
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

      {/* 2. Browse Products */}
      <section className="py-20">
        <div className="container-main">
          <SectionHeader
            title="Browse Products"
            subtitle="Explore thousands of products across multiple categories. Find exactly what you need."
            viewMoreHref="/products"
            viewMoreLabel="Browse All Products"
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {['Industrial Machinery', 'Electronics', 'Textiles & Fabrics', 'Chemicals', 'Packaging', 'Automotive', 'Food & Agro', 'Construction'].map(
              (cat) => (
                <Link
                  key={cat}
                  href="/products"
                  className="group rounded-xl border border-border bg-surface p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 dark:bg-dark-surface dark:border-dark-border"
                >
                  <h3 className="font-semibold text-text-primary group-hover:text-primary-600 dark:text-dark-text-primary dark:group-hover:text-primary-400">
                    {cat}
                  </h3>
                  <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">
                    1,000+ products
                  </p>
                </Link>
              ),
            )}
          </div>
        </div>
      </section>

      <Separator />

      {/* 3. Browse Categories */}
      <section className="py-20 bg-surface-secondary/50 dark:bg-dark-surface-secondary/50">
        <div className="container-main">
          <SectionHeader
            title="Browse by Category"
            subtitle="Navigate our comprehensive category structure to find products faster."
            viewMoreHref="/categories"
            viewMoreLabel="View All Categories"
          />
          <FeatureCards
            features={features.slice(0, 3)}
            columns={3}
          />
        </div>
      </section>

      <Separator />

      {/* 4. Browse by City */}
      <section className="py-20">
        <div className="container-main">
          <SectionHeader
            title="Browse by City"
            subtitle="Find local suppliers and buyers in your region. Reduce logistics costs and delivery times."
            viewMoreHref="/trading"
            viewMoreLabel="Explore Cities"
          />
          <div className="flex flex-wrap justify-center gap-3">
            {['Mumbai', 'Delhi', 'Bengaluru', 'Ahmedabad', 'Chennai', 'Kolkata', 'Pune', 'Hyderabad', 'Jaipur', 'Lucknow'].map(
              (city) => (
                <Link
                  key={city}
                  href="/trading"
                  className="rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-medium text-text-secondary transition-all hover:border-primary-300 hover:text-primary-600 hover:shadow-sm dark:bg-dark-surface dark:border-dark-border dark:text-dark-text-secondary dark:hover:border-primary-600"
                >
                  {city}
                </Link>
              ),
            )}
          </div>
        </div>
      </section>

      <Separator />

      {/* 5. For Sellers */}
      <section className="py-20 bg-surface-secondary/50 dark:bg-dark-surface-secondary/50">
        <div className="container-main">
          <AnimatedSection>
            <div className="mx-auto max-w-4xl text-center">
              <SectionHeader
                title="For Sellers"
                subtitle="List your products, reach pan-India buyers, and grow your business with TRADINGO's seller tools."
                viewMoreHref="/for-sellers"
                viewMoreLabel="View Seller Benefits"
              />
              <div className="mt-8 grid gap-6 sm:grid-cols-3">
                {[
                  { icon: Globe, title: 'Pan-India Reach', desc: 'Access buyers across 500+ cities' },
                  { icon: BarChart3, title: 'Smart Analytics', desc: 'Real-time insights on performance' },
                  { icon: Shield, title: 'Secure Payments', desc: 'Escrow-protected transactions' },
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

      <Separator />

      {/* 6. For Buyers */}
      <section className="py-20">
        <div className="container-main">
          <AnimatedSection>
            <div className="mx-auto max-w-4xl text-center">
              <SectionHeader
                title="For Buyers"
                subtitle="Source verified products, compare quotes, and trade with confidence."
                viewMoreHref="/for-buyers"
                viewMoreLabel="View Buyer Benefits"
              />
              <div className="mt-8 grid gap-6 sm:grid-cols-3">
                {[
                  { icon: Search, title: 'Smart Sourcing', desc: 'AI-matched product recommendations' },
                  { icon: Shield, title: 'Quality Assured', desc: 'Verified sellers & product checks' },
                  { icon: Truck, title: 'Pan-India Delivery', desc: 'Connected logistics network' },
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

      <Separator />

      {/* 7. RFQ Marketplace Flow */}
      <section className="py-20 bg-surface-secondary/50 dark:bg-dark-surface-secondary/50">
        <div className="container-main">
          <SectionHeader
            title="RFQ Marketplace Flow"
            subtitle="How the RFQ process works — from posting requirements to closing deals."
            viewMoreHref="/rfq"
            viewMoreLabel="Go to RFQ Marketplace"
          />
          <div className="mx-auto max-w-2xl">
            <Timeline steps={rfqSteps} />
          </div>
        </div>
      </section>

      <Separator />

      {/* 8. Secure Trading */}
      <section className="py-20">
        <div className="container-main">
          <AnimatedSection>
            <div className="mx-auto max-w-4xl text-center">
              <SectionHeader
                title="Secure Trading on TEM"
                subtitle="Every transaction on TRADINGO is protected by our multi-layer security framework."
                viewMoreHref="/why-tradingo"
                viewMoreLabel="Learn About Security"
              />
              <div className="mt-8 grid gap-6 sm:grid-cols-3">
                {[
                  { icon: Shield, title: 'Escrow Protection', desc: 'Funds held in escrow until both parties confirm' },
                  { icon: Zap, title: 'Identity Verification', desc: 'All sellers and buyers are KYC verified' },
                  { icon: BarChart3, title: 'Dispute Resolution', desc: 'Dedicated team for fair conflict resolution' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="rounded-xl border border-border bg-surface p-6 shadow-sm dark:bg-dark-surface dark:border-dark-border">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent-50 text-accent-600 dark:bg-accent-900/30 dark:text-accent-400">
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

      <Separator />

      {/* 9. Live Statistics */}
      <section className="py-20 bg-surface-secondary/50 dark:bg-dark-surface-secondary/50">
        <div className="container-main">
          <SectionHeader title="Live Marketplace Statistics" subtitle="Real-time activity on the TRADINGO marketplace." />
          <StatisticsCards stats={stats} />
          <div className="mt-8">
            <LiveStats />
          </div>
        </div>
      </section>

      <Separator />

      {/* 10. Why Trade on TRADINGO */}
      <section className="py-20">
        <div className="container-main">
          <SectionHeader
            title="Why Trade on TRADINGO?"
            subtitle="The best platform for B2B trading in India."
            viewMoreHref="/why-tradingo"
            viewMoreLabel="Discover More"
          />
          <FeatureCards
            features={[
              { icon: '🛡️', title: 'Trust & Safety', description: 'Verified traders and escrow protection on every transaction.', href: '/why-tradingo' },
              { icon: '🌐', title: 'Pan-India Network', description: 'Connect with traders across 500+ cities and growing.', href: '/trading' },
              { icon: '⚡', title: 'AI-Powered Tools', description: 'Smart matching, price intelligence, and market insights.', href: '/tradhexa' },
              { icon: '🏆', title: 'Rewards Ecosystem', description: 'Earn GOCASH on every trade. Participate in TRADGO races.', href: '/gocash' },
            ]}
            columns={4}
          />
        </div>
      </section>

      {/* 11. Final CTA */}
      <CTABlock
        title="Start Trading on TEM Today"
        subtitle="Create your free account and join India's fastest-growing B2B marketplace."
        primaryLabel="Create Free Account"
        primaryHref="/register"
        secondaryLabel="Browse Products"
        secondaryHref="/products"
        variant="accent"
      />
    </>
  );
}
