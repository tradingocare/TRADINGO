import type { Metadata } from 'next';
import HeroSection from '@/components/sections/HeroSection';
import TradingAcrossBorders from '@/components/sections/TradingAcrossBorders';
import IndiaHubs from '@/components/sections/IndiaHubs';
import TradhexaEngines from '@/components/sections/TradhexaEngines';
import AboutTradingo from '@/components/sections/AboutTradingo';
import { SectionHeader } from '@/components/shared/section-header';
import { AnimatedSection } from '@/components/shared/animated-section';
import { FeatureCards } from '@/components/shared/feature-cards';
import { StatisticsCards } from '@/components/shared/statistics-cards';
import { PricingCards } from '@/components/shared/pricing-cards';
import { Testimonials } from '@/components/shared/testimonials';
import { CTABlock } from '@/components/shared/cta-block';
import { TradingEngines } from '@/components/shared/trading-engines';
import { MarketplaceCounters } from '@/components/shared/marketplace-counters';
import { Separator } from '@/components/ui/separator';
import {
  Shield,
  TrendingUp,
  Users,
  Zap,
  Award,
  Sparkles,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'TRADINGO | The Global Smart Trade System',
};

const sellerBenefits = [
  {
    icon: '\uD83D\uDCC8',
    title: 'Pan-India Reach',
    description: 'List your products to millions of buyers across India with zero upfront investment.',
    href: '/for-sellers',
  },
  {
    icon: '\uD83E\uDD16',
    title: 'Smart RFQ Matching',
    description: 'Get matched with serious buyers through our AI-powered RFQ engine.',
    href: '/rfq',
    badge: 'AI',
  },
  {
    icon: '\uD83D\uDCB0',
    title: 'GOCASH Rewards',
    description: 'Earn GOCASH on every sale. Redeem for listing boosts, analytics, and more.',
    href: '/gocash',
  },
  {
    icon: '\uD83D\uDCCA',
    title: 'Seller Dashboard',
    description: 'Real-time analytics, inventory management, and performance insights.',
    href: '/for-sellers',
  },
  {
    icon: '\uD83D\uDEE1\uFE0F',
    title: 'Secure Escrow',
    description: 'Get paid securely through our escrow system. Funds released on delivery confirmation.',
    href: '/why-tradingo',
  },
  {
    icon: '\uD83C\uDF10',
    title: 'Multi-City Presence',
    description: 'Expand your business across cities with localized market access.',
    href: '/trading',
  },
];

const buyerBenefits = [
  {
    icon: '\u2705',
    title: 'Verified Products',
    description: 'Authenticated listings with detailed specifications and seller ratings.',
    href: '/products',
  },
  {
    icon: '\uD83E\uDD1D',
    title: 'Competitive RFQ',
    description: 'Post requirements and receive competitive quotes from multiple sellers.',
    href: '/rfq',
    badge: 'Popular',
  },
  {
    icon: '\uD83D\uDEE1\uFE0F',
    title: 'Zero-Risk Trading',
    description: 'Escrow-protected payments. Pay only when you confirm satisfaction.',
    href: '/why-tradingo',
  },
  {
    icon: '\uD83D\uDE9A',
    title: 'Pan-India Delivery',
    description: 'Connected logistics network for seamless delivery across India.',
    href: '/trading',
  },
  {
    icon: '\uD83C\uDFC6',
    title: 'TRADGO Rewards',
    description: 'Earn badges and climb the trading leaderboard. Exclusive buyer perks.',
    href: '/tradgo',
  },
  {
    icon: '\uD83C\uDFA7',
    title: 'Dedicated Support',
    description: '24/7 customer support with dedicated relationship managers for businesses.',
    href: '/contact',
  },
];

const membershipPlans = [
  {
    name: 'Starter',
    price: 'Free',
    period: 'month',
    description: 'Perfect for new sellers exploring the marketplace.',
    features: [
      'List up to 10 products',
      'Standard analytics',
      'Email support',
      'Basic RFQ access',
    ],
    href: '/register',
  },
  {
    name: 'Business',
    price: 'Ôé╣999',
    period: 'month',
    description: 'For growing businesses ready to scale.',
    features: [
      'Unlimited product listings',
      'Advanced analytics dashboard',
      'Priority support',
      'AI-powered RFQ matching',
      'GOCASH multiplier (2x)',
      'TRADGO race access',
    ],
    href: '/seller-plans',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Ôé╣2,499',
    period: 'month',
    description: 'For large enterprises with high-volume trading.',
    features: [
      'Everything in Business',
      'Dedicated account manager',
      'API access for bulk operations',
      'Custom integrations',
      'GOCASH multiplier (3x)',
      'Exclusive TRADGO events',
      'White-label options',
    ],
    href: '/seller-plans',
    highlight: 'Best Value',
  },
];

const successStories = [
  {
    quote: 'TRADINGO transformed our business. We went from local sales to pan-India distribution in just 3 months. The RFQ engine is a game-changer.',
    author: 'Rajesh Mehta',
    role: 'Founder',
    company: 'Mehta Enterprises, Gujarat',
    rating: 5,
  },
  {
    quote: 'The escrow system gave us the confidence to trade with new partners. GOCASH rewards actually offset our platform costs significantly.',
    author: 'Priya Sharma',
    role: 'Procurement Head',
    company: 'Sharma Industries, Rajasthan',
    rating: 5,
  },
  {
    quote: 'As a small manufacturer, getting visibility was always a challenge. TRADINGO put us on the map. We now supply to 15+ cities.',
    author: 'Amit Verma',
    role: 'Owner',
    company: 'Verma Fabrics, Maharashtra',
    rating: 4,
  },
  {
    quote: 'TRADGO races made trading fun for our team. The gamification actually improved our procurement strategy and saved us 18% on costs.',
    author: 'Neha Gupta',
    role: 'Supply Chain Director',
    company: 'Gupta Corp, Delhi NCR',
    rating: 5,
  },
];

const marketplaceStats = [
  { value: 50000, suffix: '+', label: 'Products Listed' },
  { value: 15000, suffix: '+', label: 'Active Sellers' },
  { value: 25000, suffix: '+', label: 'Registered Buyers' },
  { value: 500, suffix: '+', label: 'Cities Covered' },
];

const liveCounters = [
  { value: 12847, label: 'Products Listed' },
  { value: 8432, label: 'Active Traders' },
  { value: 24000000, suffix: '', label: 'Trading Volume (24h)' },
  { value: 156, label: 'Live RFQs' },
];


export default function HomePage() {
  return (
    <>
      <HeroSection />

      <TradingAcrossBorders />

      <IndiaHubs />

      <AboutTradingo />

      <Separator />

      {/* 3. Seller Benefits */}
      <section className="py-20 bg-white/[0.02]">
        <div className="container-main">
          <SectionHeader
            title="Why Sell on TRADINGO?"
            subtitle="Reach millions of buyers across India with zero upfront investment. Our platform is built for sellers."
            viewMoreHref="/for-sellers"
            viewMoreLabel="View All Seller Benefits"
          />
          <FeatureCards features={sellerBenefits} columns={3} />
        </div>
      </section>

      <Separator />

      {/* 4. Buyer Benefits */}
      <section className="py-20">
        <div className="container-main">
          <SectionHeader
            title="Why Buy on TRADINGO?"
            subtitle="Source verified products from trusted sellers. Get competitive quotes and trade with confidence."
            viewMoreHref="/for-buyers"
            viewMoreLabel="View All Buyer Benefits"
          />
          <FeatureCards features={buyerBenefits} columns={3} />
        </div>
      </section>

      <Separator />

      {/* 5. Why TRADINGO */}
      <section className="py-20 bg-white/[0.02]">
        <div className="container-main">
          <SectionHeader
            title="Why TRADINGO?"
            subtitle="We're not just another marketplace. Here's what makes us different."
            viewMoreHref="/why-tradingo"
            viewMoreLabel="Discover More"
          />
          <div className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-2">
            {[
              { icon: '\uD83D\uDEE1\uFE0F', title: 'Zero-Risk Trading', desc: 'Escrow-protected payments ensure every transaction is secure. Pay only when satisfied.' },
              { icon: '\uD83E\uDD16', title: 'AI Smart Matching', desc: 'Our AI matches your requirements with the perfect trading partners automatically.' },
              { icon: '\uD83D\uDCB0', title: 'Earn While You Trade', desc: 'GOCASH rewards program gives you cashback on every successful transaction.' },
              { icon: '\uD83C\uDF10', title: 'Pan-India Network', desc: 'Connect with traders across 500+ cities. Expand your business nationwide.' },
            ].map((item) => (
              <AnimatedSection key={item.title}>
                <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6 transition-all duration-500 hover:border-[rgba(212,175,55,0.2)]"
                  style={{
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  }}
                >
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      background: 'radial-gradient(600px circle at 50% 50%, rgba(212,175,55,0.06), transparent 40%)',
                    }}
                  />
                  <div className="relative z-10 flex gap-4">
                    <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[rgba(212,175,55,0.15)] to-[rgba(212,175,55,0.05)] text-xl"
                      style={{ border: '1px solid rgba(212,175,55,0.1)' }}>
                      {item.icon}
                    </span>
                    <div className="flex-1">
                      <h3 className="text-base font-black text-white">{item.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-white/45">{item.desc}</p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      <TradhexaEngines />

      <Separator />

      {/* 7. GOCASH Rewards */}
      <section className="py-20 bg-white/[0.02]">
        <div className="container-main">
          <AnimatedSection>
            <div className="mx-auto max-w-4xl text-center">
              <SectionHeader
                title="GOCASH Rewards Program"
                subtitle="Earn GOCASH on every successful trade. Redeem for listing boosts, premium analytics, platform discounts, and exclusive seller tools."
                viewMoreHref="/gocash"
                viewMoreLabel="Learn About GOCASH"
              />
              <div className="mt-8 grid gap-6 sm:grid-cols-3">
                {[
                  { icon: Sparkles, title: 'Earn GOCASH', desc: 'Get 2-5% back in GOCASH on every completed trade' },
                  { icon: TrendingUp, title: 'Boost Listings', desc: 'Use GOCASH to promote your products to top positions' },
                  { icon: Award, title: 'Unlock Perks', desc: 'Redeem for analytics, support, and premium features' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="glass-card p-6">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent-500/10 text-accent-500">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="font-semibold text-white">{item.title}</h3>
                      <p className="mt-1 text-sm text-white/50">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <Separator />

      {/* 8. TRADGO Race */}
      <section className="py-20">
        <div className="container-main">
          <AnimatedSection>
            <div className="mx-auto max-w-4xl text-center">
              <SectionHeader
                title="TRADGO ÔÇö Gamified Trading Races"
                subtitle="Turn trading into a sport. Compete in trading races, earn badges, climb leaderboards, and unlock exclusive rewards."
                viewMoreHref="/tradgo"
                viewMoreLabel="Join TRADGO Races"
              />
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                {['Speed Trader', 'Volume Master', 'Consistency King', 'Deal Maker'].map((badge) => (
                  <div key={badge} className="glass-card px-6 py-3">
                    <span className="font-medium text-white">{badge}</span>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <Separator />

      {/* 9. Membership Plans */}
      <section className="py-20 bg-white/[0.02]">
        <div className="container-main">
          <SectionHeader
            title="Choose Your Plan"
            subtitle="Start free and upgrade as you grow. Every plan includes access to the TeM tradingo-eMarketplace."
            viewMoreHref="/seller-plans"
            viewMoreLabel="Compare All Plans"
          />
          <PricingCards plans={membershipPlans} />
        </div>
      </section>

      <Separator />

      {/* 10. Loyalty Program */}
      <section className="py-20">
        <div className="container-main">
          <AnimatedSection>
            <div className="mx-auto max-w-3xl text-center">
              <SectionHeader
                title="TRADINGO Loyalty Program"
                subtitle="The more you trade, the more you earn. Our tiered loyalty program rewards your trading activity."
                viewMoreHref="/gocash"
                viewMoreLabel="Explore Rewards"
              />
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {[
                  { tier: 'Bronze', min: '0 GOCASH', perk: 'Basic analytics, email support' },
                  { tier: 'Silver', min: '1,000 GOCASH', perk: 'Priority support, 2x rewards' },
                  { tier: 'Gold', min: '10,000 GOCASH', perk: 'Dedicated manager, 3x rewards, API access' },
                ].map((tier) => (
                  <div key={tier.tier} className="glass-card p-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-accent-500">{tier.min}</p>
                    <h3 className="mt-1 text-xl font-bold text-white">{tier.tier}</h3>
                    <p className="mt-2 text-sm text-white/50">{tier.perk}</p>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <Separator />

      {/* 11. Success Stories */}
      <section className="py-20 bg-white/[0.02]">
        <div className="container-main">
          <SectionHeader
            title="Success Stories"
            subtitle="Hear from traders who transformed their business with TRADINGO."
            viewMoreHref="/about-tradingo"
            viewMoreLabel="Read More Stories"
          />
          <Testimonials testimonials={successStories} />
        </div>
      </section>

      <Separator />

      {/* 12. Live Marketplace Stats */}
      <section className="py-20">
        <div className="container-main">
          <SectionHeader
            title="TRADINGO in Numbers"
            subtitle="Our growing marketplace connects traders across India."
          />
          <StatisticsCards stats={marketplaceStats} />
          <div className="mt-8">
            <MarketplaceCounters items={liveCounters} />
          </div>
        </div>
      </section>

      {/* 13. CTA Footer */}
      <CTABlock
        title="Ready to Start Trading?"
        subtitle="Join India's fastest-growing TeM tradingo-eMarketplace. Create your free account today and start trading with confidence."
        primaryLabel="Create Free Account"
        primaryHref="/register"
        secondaryLabel="Explore Marketplace"
        secondaryHref="/trading"
        variant="accent"
      />
    </>
  );
}

