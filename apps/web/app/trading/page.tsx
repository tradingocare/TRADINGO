'use client';

import Link from 'next/link';
import { Shield, Zap, Globe, Search, BarChart3, Truck } from 'lucide-react';
import { TRADING_FEATURES, TRADING_RFQ_STEPS, TRADING_STATS, MASTER_CITIES } from '@/data/master-data';
import { CATALOG_CATEGORIES } from '@/data/catalog-data';
import { Hero } from '@/components/shared/hero';
import { SectionHeader } from '@/components/shared/section-header';
import { AnimatedSection } from '@/components/shared/animated-section';
import { FeatureCards } from '@/components/shared/feature-cards';
import { StatisticsCards } from '@/components/shared/statistics-cards';
import { Timeline } from '@/components/shared/timeline';
import { LiveStats } from '@/components/shared/live-stats';

const features = TRADING_FEATURES;

const rfqSteps = TRADING_RFQ_STEPS.map(s => ({ number: s.step, title: s.title, description: s.description }));

const stats = TRADING_STATS.map(s => {
  const raw = s.value;
  const suffix = raw.includes('+') ? '+' : '';
  const numStr = raw.replace(/[?,+]/g, '');
  let value = parseInt(numStr) || 0;
  if (numStr.includes('Cr')) value = Math.round(parseFloat(numStr) * 1e7);
  if (numStr.includes('L')) value = Math.round(parseFloat(numStr) * 1e5);
  return { value, suffix, label: s.label };
});

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/[0.06] bg-white/[0.04] p-6 backdrop-blur-xl transition-all duration-300 hover:border-orange-500/20 hover:shadow-[0_0_30px_-5px_rgba(255,77,0,0.15)] ${className}`}>
      {children}
    </div>
  );
}

function IconBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10" style={{ color: '#FF4D00' }}>
      {children}
    </div>
  );
}

function GradientGlow() {
  return (
    <div className="pointer-events-none fixed inset-0">
      <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full opacity-25 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(255,77,0,0.15), transparent 70%)' }} />
      <div className="absolute -right-40 -top-20 h-80 w-80 rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(255,77,0,0.1), transparent 70%)' }} />
      <div className="absolute bottom-0 left-1/2 h-60 w-full -translate-x-1/2"
        style={{ background: 'linear-gradient(to top, rgba(255,77,0,0.05), transparent)' }} />
    </div>
  );
}

function Separator() {
  return <div className="h-px bg-white/[0.06]" />;
}

export default function TradingPage() {
  return (
    <div className="relative min-h-screen" style={{ background: '#1D0001' }}>
      <GradientGlow />

      <div className="relative z-10">
        <Hero
          title="TEM E-Marketplace"
          subtitle="India's first Trusted Electronic Marketplace. Discover products, connect with verified sellers, and trade with confidence across 500+ cities."
          badges={['TEM', 'Pan-India', 'Escrow Protected']}
          ctaPrimary={{ label: 'Browse Products', href: '/products' }}
          ctaSecondary={{ label: 'How It Works', href: '#about-tem' }}
        />

        <div className="container-main">
          {/* 1. About TEM */}
          <section id="about-tem" className="scroll-mt-20 py-20">
            <AnimatedSection>
              <div className="mx-auto max-w-3xl text-center">
                <h2 className="text-3xl font-bold text-white sm:text-4xl">
                  What is TEM?
                </h2>
                <p className="mt-4 text-lg text-white/60">
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
                    <GlassCard key={item.label}>
                      <p className="text-2xl font-bold" style={{ color: '#FF4D00' }}>{item.label}</p>
                      <p className="mt-2 text-sm text-white/60">{item.desc}</p>
                    </GlassCard>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          </section>
        </div>

        <Separator />

        {/* 2. Browse Products */}
        <section className="py-20" style={{ background: 'rgba(255,255,255,0.015)' }}>
          <div className="container-main">
            <SectionHeader
              title="Browse Products"
              subtitle="Explore thousands of products across multiple categories. Find exactly what you need."
              viewMoreHref="/products"
              viewMoreLabel="Browse All Products"
            />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {CATALOG_CATEGORIES.slice(0, 8).map(c => c.name).map(
                (cat) => (
                  <Link key={cat} href="/products" className="group">
                    <GlassCard>
                      <h3 className="font-semibold text-white transition-colors group-hover" style={{ color: '#FF4D00' }}>
                        {cat}
                      </h3>
                      <p className="mt-1 text-sm text-white/60">
                        1,000+ products
                      </p>
                    </GlassCard>
                  </Link>
                ),
              )}
            </div>
          </div>
        </section>

        <Separator />

        {/* 3. Browse Categories */}
        <section className="py-20">
          <div className="container-main">
            <SectionHeader
              title="Browse by Category"
              subtitle="Navigate our comprehensive category structure to find products faster."
              viewMoreHref="/categories"
              viewMoreLabel="View All Categories"
            />
            <FeatureCards features={features.slice(0, 3)} columns={3} />
          </div>
        </section>

        <Separator />

        {/* 4. Browse by City */}
        <section className="py-20" style={{ background: 'rgba(255,255,255,0.015)' }}>
          <div className="container-main">
            <SectionHeader
              title="Browse by City"
              subtitle="Find local suppliers and buyers in your region. Reduce logistics costs and delivery times."
              viewMoreHref="/trading"
              viewMoreLabel="Explore Cities"
            />
            <div className="flex flex-wrap justify-center gap-3">
              {MASTER_CITIES.slice(0, 10).map(c => c.name).map(
                (city) => (
                  <Link
                    key={city}
                    href="/trading"
                    className="rounded-full border border-white/[0.08] bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white/60 backdrop-blur-xl transition-all duration-200 hover:border-orange-500/30 hover:text-orange-400 hover:shadow-[0_0_20px_-8px_rgba(255,77,0,0.2)]"
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
        <section className="py-20">
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
                      <GlassCard key={item.title}>
                        <IconBox><Icon className="h-5 w-5" /></IconBox>
                        <h3 className="font-semibold text-white">{item.title}</h3>
                        <p className="mt-1 text-sm text-white/60">{item.desc}</p>
                      </GlassCard>
                    );
                  })}
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>

        <Separator />

        {/* 6. For Buyers */}
        <section className="py-20" style={{ background: 'rgba(255,255,255,0.015)' }}>
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
                      <GlassCard key={item.title}>
                        <IconBox><Icon className="h-5 w-5" /></IconBox>
                        <h3 className="font-semibold text-white">{item.title}</h3>
                        <p className="mt-1 text-sm text-white/60">{item.desc}</p>
                      </GlassCard>
                    );
                  })}
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>

        <Separator />

        {/* 7. RFQ Marketplace Flow */}
        <section className="py-20">
          <div className="container-main">
            <SectionHeader
              title="RFQ Marketplace Flow"
              subtitle="How the RFQ process works � from posting requirements to closing deals."
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
        <section className="py-20" style={{ background: 'rgba(255,255,255,0.015)' }}>
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
                      <GlassCard key={item.title}>
                        <IconBox><Icon className="h-5 w-5" /></IconBox>
                        <h3 className="font-semibold text-white">{item.title}</h3>
                        <p className="mt-1 text-sm text-white/60">{item.desc}</p>
                      </GlassCard>
                    );
                  })}
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>

        <Separator />

        {/* 9. Live Statistics */}
        <section className="py-20">
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
        <section className="py-20" style={{ background: 'rgba(255,255,255,0.015)' }}>
          <div className="container-main">
            <SectionHeader
              title="Why Trade on TRADINGO?"
              subtitle="The best platform for B2B trading in India."
              viewMoreHref="/why-tradingo"
              viewMoreLabel="Discover More"
            />
            <FeatureCards
              features={[
                { icon: '???', title: 'Trust & Safety', description: 'Verified traders and escrow protection on every transaction.', href: '/why-tradingo' },
                { icon: '??', title: 'Pan-India Network', description: 'Connect with traders across 500+ cities and growing.', href: '/trading' },
                { icon: '?', title: 'AI-Powered Tools', description: 'Smart matching, price intelligence, and market insights.', href: '/tradhexa' },
                { icon: '??', title: 'Rewards Ecosystem', description: 'Earn GOCASH on every trade. Participate in TRADGO races.', href: '/gocash' },
              ]}
              columns={4}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
