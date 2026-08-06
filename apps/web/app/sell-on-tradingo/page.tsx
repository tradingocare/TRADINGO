import Link from 'next/link';
import {
  TrendingUp,
  Users,
  Package,
  MessageSquare,
  Star,
  Truck,
  Award,
  BarChart3,
  Zap,
  Shield,
  Wallet,
  Headphones,
  BrainCircuit,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/shared/section-header';
import { AnimatedSection } from '@/components/shared/animated-section';
import { StatisticsCards } from '@/components/shared/statistics-cards';
import { FeatureCards } from '@/components/shared/feature-cards';
import { PricingCards } from '@/components/shared/pricing-cards';
import { Testimonials } from '@/components/shared/testimonials';
import { Accordion } from '@/components/ui/accordion';
import { CTABlock } from '@/components/shared/cta-block';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';

const SELLER_BENEFITS = [
  {
    icon: '0%',
    title: 'Zero Commission on First 50 Orders',
    description: 'List and sell your products without any marketplace fees on your first 50 orders. Keep 100% of your revenue.',
  },
  {
    icon: '🤖',
    title: 'AI-Powered Product Matching',
    description: 'Our AI matches your products with the most relevant buyer RFQs, increasing your conversion rate by up to 3x.',
  },
  {
    icon: '🚚',
    title: 'Pan-India Logistics Network',
    description: 'Integrated logistics partners covering 29,000+ pin codes. Automated shipping labels, tracking, and delivery confirmation.',
  },
  {
    icon: '💰',
    title: 'GOCASH Rewards Program',
    description: 'Earn GOCASH rewards on every milestone — first sale, 100th order, positive reviews, and more. Redeem for plan upgrades.',
  },
  {
    icon: '👤',
    title: 'Dedicated Account Manager',
    description: 'Premium sellers get a dedicated account manager to help optimize listings, resolve disputes, and grow your business.',
  },
  {
    icon: '📊',
    title: 'Real-Time Analytics Dashboard',
    description: 'Track views, clicks, conversions, and revenue in real time. Make data-driven decisions to scale your sales.',
  },
];

const WHY_TRADINGO = [
  {
    icon: '🧠',
    title: 'AI Matching Engine',
    description: 'Our proprietary AI analyzes buyer requirements, past purchases, and preferences to match you with high-intent buyers automatically.',
    href: '/ai-infrastructure',
    badge: 'AI',
  },
  {
    icon: '🛡️',
    title: 'TradTrust Trust Score',
    description: 'Every seller gets a TradTrust score based on order fulfillment, product quality, response time, and customer satisfaction. Higher scores get better visibility.',
    href: '/tradgo',
    badge: 'TRUST',
  },
  {
    icon: '🔒',
    title: 'Secure Escrow Payments',
    description: 'All payments are held in escrow until the buyer confirms delivery. No chargebacks, no payment delays — guaranteed settlement within 48 hours.',
    badge: 'SECURE',
  },
  {
    icon: '🤝',
    title: 'Built-in Negotiation Tools',
    description: 'Handle price negotiations, quantity discounts, and contract terms directly on the platform with our Smart Negotiation suite.',
    badge: 'TOOLS',
  },
];

const PLANS = [
  {
    name: 'Trade Start',
    price: 'Free',
    period: 'month',
    description: 'Perfect for new sellers exploring the marketplace.',
    features: [
      'List up to 50 products',
      'Basic analytics dashboard',
      'Standard customer support',
      'Payment via escrow',
      'Basic product listing',
    ],
    href: '/register/vendor',
  },
  {
    name: 'Trade Smart',
    price: '₹999',
    period: 'month',
    description: 'For growing businesses ready to scale their sales.',
    features: [
      'List up to 500 products',
      'Advanced analytics & insights',
      'Priority customer support',
      'AI product matching',
      'Bulk listing tools',
      'Dedicated account manager',
    ],
    href: '/register/vendor',
    popular: true,
  },
  {
    name: 'Trade Pro',
    price: '₹2,499',
    period: 'month',
    description: 'For established enterprises with high-volume needs.',
    features: [
      'Unlimited product listings',
      'Real-time analytics & reports',
      '24/7 priority support',
      'AI-powered pricing suggestions',
      'API access for integration',
      'Featured seller badge',
      'Custom catalog management',
    ],
    href: '/register/vendor',
  },
];

const VERIFICATION_LEVELS = [
  { level: 'Level 1 — Basic', check: 'Email & Phone Verification', icon: '📧' },
  { level: 'Level 2 — Business', check: 'PAN, GST, Business Registration', icon: '📋' },
  { level: 'Level 3 — Verified', check: 'Bank Account, Address, Udyam Registration', icon: '✅' },
  { level: 'Level 4 — Trusted', check: 'ISO Certification, Quality Reports, Site Visit', icon: '🏆' },
  { level: 'Level 5 — Premium', check: 'Financial Audit, Credit Check, Performance Bond', icon: '💎' },
];

const MARKETPLACE_STATS = [
  { value: 850, suffix: 'Cr+', prefix: '₹', label: 'Monthly GMV', decimals: 0 },
  { value: 350000, label: 'Active Buyers', decimals: 0 },
  { value: 38000, prefix: '₹', label: 'Average Order Value', decimals: 0 },
  { value: 92, suffix: '%', label: 'Repeat Buyer Rate', decimals: 0 },
];

const SELLER_TESTIMONIALS = [
  {
    quote: 'TRADINGO transformed our business. We went from ₹2L to ₹45L monthly revenue in just 6 months. The AI matching alone brought us 200+ qualified leads.',
    author: 'Rajesh Mehta',
    role: 'Founder',
    company: 'Mehta Industries, Delhi',
    rating: 5,
  },
  {
    quote: 'The zero-commission onboarding was a game-changer. We built our catalog, got our first 50 orders, and by then we were already profitable enough to upgrade.',
    author: 'Priya Sharma',
    role: 'CEO',
    company: 'Sharma Exports, Mumbai',
    rating: 5,
  },
  {
    quote: 'TradTrust score gave us credibility that small businesses rarely get. Our win rate on RFQs jumped from 12% to 67% after reaching Level 3 verification.',
    author: 'Amit Verma',
    role: 'Director',
    company: 'Verma Tradelink, Jaipur',
    rating: 5,
  },
  {
    quote: 'The analytics dashboard is incredible. We spotted a pricing gap in the southern market within 24 hours, adjusted our strategy, and captured 30% market share in 3 months.',
    author: 'Suresh Patel',
    role: 'Managing Partner',
    company: 'Patel Brothers, Ahmedabad',
    rating: 4,
  },
];

const FAQ_ITEMS = [
  {
    value: 'eligibility',
    title: 'Who can sell on TRADINGO?',
    children:
      'Any registered business entity in India with a valid GST registration can sell on TRADINGO. We welcome manufacturers, distributors, wholesalers, and authorized dealers across all product categories.',
  },
  {
    value: 'commission',
    title: 'What are the commission charges?',
    children:
      'New sellers enjoy zero commission on their first 50 orders. Post that, commission rates start from just 3% and vary by category. Premium plan subscribers get reduced commission rates and priority listing benefits.',
  },
  {
    value: 'payment',
    title: 'How and when do I get paid?',
    children:
      'Payments are released to your registered bank account within 48 hours of successful delivery confirmation by the buyer. All transactions are processed through our secure escrow system. No chargebacks, no delays.',
  },
  {
    value: 'shipping',
    title: 'How does shipping work?',
    children:
      'We integrate with major logistics partners including Delhivery, Blue Dart, and India Post. You can choose to ship yourself or use our logistics network for automated label generation, tracking, and door-step pickup.',
  },
  {
    value: 'verification',
    title: 'What documents are needed for verification?',
    children:
      'You need a valid GST certificate, PAN card, business registration proof, cancelled cheque for bank verification, and a government-issued ID of the authorized signatory. The process typically takes 24-48 hours.',
  },
  {
    value: 'support',
    title: 'What kind of seller support do you offer?',
    children:
      'All sellers get standard support via ticket system and email. Trade Smart and above plans include priority chat support. Trade Pro and Elite sellers get 24/7 phone support with a dedicated account manager.',
  },
];

export default function SellOnTradingoPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 pb-24 pt-28">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 100% 70% at 50% -10%, rgba(245, 158, 11, 0.1), transparent)',
          }}
        />
        <div className="container-main relative z-10">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 text-sm font-medium text-accent">
              <Zap className="h-4 w-4" />
              India&apos;s Fastest Growing B2B Marketplace
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
              Sell to 3,50,000+{' '}
              <span className="text-gradient">Buyers Across India</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-text-secondary">
              Join India&apos;s most trusted B2B marketplace. List your products for free, get
              matched with high-intent buyers through AI, and grow your business with zero
              commission on your first 50 orders.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/register/vendor">
                <Button size="xl" className="w-full sm:w-auto">
                  Start Selling Free
                  <TrendingUp className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#benefits">
                <Button size="xl" variant="outline" className="w-full sm:w-auto">
                  Learn More
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-text-tertiary">No credit card required. Free forever plan available.</p>
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="pb-20">
        <div className="container-main">
          <StatisticsCards
            stats={[
              { value: 7500, suffix: '+', label: 'Active Sellers', decimals: 0 },
              { value: 350000, suffix: '+', label: 'Products Listed', decimals: 0 },
              { value: 50000, suffix: '+', label: 'Monthly RFQs', decimals: 0 },
              { value: 98, suffix: '%', label: 'Satisfaction Rate', decimals: 0 },
            ]}
          />
        </div>
      </section>

      <Separator />

      {/* Benefits Section */}
      <section id="benefits" className="py-20">
        <div className="container-main">
          <SectionHeader
            title="Everything You Need to Sell at Scale"
            subtitle="From listing to payment — we handle the complexity so you can focus on growing your business."
          />
          <div className="mx-auto max-w-5xl">
            <FeatureCards features={SELLER_BENEFITS} columns={3} />
          </div>
        </div>
      </section>

      <Separator />

      {/* Why TRADINGO */}
      <section className="py-20">
        <div className="container-main">
          <SectionHeader
            title="Why TRADINGO?"
            subtitle="Built differently for serious sellers. Our technology gives you an unfair advantage."
          />
          <div className="mx-auto max-w-5xl">
            <FeatureCards features={WHY_TRADINGO} columns={2} />
          </div>
        </div>
      </section>

      <Separator />

      {/* Membership Plans */}
      <section className="py-20">
        <div className="container-main">
          <SectionHeader
            title="Choose Your Growth Plan"
            subtitle="Start free and upgrade as your business grows. No hidden fees, no long-term contracts."
          />
          <div className="mx-auto max-w-5xl">
            <PricingCards plans={PLANS} />
          </div>
        </div>
      </section>

      <Separator />

      {/* TradTrust Section */}
      <section className="py-20">
        <div className="container-main">
          <div className="mx-auto max-w-5xl">
            <AnimatedSection>
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent/60 shadow-lg">
                  <Shield className="h-8 w-8 text-btn-primary-text" />
                </div>
              </div>
              <SectionHeader
                title="TradTrust — Your Reputation, Your Asset"
                subtitle="A transparent trust scoring system that rewards quality sellers with better visibility, higher RFQ win rates, and premium badges."
              />
            </AnimatedSection>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
              {VERIFICATION_LEVELS.map((level) => (
                <Card key={level.level} className="border-border bg-surface transition-all duration-300 hover:border-accent/30 hover:shadow-lg hover:-translate-y-1">
                  <CardContent className="flex flex-col items-center p-6 text-center">
                    <span className="text-3xl">{level.icon}</span>
                    <h3 className="mt-4 text-sm font-bold text-text-primary">{level.level}</h3>
                    <p className="mt-2 text-xs text-text-secondary">{level.check}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-10 text-center">
              <p className="text-sm text-text-tertiary">
                Higher verification levels unlock priority placement, trust badges, and up to 4x higher response rates on RFQs.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Marketplace Stats */}
      <section className="py-20">
        <div className="container-main">
          <SectionHeader
            title="Marketplace in Motion"
            subtitle="Real numbers from the TRADINGO ecosystem that matter to sellers."
          />
          <StatisticsCards stats={MARKETPLACE_STATS} />
        </div>
      </section>

      <Separator />

      {/* Testimonials */}
      <section className="py-20">
        <div className="container-main">
          <SectionHeader
            title="Trusted by Thousands of Sellers"
            subtitle="Hear from businesses that have scaled with TRADINGO."
          />
          <Testimonials testimonials={SELLER_TESTIMONIALS} />
        </div>
      </section>

      <Separator />

      {/* FAQ */}
      <section className="py-20">
        <div className="container-main">
          <SectionHeader
            title="Frequently Asked Questions"
            subtitle="Everything you need to know about selling on TRADINGO."
          />
          <div className="mx-auto max-w-3xl">
            <Accordion items={FAQ_ITEMS} type="single" defaultValue="eligibility" />
          </div>
        </div>
      </section>

      <CTABlock
        title="Ready to Grow Your Business?"
        subtitle="Join 7,500+ sellers already using TRADINGO to reach buyers across India. Start selling today — free."
        primaryLabel="Start Selling Free"
        primaryHref="/register/vendor"
        secondaryLabel="Talk to Sales"
        secondaryHref="/contact"
        variant="accent"
      />
    </>
  );
}
