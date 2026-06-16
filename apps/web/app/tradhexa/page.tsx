import type { Metadata } from 'next';
import Link from 'next/link';
import { ShoppingCart, FileText, Scale, Shield, Award, Zap, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { SectionHeader } from '@/components/shared/section-header';
import { AnimatedSection } from '@/components/shared/animated-section';
import { TradingEngines } from '@/components/shared/trading-engines';
import { CTABlock } from '@/components/shared/cta-block';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'TRADHEXA™ — 6 Trading Engines | TRADINGO',
  description:
    'Six powerful trading engines powering the TRADINGO TEM™ ecosystem — TRADBUY, RFQ, Trade Matching, Secure Escrow, GOCASH, and TRADGO.',
};

const engines = [
  {
    icon: ShoppingCart,
    name: 'TRADBUY',
    tagline: 'Instant Purchase',
    description:
      'Buy products instantly at listed prices with secure payment processing and automated order matching. Skip the negotiation and checkout in seconds.',
    details:
      'TRADBUY is designed for buyers who know what they want and want it fast. Browse listings, add to cart, and pay securely. The system automatically matches your order with the seller, processes payment through our escrow system, and notifies both parties. No back-and-forth, no delays — just instant purchasing.',
    href: '/tradbuy',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: FileText,
    name: 'RFQ',
    tagline: 'Smart Negotiation',
    description:
      'Submit requests for quotes and receive competitive bids from verified sellers in real-time.',
    details:
      'Can\'t find what you need at the right price? Post an RFQ (Request for Quote) with your requirements — product specs, quantity, budget, and location. Our AI system intelligently routes your RFQ to the most relevant verified sellers. Compare bids side-by-side, negotiate terms, and close the deal on your terms.',
    href: '/rfq',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Scale,
    name: 'Trade Matching',
    tagline: 'AI-Powered Match',
    description:
      'Our intelligent algorithm matches buyers with the right sellers based on product, price, and location.',
    details:
      'The AI Trade Matching engine analyzes thousands of data points — product categories, pricing trends, seller ratings, location proximity, and past trading history — to recommend the perfect trading partners. Whether you\'re a buyer sourcing raw materials or a seller looking for new buyers, our engine finds the best matches for you.',
    href: '/trading',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Shield,
    name: 'Secure Escrow',
    tagline: 'Protected Payments',
    description:
      'Funds are held in escrow until both parties confirm satisfaction, ensuring zero-risk transactions.',
    details:
      'Every transaction on TRADINGO is protected by our multi-layer escrow system. When a buyer makes a payment, the funds are held securely in escrow. The seller ships the goods, and once the buyer confirms receipt and satisfaction, the funds are released to the seller. If there\'s a dispute, our resolution team steps in to ensure fair outcomes.',
    href: '/why-tradingo',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: Award,
    name: 'GOCASH',
    tagline: 'Rewards Engine',
    description:
      'Earn GOCASH rewards on every successful trade and redeem them for platform benefits and discounts.',
    details:
      'GOCASH is our rewards currency that puts money back in your pocket. Earn 2-5% GOCASH on every completed trade. Accumulate rewards in your wallet and redeem them for powerful platform benefits — listing boosts, premium analytics, priority support, and fee discounts. The more you trade, the more you earn.',
    href: '/gocash',
    color: 'from-amber-500 to-yellow-500',
  },
  {
    icon: Zap,
    name: 'TRADGO',
    tagline: 'Gamified Trading',
    description:
      'Participate in trading races, earn badges, climb leaderboards, and unlock exclusive seller perks.',
    details:
      'TRADGO turns trading into a sport. Compete in time-bound trading races, earn achievement badges for milestones, and climb the global leaderboard. Top performers win exclusive rewards — GOCASH multipliers, premium plan upgrades, and recognition across the TRADINGO community. Trading has never been this exciting.',
    href: '/tradgo',
    color: 'from-rose-500 to-pink-500',
  },
];

export default function TradhexaPage() {
  return (
    <>
      <PageHeader
        title="TRADHEXA™"
        description="Six powerful trading engines powering the TRADINGO TEM™ ecosystem."
      />

      {/* Overview */}
      <section className="py-20">
        <div className="container-main">
          <AnimatedSection>
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold sm:text-4xl dark:text-dark-text-primary">
                The Six Engines of TRADINGO
              </h2>
              <p className="mt-4 text-lg text-text-secondary dark:text-dark-text-secondary">
                TRADHEXA™ is the collective force behind TRADINGO&apos;s TEM™ marketplace. Each engine is
                purpose-built to handle a specific aspect of trading — from instant purchases to gamified
                competition. Together, they create a seamless, secure, and rewarding trading experience.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <Separator />

      {/* All Engines Overview */}
      <section className="py-20 bg-surface-secondary/50 dark:bg-dark-surface-secondary/50">
        <div className="container-main">
          <SectionHeader
            title="Explore All Engines"
            subtitle="Click on any engine to learn more about how it powers your trading experience."
          />
          <TradingEngines />
        </div>
      </section>

      <Separator />

      {/* Detailed Engine Breakdown */}
      <section className="py-20">
        <div className="container-main">
          <SectionHeader
            title="Deep Dive into Each Engine"
            subtitle="Understand how each TRADHEXA™ engine works and how it benefits your business."
          />
          <div className="space-y-16">
            {engines.map((engine, index) => {
              const Icon = engine.icon;
              return (
                <AnimatedSection key={engine.name} delay={index * 100}>
                  <div className="grid gap-8 lg:grid-cols-2 items-center">
                    <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                      <div className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${engine.color}`}>
                        <Icon className="h-8 w-8" />
                      </div>
                      <h3 className="mt-6 text-2xl font-bold text-text-primary dark:text-dark-text-primary">
                        {engine.name}
                        <span className="ml-1 text-sm font-normal text-text-tertiary dark:text-dark-text-tertiary">™</span>
                      </h3>
                      <Badge variant="secondary" className="mt-2">
                        {engine.tagline}
                      </Badge>
                      <p className="mt-4 text-lg text-text-secondary dark:text-dark-text-secondary">
                        {engine.details}
                      </p>
                      <Link href={engine.href} className="mt-6 inline-block">
                        <Button variant="default" size="lg">
                          Explore {engine.name} <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                    <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                      <Card className="border-border/50 bg-surface-secondary/30 dark:bg-dark-surface-secondary/30">
                        <CardHeader>
                          <CardTitle className="text-lg">Key Benefits</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-3">
                            {[
                              { label: 'Speed', desc: 'Faster transactions and reduced turnaround time' },
                              { label: 'Security', desc: 'Protected by TRADINGO escrow and verification' },
                              { label: 'Efficiency', desc: 'Automated processes reduce manual effort' },
                              { label: 'Rewards', desc: 'Earn GOCASH on every transaction' },
                            ].map((benefit) => (
                              <li key={benefit.label} className="flex items-start gap-3">
                                <div className="mt-1.5 h-2 w-2 rounded-full bg-primary-500" />
                                <div>
                                  <span className="font-medium text-text-primary dark:text-dark-text-primary">{benefit.label}</span>
                                  <p className="text-sm text-text-secondary dark:text-dark-text-secondary">{benefit.desc}</p>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      <Separator />

      {/* How TRADHEXA Works Together */}
      <section className="py-20 bg-surface-secondary/50 dark:bg-dark-surface-secondary/50">
        <div className="container-main">
          <AnimatedSection>
            <div className="mx-auto max-w-4xl text-center">
              <SectionHeader
                title="How the Engines Work Together"
                subtitle="TRADHEXA™ isn\'t just six separate tools — it\'s an integrated ecosystem where each engine amplifies the others."
              />
              <div className="grid gap-6 sm:grid-cols-3">
                {[
                  { step: '1', title: 'Discover & Match', desc: 'Use Trade Matching and RFQ to find the right products and partners.' },
                  { step: '2', title: 'Transact & Protect', desc: 'Buy instantly with TRADBUY or negotiate via RFQ. Escrow secures every payment.' },
                  { step: '3', title: 'Earn & Compete', desc: 'Collect GOCASH rewards and join TRADGO races to maximize your benefits.' },
                ].map((item) => (
                  <div key={item.step} className="rounded-xl border border-border bg-surface p-6 shadow-sm dark:bg-dark-surface dark:border-dark-border">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-lg font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                      {item.step}
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-text-primary dark:text-dark-text-primary">{item.title}</h3>
                    <p className="mt-2 text-sm text-text-secondary dark:text-dark-text-secondary">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <CTABlock
        title="Explore Our Platform"
        subtitle="Experience all six TRADHEXA™ engines firsthand. Create your free account and start trading today."
        primaryLabel="Get Started Free"
        primaryHref="/register"
        secondaryLabel="Browse Products"
        secondaryHref="/products"
        variant="accent"
      />
    </>
  );
}
